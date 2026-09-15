-- Step 3b of supabase/SCHEMA_ROADMAP.md: materials, colours and styles.
--
-- HAND-WRITTEN, consistent with every prior migration in this project: `db diff` does not
-- reliably capture RLS policies or grants, and this adds nine policies across six tables.
--
-- Purely additive — six new tables, no changes to existing ones, nothing backfilled. Safe
-- to apply to production with live rows: existing products simply carry no attributes.

begin;

-- ---------------------------------------------------------------------------
-- Lookup vocabularies
-- ---------------------------------------------------------------------------

create table if not exists "public"."materials" (
    "code" "text" not null,
    "sort_order" smallint not null,
    "label_ka" "text" not null,
    "label_en" "text" not null,
    constraint "materials_code_check"
        check (("code" ~ '^[a-z][a-z0-9_]{1,30}$'::"text")),
    constraint "materials_sort_order_check" check (("sort_order" >= 0)),
    constraint "materials_label_ka_check"
        check ((("char_length"("btrim"("label_ka")) >= 2)
            and ("char_length"("label_ka") <= 80))),
    constraint "materials_label_en_check"
        check ((("char_length"("btrim"("label_en")) >= 2)
            and ("char_length"("label_en") <= 80)))
);

alter table "public"."materials" owner to "postgres";

alter table only "public"."materials"
    add constraint "materials_pkey" primary key ("code");

alter table only "public"."materials"
    add constraint "materials_sort_order_key" unique ("sort_order");

create table if not exists "public"."colours" (
    "code" "text" not null,
    "sort_order" smallint not null,
    "label_ka" "text" not null,
    "label_en" "text" not null,
    "hex" "text" not null,
    constraint "colours_code_check"
        check (("code" ~ '^[a-z][a-z0-9_]{1,30}$'::"text")),
    constraint "colours_sort_order_check" check (("sort_order" >= 0)),
    constraint "colours_label_ka_check"
        check ((("char_length"("btrim"("label_ka")) >= 2)
            and ("char_length"("label_ka") <= 80))),
    constraint "colours_label_en_check"
        check ((("char_length"("btrim"("label_en")) >= 2)
            and ("char_length"("label_en") <= 80))),
    constraint "colours_hex_check"
        check (("hex" ~ '^#[0-9a-f]{6}$'::"text"))
);

alter table "public"."colours" owner to "postgres";

alter table only "public"."colours"
    add constraint "colours_pkey" primary key ("code");

alter table only "public"."colours"
    add constraint "colours_sort_order_key" unique ("sort_order");

create table if not exists "public"."styles" (
    "code" "text" not null,
    "sort_order" smallint not null,
    "label_ka" "text" not null,
    "label_en" "text" not null,
    constraint "styles_code_check"
        check (("code" ~ '^[a-z][a-z0-9_]{1,30}$'::"text")),
    constraint "styles_sort_order_check" check (("sort_order" >= 0)),
    constraint "styles_label_ka_check"
        check ((("char_length"("btrim"("label_ka")) >= 2)
            and ("char_length"("label_ka") <= 80))),
    constraint "styles_label_en_check"
        check ((("char_length"("btrim"("label_en")) >= 2)
            and ("char_length"("label_en") <= 80)))
);

alter table "public"."styles" owner to "postgres";

alter table only "public"."styles"
    add constraint "styles_pkey" primary key ("code");

alter table only "public"."styles"
    add constraint "styles_sort_order_key" unique ("sort_order");

-- ---------------------------------------------------------------------------
-- Join tables
-- ---------------------------------------------------------------------------

create table if not exists "public"."product_materials" (
    "product_id" "uuid" not null,
    "material_code" "text" not null
);

alter table "public"."product_materials" owner to "postgres";

alter table only "public"."product_materials"
    add constraint "product_materials_pkey" primary key ("product_id", "material_code");

alter table only "public"."product_materials"
    add constraint "product_materials_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id")
    on update cascade on delete cascade;

alter table only "public"."product_materials"
    add constraint "product_materials_material_code_fkey"
    foreign key ("material_code") references "public"."materials"("code")
    on update cascade on delete restrict;

create index if not exists "product_materials_material_code_idx"
    on "public"."product_materials" using "btree" ("material_code");

create table if not exists "public"."product_colours" (
    "product_id" "uuid" not null,
    "colour_code" "text" not null
);

alter table "public"."product_colours" owner to "postgres";

alter table only "public"."product_colours"
    add constraint "product_colours_pkey" primary key ("product_id", "colour_code");

alter table only "public"."product_colours"
    add constraint "product_colours_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id")
    on update cascade on delete cascade;

alter table only "public"."product_colours"
    add constraint "product_colours_colour_code_fkey"
    foreign key ("colour_code") references "public"."colours"("code")
    on update cascade on delete restrict;

create index if not exists "product_colours_colour_code_idx"
    on "public"."product_colours" using "btree" ("colour_code");

create table if not exists "public"."product_styles" (
    "product_id" "uuid" not null,
    "style_code" "text" not null
);

alter table "public"."product_styles" owner to "postgres";

alter table only "public"."product_styles"
    add constraint "product_styles_pkey" primary key ("product_id", "style_code");

alter table only "public"."product_styles"
    add constraint "product_styles_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id")
    on update cascade on delete cascade;

alter table only "public"."product_styles"
    add constraint "product_styles_style_code_fkey"
    foreign key ("style_code") references "public"."styles"("code")
    on update cascade on delete restrict;

create index if not exists "product_styles_style_code_idx"
    on "public"."product_styles" using "btree" ("style_code");

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

insert into "public"."materials" ("code", "sort_order", "label_ka", "label_en") values
    ('oak',       0, 'მუხა',            'Oak'),
    ('pine',      1, 'ფიჭვი',           'Pine'),
    ('beech',     2, 'წიფელი',          'Beech'),
    ('walnut',    3, 'კაკალი',          'Walnut'),
    ('mdf',       4, 'მდფ',             'MDF'),
    ('plywood',   5, 'ფანერა',          'Plywood'),
    ('metal',     6, 'ლითონი',          'Metal'),
    ('glass',     7, 'შუშა',            'Glass'),
    ('marble',    8, 'მარმარილო',       'Marble'),
    ('rattan',    9, 'როტანგი',         'Rattan'),
    ('leather',  10, 'ტყავი',           'Leather'),
    ('faux_leather', 11, 'ხელოვნური ტყავი', 'Faux leather'),
    ('linen',    12, 'სელი',            'Linen'),
    ('cotton',   13, 'ბამბა',           'Cotton'),
    ('velvet',   14, 'ხავერდი',         'Velvet'),
    ('boucle',   15, 'ბუკლე',           'Boucle'),
    ('plastic',  16, 'პლასტიკი',        'Plastic')
on conflict ("code") do nothing;

insert into "public"."colours" ("code", "sort_order", "label_ka", "label_en", "hex") values
    ('white',  0, 'თეთრი',        'White',  '#f5f3ef'),
    ('cream',  1, 'კრემისფერი',   'Cream',  '#e8dcc8'),
    ('beige',  2, 'ბეჟი',         'Beige',  '#d6c3a5'),
    ('grey',   3, 'ნაცრისფერი',   'Grey',   '#9a9a95'),
    ('black',  4, 'შავი',         'Black',  '#2a2a28'),
    ('brown',  5, 'ყავისფერი',    'Brown',  '#6b4a2f'),
    ('natural',6, 'ბუნებრივი ხე', 'Natural wood', '#c08e4e'),
    ('green',  7, 'მწვანე',       'Green',  '#4a6b4f'),
    ('blue',   8, 'ლურჯი',        'Blue',   '#3f5b7a'),
    ('red',    9, 'წითელი',       'Red',    '#8c3a2e'),
    ('burgundy', 10, 'შინდისფერი', 'Burgundy', '#5c2733'),
    ('yellow', 11, 'ყვითელი',     'Yellow', '#c9a227'),
    ('pink',   12, 'ვარდისფერი',  'Pink',   '#c98f9a')
on conflict ("code") do nothing;

insert into "public"."styles" ("code", "sort_order", "label_ka", "label_en") values
    ('modern',      0, 'თანამედროვე',   'Modern'),
    ('classic',     1, 'კლასიკური',     'Classic'),
    ('scandinavian',2, 'სკანდინავიური', 'Scandinavian'),
    ('vintage',     3, 'ვინტაჟური',     'Vintage'),
    ('industrial',  4, 'ინდუსტრიული',   'Industrial'),
    ('minimal',     5, 'მინიმალისტური', 'Minimal'),
    ('rustic',      6, 'რუსტიკული',     'Rustic')
on conflict ("code") do nothing;

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------
--
-- Revoked before granting: Supabase's default privileges leave a new table fully granted
-- to anon, and `grant select` alone adds without removing. See schemas/07_grants_and_rls.sql.

revoke all on table "public"."materials" from "anon";
revoke all on table "public"."materials" from "authenticated";
grant select on table "public"."materials" to "anon";
grant select, insert, update, delete on table "public"."materials" to "authenticated";
grant all on table "public"."materials" to "service_role";

revoke all on table "public"."colours" from "anon";
revoke all on table "public"."colours" from "authenticated";
grant select on table "public"."colours" to "anon";
grant select, insert, update, delete on table "public"."colours" to "authenticated";
grant all on table "public"."colours" to "service_role";

revoke all on table "public"."styles" from "anon";
revoke all on table "public"."styles" from "authenticated";
grant select on table "public"."styles" to "anon";
grant select, insert, update, delete on table "public"."styles" to "authenticated";
grant all on table "public"."styles" to "service_role";

revoke all on table "public"."product_materials" from "anon";
revoke all on table "public"."product_materials" from "authenticated";
grant select on table "public"."product_materials" to "anon";
grant select, insert, update, delete on table "public"."product_materials" to "authenticated";
grant all on table "public"."product_materials" to "service_role";

revoke all on table "public"."product_colours" from "anon";
revoke all on table "public"."product_colours" from "authenticated";
grant select on table "public"."product_colours" to "anon";
grant select, insert, update, delete on table "public"."product_colours" to "authenticated";
grant all on table "public"."product_colours" to "service_role";

revoke all on table "public"."product_styles" from "anon";
revoke all on table "public"."product_styles" from "authenticated";
grant select on table "public"."product_styles" to "anon";
grant select, insert, update, delete on table "public"."product_styles" to "authenticated";
grant all on table "public"."product_styles" to "service_role";

alter table "public"."materials" enable row level security;
alter table "public"."colours" enable row level security;
alter table "public"."styles" enable row level security;
alter table "public"."product_materials" enable row level security;
alter table "public"."product_colours" enable row level security;
alter table "public"."product_styles" enable row level security;

create policy "Materials are publicly readable" on "public"."materials"
    for select to "authenticated", "anon" using (true);

create policy "Colours are publicly readable" on "public"."colours"
    for select to "authenticated", "anon" using (true);

create policy "Styles are publicly readable" on "public"."styles"
    for select to "authenticated", "anon" using (true);

-- The products read policy hides draft/archived rows but does NOT cascade to child tables.
-- Without these EXISTS checks a draft product's attributes would be readable with the
-- publishable key even though the product itself is not — the same leak the condition
-- detail tables guard against.
create policy "Materials of visible products are readable" on "public"."product_materials"
    for select to "authenticated", "anon"
    using (exists (
        select 1 from "public"."products" "p"
        where "p"."id" = "product_materials"."product_id"
    ));

create policy "Colours of visible products are readable" on "public"."product_colours"
    for select to "authenticated", "anon"
    using (exists (
        select 1 from "public"."products" "p"
        where "p"."id" = "product_colours"."product_id"
    ));

create policy "Styles of visible products are readable" on "public"."product_styles"
    for select to "authenticated", "anon"
    using (exists (
        select 1 from "public"."products" "p"
        where "p"."id" = "product_styles"."product_id"
    ));

create policy "Permanent users can manage materials" on "public"."materials"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can manage colours" on "public"."colours"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can manage styles" on "public"."styles"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can manage product materials" on "public"."product_materials"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can manage product colours" on "public"."product_colours"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can manage product styles" on "public"."product_styles"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

commit;
