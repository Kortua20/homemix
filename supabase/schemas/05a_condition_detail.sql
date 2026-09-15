-- Step 2 of supabase/SCHEMA_ROADMAP.md: the condition detail tables.
--
-- Depends on products and product_images, so it loads after 05_product_images.sql.
--
-- Why two tables rather than more columns on products:
--   * A product has a variable number of flaws, and each needs its own photo link.
--   * Aspects are a fixed vocabulary, but their grades vary per product, and a product may
--     legitimately have no upholstery or no moving parts — a column per aspect would be a
--     wide table of mostly-NULLs with no way to say "not applicable" distinctly.
--
-- Both tables are scoped to used items. Nothing here constrains `new_stocked` products,
-- which have no condition data by the CHECK in 03_products.sql.

-- ---------------------------------------------------------------------------
-- condition_aspects — the fixed vocabulary
-- ---------------------------------------------------------------------------

-- A lookup table for the same reasons as condition_grades: reorderable, relabelable, and
-- the Georgian display text lives with the data rather than in two applications.
create table if not exists "public"."condition_aspects" (
    "code" "text" not null,
    "sort_order" smallint not null,
    "label_ka" "text" not null,
    "label_en" "text" not null,
    "description_ka" "text" default ''::"text" not null,
    constraint "condition_aspects_code_check"
        check (("code" ~ '^[a-z][a-z0-9_]{1,30}$'::"text")),
    constraint "condition_aspects_sort_order_check"
        check (("sort_order" >= 0)),
    constraint "condition_aspects_label_ka_check"
        check ((("char_length"("btrim"("label_ka")) >= 2)
            and ("char_length"("label_ka") <= 80))),
    constraint "condition_aspects_label_en_check"
        check ((("char_length"("btrim"("label_en")) >= 2)
            and ("char_length"("label_en") <= 80))),
    constraint "condition_aspects_description_ka_check"
        check (("char_length"("description_ka") <= 500))
);

alter table "public"."condition_aspects" owner to "postgres";

alter table only "public"."condition_aspects"
    add constraint "condition_aspects_pkey" primary key ("code");

alter table only "public"."condition_aspects"
    add constraint "condition_aspects_sort_order_key" unique ("sort_order");

-- Reference data, seeded here for the same reason as condition_grades: the application
-- depends on these rows existing.
--
-- `odour` is included deliberately. It is the flaw second-hand upholstery buyers care
-- about most and the one most shops quietly omit; naming it is the point.
insert into "public"."condition_aspects"
    ("code", "sort_order", "label_ka", "label_en", "description_ka")
values
    ('structure',  0, 'კონსტრუქცია',   'Structure',
        'კარკასის სიმტკიცე და მდგრადობა.'),
    ('surface',    1, 'ზედაპირი',       'Surface',
        'ხის, ლაქის ან საღებავის მდგომარეობა — ნაკაწრები, ლაქები, გახუნება.'),
    ('upholstery', 2, 'რბილი ნაწილი',   'Upholstery',
        'ქსოვილი, ტყავი და ბალიშები. ეხება მხოლოდ რბილ ავეჯს.'),
    ('hardware',   3, 'მექანიზმები',     'Hardware',
        'უჯრები, ანჯამები, ბორბლები და სხვა მოძრავი ნაწილები.'),
    ('odour',      4, 'სუნი',            'Odour',
        'უცხო სუნი — თამბაქო, ნესტი, შინაური ცხოველი.')
on conflict ("code") do nothing;

-- ---------------------------------------------------------------------------
-- product_condition_aspects — per-product, per-aspect grades
-- ---------------------------------------------------------------------------

-- A single overall grade is too coarse to be trusted. Rating aspects separately lets a
-- buyer decide whether the wear matters *for them* — someone planning to refinish a table
-- top does not care about ring marks, but does care about a wobbling frame.
create table if not exists "public"."product_condition_aspects" (
    "product_id" "uuid" not null,
    "aspect_code" "text" not null,
    "grade_code" "text" not null,
    "note" "text",
    "created_at" timestamp with time zone default "now"() not null,
    constraint "product_condition_aspects_note_check"
        check (("char_length"("note") <= 500))
);

alter table "public"."product_condition_aspects" owner to "postgres";

-- Composite primary key: one grade per aspect per product. Re-rating an aspect is an
-- UPDATE or an upsert, never a second row.
alter table only "public"."product_condition_aspects"
    add constraint "product_condition_aspects_pkey"
    primary key ("product_id", "aspect_code");

-- CASCADE: deleting a product removes its aspect ratings, matching product_images.
alter table only "public"."product_condition_aspects"
    add constraint "product_condition_aspects_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id")
    on update cascade on delete cascade;

-- RESTRICT on both lookups: a vocabulary entry still in use cannot be deleted.
alter table only "public"."product_condition_aspects"
    add constraint "product_condition_aspects_aspect_code_fkey"
    foreign key ("aspect_code") references "public"."condition_aspects"("code")
    on update cascade on delete restrict;

alter table only "public"."product_condition_aspects"
    add constraint "product_condition_aspects_grade_code_fkey"
    foreign key ("grade_code") references "public"."condition_grades"("code")
    on update cascade on delete restrict;

create index if not exists "product_condition_aspects_product_id_idx"
    on "public"."product_condition_aspects" using "btree" ("product_id");

-- ---------------------------------------------------------------------------
-- product_flaws — itemised defects, each optionally anchored to a photo
-- ---------------------------------------------------------------------------

-- The trust mechanism. A flaw listed only as text reads as a disclaimer and gets skimmed;
-- a flaw that jumps to its own close-up photo reads as evidence.
--
-- `image_id` is NULLABLE by design: some real flaws have no meaningful photo (an odour, a
-- slight wobble), and forcing a photo would either block honest disclosure or produce
-- decorative images that prove nothing.
create table if not exists "public"."product_flaws" (
    "id" "uuid" default "gen_random_uuid"() not null,
    "product_id" "uuid" not null,
    "image_id" "uuid",
    "flaw_type" "text" not null,
    "severity" "text" not null,
    "location_ka" "text",
    "note_ka" "text" not null,
    "sort_order" integer default 0 not null,
    "created_at" timestamp with time zone default "now"() not null,
    constraint "product_flaws_flaw_type_check"
        check (("flaw_type" = any (array[
            'scratch'::"text",      -- ნაკაწრი
            'dent'::"text",         -- ჩაჭყლეტა
            'stain'::"text",        -- ლაქა
            'chip'::"text",         -- ჩამოტეხილი
            'crack'::"text",        -- ბზარი
            'fade'::"text",         -- გახუნებული
            'wear'::"text",         -- ცვეთა
            'odour'::"text",        -- სუნი
            'missing_part'::"text", -- ნაკლული დეტალი
            'repair'::"text",       -- შეკეთებული
            'other'::"text"]))),
    -- Three levels, not five: severity is a judgement call, and a finer scale would imply
    -- a precision the person listing the item cannot actually apply consistently.
    constraint "product_flaws_severity_check"
        check (("severity" = any (array[
            'minor'::"text", 'moderate'::"text", 'significant'::"text"]))),
    constraint "product_flaws_location_ka_check"
        check (("char_length"("location_ka") <= 160)),
    -- NOT NULL and non-empty: a flaw with no description documents nothing.
    constraint "product_flaws_note_ka_check"
        check ((("char_length"("btrim"("note_ka")) >= 2)
            and ("char_length"("note_ka") <= 500))),
    constraint "product_flaws_sort_order_check"
        check (("sort_order" >= 0))
);

alter table "public"."product_flaws" owner to "postgres";

alter table only "public"."product_flaws"
    add constraint "product_flaws_pkey" primary key ("id");

alter table only "public"."product_flaws"
    add constraint "product_flaws_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id")
    on update cascade on delete cascade;

-- SET NULL, not CASCADE: deleting a photo must not silently delete the flaw it documented.
-- The flaw text survives and can be re-anchored to a new photo. Deleting disclosure as a
-- side effect of tidying up images would be exactly the wrong failure mode.
alter table only "public"."product_flaws"
    add constraint "product_flaws_image_id_fkey"
    foreign key ("image_id") references "public"."product_images"("id")
    on update cascade on delete set null;

create index if not exists "product_flaws_product_id_sort_order_idx"
    on "public"."product_flaws" using "btree" ("product_id", "sort_order", "created_at");

create index if not exists "product_flaws_image_id_idx"
    on "public"."product_flaws" using "btree" ("image_id")
    where ("image_id" is not null);
