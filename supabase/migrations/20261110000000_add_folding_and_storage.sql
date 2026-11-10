-- Folding/transforming mechanisms, unfolded dimensions, and built-in storage.
--
-- HAND-WRITTEN, like the dimensions and length migrations, because it carries grants and
-- RLS for a new table, which `db diff` does not capture reliably (see supabase/README.md).
--
-- Purely additive and idempotent:
--   * one new lookup table, seeded, with the same grants and policies as `materials`;
--   * five new nullable columns plus `is_foldable`, whose DEFAULT false is backfilled into
--     every existing row in the same statement — accurate for display, since a false is
--     never shown to customers (see the column comment in schemas/03_products.sql);
--   * `has_storage` is deliberately left NULL ("not specified") on existing rows rather than
--     defaulted to false, so no current listing starts claiming it has no storage.
--
-- Safe to apply before either app is deployed: nothing existing reads or writes these
-- columns, and the new CHECK holds for every existing row (all are not foldable and have no
-- mechanism or unfolded size).

begin;

-- ---------------------------------------------------------------------------
-- Lookup table
-- ---------------------------------------------------------------------------

create table if not exists "public"."folding_mechanisms" (
    "code" "text" not null,
    "sort_order" smallint not null,
    "group_code" "text" not null,
    "label_ka" "text" not null,
    "label_en" "text" not null,
    constraint "folding_mechanisms_code_check"
        check (("code" ~ '^[a-z][a-z0-9_]{1,30}$'::"text")),
    constraint "folding_mechanisms_sort_order_check"
        check (("sort_order" >= 0)),
    constraint "folding_mechanisms_group_code_check"
        check (("group_code" = any (array['seating'::"text", 'table'::"text"]))),
    constraint "folding_mechanisms_label_ka_check"
        check ((("char_length"("btrim"("label_ka")) >= 2)
            and ("char_length"("label_ka") <= 80))),
    constraint "folding_mechanisms_label_en_check"
        check ((("char_length"("btrim"("label_en")) >= 2)
            and ("char_length"("label_en") <= 80))),
    constraint "folding_mechanisms_pkey" primary key ("code"),
    constraint "folding_mechanisms_sort_order_key" unique ("sort_order")
);

alter table "public"."folding_mechanisms" owner to "postgres";

insert into "public"."folding_mechanisms"
    ("code", "sort_order", "group_code", "label_ka", "label_en")
values
    ('book',             0, 'seating', 'წიგნი',                  'Book'),
    ('eurobook',         1, 'seating', 'ევროწიგნი',              'Eurobook'),
    ('tick_tock',        2, 'seating', 'ტიკ-ტაკი',               'Tick-tock (pantograph)'),
    ('dolphin',          3, 'seating', 'დელფინი',                'Dolphin'),
    ('accordion',        4, 'seating', 'აკორდეონი',              'Accordion'),
    ('french_folding',   5, 'seating', 'ფრანგული გასაშლელი',     'French folding bed'),
    ('american_folding', 6, 'seating', 'ამერიკული გასაშლელი',    'American folding bed (sedaflex)'),
    ('roll_out',         7, 'seating', 'გასაგორებელი',           'Roll-out'),
    ('click_clack',      8, 'seating', 'კლიკ-კლაკი',             'Click-clack'),
    ('recliner',         9, 'seating', 'რელაქს მექანიზმი',       'Recliner'),
    ('butterfly',      100, 'table',   'პეპელა (ბატერფლაი)',      'Butterfly leaf'),
    ('lift_top',       101, 'table',   'ლიფტ-მექანიზმი (ტრანსფორმერი)', 'Lift-top (transformer)'),
    ('drop_leaf',      102, 'table',   'გვერდითა ფრთები',        'Drop leaf'),
    ('pull_out',       103, 'table',   'გამოსაწევი სისტემა',     'Pull-out extension'),
    ('folding',        104, 'table',   'დასაკეცი',               'Folding')
on conflict ("code") do nothing;

-- Revoke first: Supabase's default privileges grant ALL on new public tables to anon.
-- See migrations/20260912000000_tighten_catalog_table_grants.sql.
revoke all on table "public"."folding_mechanisms" from "anon";
revoke all on table "public"."folding_mechanisms" from "authenticated";
grant select on table "public"."folding_mechanisms" to "anon";
grant select, insert, update, delete on table "public"."folding_mechanisms" to "authenticated";
grant all on table "public"."folding_mechanisms" to "service_role";

alter table "public"."folding_mechanisms" enable row level security;

drop policy if exists "Folding mechanisms are publicly readable" on "public"."folding_mechanisms";
create policy "Folding mechanisms are publicly readable" on "public"."folding_mechanisms"
    for select to "authenticated", "anon" using (true);

drop policy if exists "Permanent users can manage folding mechanisms" on "public"."folding_mechanisms";
create policy "Permanent users can manage folding mechanisms" on "public"."folding_mechanisms"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

-- ---------------------------------------------------------------------------
-- Product columns
-- ---------------------------------------------------------------------------

alter table "public"."products"
    add column if not exists "is_foldable" boolean default false not null,
    add column if not exists "folding_mechanism" "text",
    add column if not exists "unfolded_width_cm" numeric(7,1),
    add column if not exists "unfolded_length_cm" numeric(7,1),
    add column if not exists "unfolded_height_cm" numeric(7,1),
    add column if not exists "has_storage" boolean;

alter table "public"."products"
    drop constraint if exists "products_unfolded_width_cm_check",
    drop constraint if exists "products_unfolded_length_cm_check",
    drop constraint if exists "products_unfolded_height_cm_check",
    drop constraint if exists "products_folding_matches_foldable_check",
    drop constraint if exists "products_folding_mechanism_fkey";

alter table "public"."products"
    add constraint "products_unfolded_width_cm_check"
        check (("unfolded_width_cm" is null)
            or (("unfolded_width_cm" > 0) and ("unfolded_width_cm" <= 2000))),
    add constraint "products_unfolded_length_cm_check"
        check (("unfolded_length_cm" is null)
            or (("unfolded_length_cm" > 0) and ("unfolded_length_cm" <= 2000))),
    add constraint "products_unfolded_height_cm_check"
        check (("unfolded_height_cm" is null)
            or (("unfolded_height_cm" > 0) and ("unfolded_height_cm" <= 2000))),
    add constraint "products_folding_matches_foldable_check"
        check (("is_foldable")
            or (("folding_mechanism" is null)
                and ("unfolded_width_cm" is null)
                and ("unfolded_length_cm" is null)
                and ("unfolded_height_cm" is null))),
    add constraint "products_folding_mechanism_fkey"
        foreign key ("folding_mechanism") references "public"."folding_mechanisms"("code")
        on update cascade on delete restrict;

-- No new index. The catalogue is small, and the folding/storage filters always run
-- alongside the status = 'available' partial indexes that already narrow the scan. Revisit
-- if EXPLAIN on the filtered catalogue query ever shows a sequential scan that matters.

commit;
