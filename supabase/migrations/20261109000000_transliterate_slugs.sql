-- Transliterate every Georgian slug to Latin, and keep the old URLs working.
--
-- HAND-WRITTEN: it creates grants, RLS policies and triggers, and rewrites data, none of
-- which `db diff` captures reliably (see supabase/README.md). Three parts, in this order:
--
--   1. schemas/09_slug_redirects.sql verbatim — the redirect tables and the triggers that
--      fill them. They must exist BEFORE part 2, so the rename below records every old
--      slug exactly like an admin edit would.
--   2. A one-time rewrite of every slug that is not already lowercase ASCII, using
--      Georgia's national romanization (2002) without apostrophes — the same system the
--      admin's lib/slug.ts uses for new slugs. Collisions (ტ and თ both become "t", etc.)
--      get "-2", "-3" in age order, so the oldest row keeps the clean slug.
--   3. The slug CHECK constraints narrowed to ASCII, so no Georgian slug can come back.
--
-- Deploy order:
--   a. Ship the admin (Latin-only createSlug) and the storefront (redirect lookup) first.
--      Both work against the database before AND after this migration.
--   b. Push this migration.
--   c. Redeploy the storefront, so prerendered pages at the old slugs leave the ISR cache
--      immediately instead of within the next 60 s revalidate window.
-- Running (b) before (a) makes the deployed admin's Georgian slugs fail the new CHECK.

begin;

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

-- ---------------------------------------------------------------------------
-- One-time data rewrite (not part of the declarative schema)
-- ---------------------------------------------------------------------------

-- pg_temp: exists for this session only, so nothing is left behind in the schema.
create function pg_temp.transliterate_slug("p_slug" "text") returns "text"
    language "sql" immutable
    as $$
  select trim(both '-' from regexp_replace(
           string_agg(coalesce(m.latin, t.ch), '' order by t.ord),
           '[^a-z0-9]+', '-', 'g'))
  from regexp_split_to_table(p_slug, '') with ordinality as t(ch, ord)
  left join (values
    ('ა', 'a'), ('ბ', 'b'), ('გ', 'g'), ('დ', 'd'), ('ე', 'e'), ('ვ', 'v'),
    ('ზ', 'z'), ('თ', 't'), ('ი', 'i'), ('კ', 'k'), ('ლ', 'l'), ('მ', 'm'),
    ('ნ', 'n'), ('ო', 'o'), ('პ', 'p'), ('ჟ', 'zh'), ('რ', 'r'), ('ს', 's'),
    ('ტ', 't'), ('უ', 'u'), ('ფ', 'p'), ('ქ', 'k'), ('ღ', 'gh'), ('ყ', 'q'),
    ('შ', 'sh'), ('ჩ', 'ch'), ('ც', 'ts'), ('ძ', 'dz'), ('წ', 'ts'), ('ჭ', 'ch'),
    ('ხ', 'kh'), ('ჯ', 'j'), ('ჰ', 'h')
  ) as m(ka, latin) on m.ka = t.ch
$$;

-- Picks a free slug: the transliteration itself, else "-2", "-3", ... Truncated to the
-- column's limit first, since a transliteration is longer than its source (ჟ → zh).
create function pg_temp.free_slug("p_base" "text", "p_max" integer, "p_taken" "text"[])
returns "text"
    language "plpgsql" immutable
    as $$
declare
  v_base text := rtrim(left(p_base, p_max), '-');
  v_candidate text := v_base;
  v_n integer := 1;
begin
  while v_candidate = any (p_taken) loop
    v_n := v_n + 1;
    v_candidate := rtrim(left(v_base, p_max - length(v_n::text) - 1), '-') || '-' || v_n;
  end loop;
  return v_candidate;
end;
$$;

do $$
declare
  r record;
  v_slug text;
begin
  -- No created_at on categories; name order is stable and deterministic.
  for r in
    select id, slug from public.categories
    where slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    order by name
  loop
    v_slug := pg_temp.free_slug(
      pg_temp.transliterate_slug(r.slug), 80,
      array(select slug from public.categories where id <> r.id));
    update public.categories set slug = v_slug where id = r.id;
  end loop;

  for r in
    select id, slug from public.products
    where slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    order by created_at, id
  loop
    v_slug := pg_temp.free_slug(
      pg_temp.transliterate_slug(r.slug), 160,
      array(select slug from public.products where id <> r.id));
    update public.products set slug = v_slug where id = r.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Narrow the CHECKs to match schemas/02_categories.sql and schemas/03_products.sql
-- ---------------------------------------------------------------------------

alter table "public"."categories" drop constraint "categories_slug_check";
alter table "public"."categories" add constraint "categories_slug_check"
    check (((("char_length"("slug") >= 2) and ("char_length"("slug") <= 80))
        and ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::"text")));

alter table "public"."products" drop constraint "products_slug_check";
alter table "public"."products" add constraint "products_slug_check"
    check (((("char_length"("slug") >= 2) and ("char_length"("slug") <= 160))
        and ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::"text")));

commit;
