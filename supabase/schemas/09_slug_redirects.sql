-- Old slugs → the row that now owns them, so a renamed product or category keeps its old
-- URL working (the storefront answers it with a 308 to the current slug).
--
-- Written ONLY by the triggers below, which fire on every slug change from any writer —
-- the admin's edit form and bulk migrations alike — so no application code has to
-- remember to record a rename.
--
-- Keyed by old slug and pointing at the row id, not at the next slug: a slug renamed twice
-- (a → b → c) resolves a and b straight to the row, and the storefront reads its current
-- slug from there. No chains to follow.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists "public"."product_slug_redirects" (
    "old_slug" "text" not null,
    "product_id" "uuid" not null,
    "created_at" timestamp with time zone default "now"() not null
);

alter table "public"."product_slug_redirects" owner to "postgres";

alter table only "public"."product_slug_redirects"
    add constraint "product_slug_redirects_pkey" primary key ("old_slug");

alter table only "public"."product_slug_redirects"
    add constraint "product_slug_redirects_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id") on delete cascade;

-- FK lookups on delete cascade, and the RLS EXISTS below.
create index if not exists "product_slug_redirects_product_id_idx"
    on "public"."product_slug_redirects" using "btree" ("product_id");

create table if not exists "public"."category_slug_redirects" (
    "old_slug" "text" not null,
    "category_id" "uuid" not null,
    "created_at" timestamp with time zone default "now"() not null
);

alter table "public"."category_slug_redirects" owner to "postgres";

alter table only "public"."category_slug_redirects"
    add constraint "category_slug_redirects_pkey" primary key ("old_slug");

alter table only "public"."category_slug_redirects"
    add constraint "category_slug_redirects_category_id_fkey"
    foreign key ("category_id") references "public"."categories"("id") on delete cascade;

create index if not exists "category_slug_redirects_category_id_idx"
    on "public"."category_slug_redirects" using "btree" ("category_id");

-- ---------------------------------------------------------------------------
-- Triggers: the only write path
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER because the admin updates slugs as `authenticated`, which has no write
-- grant on the redirect tables — and should not: a redirect is a side effect of a rename,
-- never something to edit directly. Lives in `private`, so it is not callable over the API.
--
-- Two steps, both needed:
--   * the old slug starts redirecting to this row (or is re-pointed, if it once belonged
--     to another row);
--   * the new slug stops redirecting anywhere — it is a live slug again, e.g. a rename
--     undone, or an old slug reused by a new row. A live slug always wins the lookup
--     anyway, so this is housekeeping, not correctness.
create or replace function "private"."record_product_slug_change"()
returns trigger
    language "plpgsql" security definer
    set "search_path" to ''
    as $$
begin
  if tg_op = 'UPDATE' and old.slug is distinct from new.slug then
    insert into public.product_slug_redirects (old_slug, product_id)
    values (old.slug, new.id)
    on conflict (old_slug) do update
    set product_id = excluded.product_id, created_at = now();
  end if;

  delete from public.product_slug_redirects where old_slug = new.slug;
  return null;
end;
$$;

alter function "private"."record_product_slug_change"() owner to "postgres";

create or replace function "private"."record_category_slug_change"()
returns trigger
    language "plpgsql" security definer
    set "search_path" to ''
    as $$
begin
  if tg_op = 'UPDATE' and old.slug is distinct from new.slug then
    insert into public.category_slug_redirects (old_slug, category_id)
    values (old.slug, new.id)
    on conflict (old_slug) do update
    set category_id = excluded.category_id, created_at = now();
  end if;

  delete from public.category_slug_redirects where old_slug = new.slug;
  return null;
end;
$$;

alter function "private"."record_category_slug_change"() owner to "postgres";

create or replace trigger "products_record_slug_change"
    after insert or update of "slug" on "public"."products"
    for each row execute function "private"."record_product_slug_change"();

create or replace trigger "categories_record_slug_change"
    after insert or update of "slug" on "public"."categories"
    for each row execute function "private"."record_category_slug_change"();

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------
-- Kept here rather than in 07_grants_and_rls.sql for the same reason as 08: 07 loads
-- first and these objects do not exist yet at that point.

-- Revoke first: Supabase's default privileges grant ALL on new public tables to anon.
-- See migrations/20260912000000_tighten_catalog_table_grants.sql.
revoke all on table "public"."product_slug_redirects" from "anon";
revoke all on table "public"."product_slug_redirects" from "authenticated";
grant select on table "public"."product_slug_redirects" to "anon";
grant select on table "public"."product_slug_redirects" to "authenticated";
grant all on table "public"."product_slug_redirects" to "service_role";

revoke all on table "public"."category_slug_redirects" from "anon";
revoke all on table "public"."category_slug_redirects" from "authenticated";
grant select on table "public"."category_slug_redirects" to "anon";
grant select on table "public"."category_slug_redirects" to "authenticated";
grant all on table "public"."category_slug_redirects" to "service_role";

alter table "public"."product_slug_redirects" enable row level security;
alter table "public"."category_slug_redirects" enable row level security;

-- Readable exactly when the product is: the subquery runs under the caller's products
-- policies, so an old slug of a draft does not reveal that the draft exists. Same shape
-- as the flaws and view-count policies.
create policy "Redirects of visible products are readable"
    on "public"."product_slug_redirects"
    for select to "authenticated", "anon"
    using (exists (
        select 1 from "public"."products" "p"
        where "p"."id" = "product_slug_redirects"."product_id"
    ));

-- Categories are all public (see "Categories are publicly readable").
create policy "Category redirects are publicly readable"
    on "public"."category_slug_redirects"
    for select to "authenticated", "anon"
    using (true);

revoke all on function "private"."record_product_slug_change"() from public;
revoke all on function "private"."record_category_slug_change"() from public;
