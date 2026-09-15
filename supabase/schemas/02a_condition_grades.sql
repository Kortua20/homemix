-- Condition grades for second-hand items. Referenced by products, so it loads before
-- 03_products.sql (hence the "02a" prefix — inserting here avoids renumbering the
-- existing files and the migration history that refers to them).
--
-- A lookup table rather than a Postgres enum, deliberately:
--   * Reordering or relabelling an enum value requires a migration and a rewrite;
--     here it is an UPDATE.
--   * Display text is needed in Georgian (and possibly English later). An enum would
--     force that mapping into application code, where it would drift between the two
--     apps that share this database.
--   * `sort_order` lets the UI render grades best-to-worst without hard-coding an order.
--
-- The code values are stable identifiers and are what products.condition_grade stores.
-- Treat them as append-only: changing a code breaks existing product rows.

create table if not exists "public"."condition_grades" (
    "code" "text" not null,
    "sort_order" smallint not null,
    "label_ka" "text" not null,
    "label_en" "text" not null,
    "description_ka" "text" default ''::"text" not null,
    constraint "condition_grades_code_check"
        check (("code" ~ '^[a-z][a-z0-9_]{1,30}$'::"text")),
    constraint "condition_grades_sort_order_check"
        check (("sort_order" >= 0)),
    constraint "condition_grades_label_ka_check"
        check ((("char_length"("btrim"("label_ka")) >= 2)
            and ("char_length"("label_ka") <= 80))),
    constraint "condition_grades_label_en_check"
        check ((("char_length"("btrim"("label_en")) >= 2)
            and ("char_length"("label_en") <= 80))),
    constraint "condition_grades_description_ka_check"
        check (("char_length"("description_ka") <= 500))
);

alter table "public"."condition_grades" owner to "postgres";

alter table only "public"."condition_grades"
    add constraint "condition_grades_pkey" primary key ("code");

alter table only "public"."condition_grades"
    add constraint "condition_grades_sort_order_key" unique ("sort_order");

-- The five grades. Seeded here rather than in seed.sql because these are reference data
-- the schema depends on, not sample data: products.condition_grade has a foreign key to
-- this table, so an empty table would make every used product unpublishable. seed.sql is
-- local-only and never runs against production.
--
-- ON CONFLICT DO NOTHING keeps this idempotent and, importantly, non-destructive: it will
-- not overwrite label wording that has been tuned in production.
insert into "public"."condition_grades"
    ("code", "sort_order", "label_ka", "label_en", "description_ka")
values
    ('as_new',      0, 'როგორც ახალი',   'As new',
        'გამოუყენებელი ან ახლისგან განურჩეველი. ხილული დაზიანების გარეშე.'),
    ('excellent',   1, 'შესანიშნავი',     'Excellent',
        'მინიმალური, ძნელად შესამჩნევი ცვეთა. სტრუქტურულად უნაკლო.'),
    ('good',        2, 'კარგი',           'Good',
        'ხილული, მაგრამ ჩვეულებრივი ცვეთა. სრულად ფუნქციური და მდგრადი.'),
    ('fair',        3, 'დამაკმაყოფილებელი', 'Fair',
        'მნიშვნელოვანი ესთეტიკური ცვეთა. ფუნქციურად გამართული.'),
    ('restoration', 4, 'აღსადგენი',       'For restoration',
        'საჭიროებს რესტავრაციას. იყიდება არსებული მდგომარეობით.'),
    -- Not a rung on the quality ladder above — the absence of a rating. sort_order 99 keeps
    -- it last so "roughest items first" ordering stays meaningful.
    --
    -- Exists because the CHECK constraint makes a grade mandatory for used_unique rows,
    -- which is deliberate, but a catalogue migrated from a schema that never recorded
    -- condition has nothing honest to put there. This says "we have not assessed this yet"
    -- instead of inventing a grade. See 20260916000000_add_unassessed_condition_grade.sql.
    ('unassessed', 99, 'შეფასება მიმდინარეობს', 'Assessment in progress',
        'ამ ნივთის მდგომარეობა ჯერ დეტალურად არ შეგვიფასებია. დაგვიკავშირდით ზუსტი ინფორმაციისთვის.')
on conflict ("code") do nothing;
