-- Product view counts, shown on the storefront as "N ნახვა".
--
-- One shared total per product, across every visitor and device. The storefront's
-- /api/product-views route is the only writer: it filters bots, hashes the visitor and
-- calls record_product_view. Nothing here trusts the browser with a number — the browser
-- only reports that a page was opened.
--
-- Two de-duplication layers, both keyed on HMACs computed in the route (raw IPs and
-- user agents are never stored, and the HMAC key rotates daily by mixing in the date):
--
--   * per visitor (ip + user agent): counted at most once per 30 minutes per product,
--     so refreshing does not inflate the number;
--   * per IP: at most 20 counted views per product per UTC day, so a script that rotates
--     its user agent cannot inflate it without also rotating IPs.
--
-- The counter is a separate table rather than a column on `products`: it is written on
-- every view, and keeping that churn off the catalog table keeps it out of the admin's
-- writes and out of the products grants.

-- ---------------------------------------------------------------------------
-- Public, read-only: the total per product
-- ---------------------------------------------------------------------------

create table if not exists "public"."product_view_counts" (
    "product_id" "uuid" not null,
    "view_count" bigint default 0 not null,
    "updated_at" timestamp with time zone default "clock_timestamp"() not null,
    constraint "product_view_counts_view_count_check" check (("view_count" >= 0))
);

alter table "public"."product_view_counts" owner to "postgres";

alter table only "public"."product_view_counts"
    add constraint "product_view_counts_pkey" primary key ("product_id");

alter table only "public"."product_view_counts"
    add constraint "product_view_counts_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id") on delete cascade;

-- ---------------------------------------------------------------------------
-- Private: de-duplication state, unreachable through the Data API
-- ---------------------------------------------------------------------------

create table if not exists "private"."product_view_visitors" (
    "product_id" "uuid" not null,
    "visitor_hash" "text" not null,
    "last_counted_at" timestamp with time zone default "clock_timestamp"() not null
);

alter table "private"."product_view_visitors" owner to "postgres";

alter table only "private"."product_view_visitors"
    add constraint "product_view_visitors_pkey" primary key ("product_id", "visitor_hash");

alter table only "private"."product_view_visitors"
    add constraint "product_view_visitors_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id") on delete cascade;

-- For the periodic prune in record_product_view.
create index if not exists "product_view_visitors_last_counted_at_idx"
    on "private"."product_view_visitors" using "btree" ("last_counted_at");

alter table "private"."product_view_visitors" enable row level security;

create table if not exists "private"."product_view_ip_quota" (
    "product_id" "uuid" not null,
    "ip_hash" "text" not null,
    "day" "date" not null,
    "view_count" smallint default 0 not null,
    constraint "product_view_ip_quota_view_count_check" check (("view_count" >= 0))
);

alter table "private"."product_view_ip_quota" owner to "postgres";

alter table only "private"."product_view_ip_quota"
    add constraint "product_view_ip_quota_pkey" primary key ("product_id", "ip_hash", "day");

alter table only "private"."product_view_ip_quota"
    add constraint "product_view_ip_quota_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id") on delete cascade;

create index if not exists "product_view_ip_quota_day_idx"
    on "private"."product_view_ip_quota" using "btree" ("day");

alter table "private"."product_view_ip_quota" enable row level security;

-- ---------------------------------------------------------------------------
-- The only write path
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER in `public`, so it is reachable with the publishable key — which is
-- public. The shared-secret check is what stops anyone from calling it directly and
-- skipping the route's bot filter; same pattern as reserve_contact_email_quota.
--
-- Returns whether the view was counted. The route ignores it; it exists for testing.
create or replace function "public"."record_product_view"(
    "p_product_id" "uuid", "p_visitor_hash" "text", "p_ip_hash" "text", "p_secret" "text")
returns boolean
    language "plpgsql" security definer
    set "search_path" to ''
    as $$
declare
  v_today date := (clock_timestamp() at time zone 'utc')::date;
begin
  if encode(extensions.digest(p_secret, 'sha256'), 'hex') <>
    '71a91274e887fe251f008ab68af4f6fff847d769a068b994b457bc2b820f7b74'
  then
    raise exception 'invalid product view secret' using errcode = '42501';
  end if;

  if p_visitor_hash !~ '^[0-9a-f]{64}$' or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid visitor hash' using errcode = '22023';
  end if;

  -- Same visibility rule as the public products policy. This function bypasses RLS, so
  -- without it a guessed draft id could be counted.
  if not exists (
    select 1 from public.products as p
    where p.id = p_product_id
      and p.status <> all (array['draft', 'archived'])
  ) then
    return false;
  end if;

  -- Visitor window first: a refreshing visitor must not burn the shared per-IP quota.
  -- ON CONFLICT ... WHERE leaves FOUND false when the row exists and is inside the window.
  insert into private.product_view_visitors as visitors (product_id, visitor_hash, last_counted_at)
  values (p_product_id, p_visitor_hash, clock_timestamp())
  on conflict (product_id, visitor_hash) do update
  set last_counted_at = excluded.last_counted_at
  where visitors.last_counted_at <= clock_timestamp() - interval '30 minutes';

  if not found then
    return false;
  end if;

  insert into private.product_view_ip_quota as quota (product_id, ip_hash, day, view_count)
  values (p_product_id, p_ip_hash, v_today, 1)
  on conflict (product_id, ip_hash, day) do update
  set view_count = quota.view_count + 1
  where quota.view_count < 20;

  if not found then
    return false;
  end if;

  insert into public.product_view_counts as counts (product_id, view_count, updated_at)
  values (p_product_id, 1, clock_timestamp())
  on conflict (product_id) do update
  set view_count = counts.view_count + 1,
      updated_at = clock_timestamp();

  -- No pg_cron on this project, so ~1% of counted views prune state that can no longer
  -- match: visitor hashes rotate daily, so nothing older than a day is ever hit again.
  if random() < 0.01 then
    delete from private.product_view_visitors
    where last_counted_at < clock_timestamp() - interval '1 day';

    delete from private.product_view_ip_quota
    where day < v_today - 1;
  end if;

  return true;
end;
$$;

alter function "public"."record_product_view"(
    "p_product_id" "uuid", "p_visitor_hash" "text", "p_ip_hash" "text", "p_secret" "text")
    owner to "postgres";

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------
-- Kept here rather than in 07_grants_and_rls.sql because 07 loads first and these
-- objects do not exist yet at that point — same reason 06 carries its own grants.

-- Revoke first: Supabase's default privileges grant ALL on new public tables to anon.
-- See migrations/20260912000000_tighten_catalog_table_grants.sql.
revoke all on table "public"."product_view_counts" from "anon";
revoke all on table "public"."product_view_counts" from "authenticated";
grant select on table "public"."product_view_counts" to "anon";
grant select on table "public"."product_view_counts" to "authenticated";
grant all on table "public"."product_view_counts" to "service_role";

alter table "public"."product_view_counts" enable row level security;

-- Visible exactly when the product is: the subquery runs under the caller's products
-- policies, so anon cannot read the count of a draft. Same shape as the flaws policy.
create policy "Counts of visible products are readable" on "public"."product_view_counts"
    for select to "authenticated", "anon"
    using (exists (
        select 1 from "public"."products" "p"
        where "p"."id" = "product_view_counts"."product_id"
    ));

revoke all on table "private"."product_view_visitors" from "anon", "authenticated";
revoke all on table "private"."product_view_ip_quota" from "anon", "authenticated";

revoke all on function "public"."record_product_view"(
    "p_product_id" "uuid", "p_visitor_hash" "text", "p_ip_hash" "text", "p_secret" "text") from public;
grant execute on function "public"."record_product_view"(
    "p_product_id" "uuid", "p_visitor_hash" "text", "p_ip_hash" "text", "p_secret" "text") to "anon";
grant execute on function "public"."record_product_view"(
    "p_product_id" "uuid", "p_visitor_hash" "text", "p_ip_hash" "text", "p_secret" "text") to "service_role";
