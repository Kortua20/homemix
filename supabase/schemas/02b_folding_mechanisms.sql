-- Folding / transforming mechanisms ("გაშლის მექანიზმი"). Referenced by
-- products.folding_mechanism, so it loads before 03_products.sql — "02b" for the same
-- reason condition_grades is "02a": inserting avoids renumbering the existing files.
--
-- A lookup table rather than a Postgres enum or a CHECK list, matching condition_grades
-- and the attribute vocabularies (05b): a new mechanism is an INSERT, not a migration that
-- rewrites a type, and the Georgian labels live in one place instead of being copied into
-- both apps.
--
-- `group_code` exists only so the admin dropdown can separate sofa/armchair mechanisms from
-- table ones. It is deliberately NOT tied to categories: categories are staff-defined and
-- free-form, so "this mechanism is only for sofas" cannot be enforced against them, and
-- a corner sofa-bed in a "ბავშვის ოთახი" category must still be able to say "დელფინი".
--
-- Codes are stable identifiers and append-only, exactly like condition_grades.code.

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
            and ("char_length"("label_en") <= 80)))
);

alter table "public"."folding_mechanisms" owner to "postgres";

alter table only "public"."folding_mechanisms"
    add constraint "folding_mechanisms_pkey" primary key ("code");

alter table only "public"."folding_mechanisms"
    add constraint "folding_mechanisms_sort_order_key" unique ("sort_order");

-- Reference data the schema depends on, so seeded here rather than in seed.sql (see the
-- note in 02a_condition_grades.sql). ON CONFLICT DO NOTHING keeps it idempotent and never
-- overwrites wording later tuned in production.
--
-- sort_order leaves a gap between the groups (0–9 seating, 100+ table) so a new seating
-- mechanism can be added without renumbering the table ones.
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
