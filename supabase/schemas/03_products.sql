-- Products. Depends on categories and condition_grades.
-- Captured from production 2026-09-11; condition/status columns added 2026-09-13.
--
-- A row is either one specific second-hand object (`used_unique`) or a new item held in
-- stock (`new_stocked`). See supabase/SCHEMA_ROADMAP.md for why this is a discriminator on
-- one table rather than a separate variants table.
--
-- Changing `listing_kind` on an existing row invalidates the condition data hanging off
-- it, so it should be rare and deliberate.

create table if not exists "public"."products" (
    "id" "uuid" default "gen_random_uuid"() not null,
    "name" "text" not null,
    "description" "text" default ''::"text" not null,
    "price" numeric(12,2) not null,
    "category_id" "uuid" not null,
    "created_at" timestamp with time zone default "now"() not null,
    "updated_at" timestamp with time zone default "now"() not null,
    "slug" "text" not null,
    "listing_kind" "text" default 'used_unique'::"text" not null,
    "status" "text" default 'draft'::"text" not null,
    -- Condition: required for used_unique, must be absent for new_stocked. Enforced by
    -- products_condition_matches_kind_check below.
    "condition_grade" "text",
    "condition_summary" "text",
    -- Stock: the mirror image — only new_stocked carries a quantity. used_unique rows are
    -- implicitly quantity 1, and `sold` means gone.
    "stock_quantity" integer,
    -- Dimensions (roadmap step 3). Separate numeric columns rather than text in the
    -- description, because "will it fit my 180cm alcove" is the question that blocks a
    -- furniture purchase and free text cannot be filtered.
    --
    -- Nullable rather than NOT NULL DEFAULT 0: a missing measurement and a measurement of
    -- zero are different claims. A lamp has no seat height; recording 0 would be a lie
    -- that filters would then act on.
    "width_cm" numeric(7,1),
    "depth_cm" numeric(7,1),
    "height_cm" numeric(7,1),
    "seat_height_cm" numeric(7,1),
    "weight_kg" numeric(7,2),
    -- For pieces a bounding box does not describe: an L-shaped corner sofa, a round table.
    "dimension_note" "text",
    -- Bounds reject data-entry mistakes (a misplaced decimal, mm typed as cm) rather than
    -- encoding assumptions about what furniture exists.
    constraint "products_width_cm_check"
        check (("width_cm" is null) or (("width_cm" > 0) and ("width_cm" <= 2000))),
    constraint "products_depth_cm_check"
        check (("depth_cm" is null) or (("depth_cm" > 0) and ("depth_cm" <= 2000))),
    constraint "products_height_cm_check"
        check (("height_cm" is null) or (("height_cm" > 0) and ("height_cm" <= 2000))),
    constraint "products_seat_height_cm_check"
        check (("seat_height_cm" is null) or (("seat_height_cm" > 0) and ("seat_height_cm" <= 300))),
    constraint "products_weight_kg_check"
        check (("weight_kg" is null) or (("weight_kg" > 0) and ("weight_kg" <= 1000))),
    constraint "products_dimension_note_check"
        check (("char_length"("dimension_note") <= 500)),
    constraint "products_description_check"
        check (("char_length"("description") <= 5000)),
    constraint "products_listing_kind_check"
        check (("listing_kind" = any (array[
            'used_unique'::"text", 'new_stocked'::"text"]))),
    -- `reserved` exists because a unique item can be promised to a buyer who is coming to
    -- see it. `archived` is distinct from `sold`: a mis-entered listing must not become
    -- fake social proof.
    constraint "products_status_check"
        check (("status" = any (array[
            'draft'::"text", 'available'::"text", 'reserved'::"text",
            'sold'::"text", 'archived'::"text"]))),
    constraint "products_condition_summary_check"
        check (("char_length"("condition_summary") <= 2000)),
    constraint "products_stock_quantity_check"
        check (("stock_quantity" >= 0)),
    -- The constraint that makes the transparency promise structural rather than a matter
    -- of staff discipline: a second-hand item cannot exist in this table without a
    -- condition grade, and cannot carry a stock quantity.
    constraint "products_condition_matches_kind_check"
        check ((("listing_kind" = 'used_unique'::"text"
                and "condition_grade" is not null
                and "stock_quantity" is null)
            or ("listing_kind" = 'new_stocked'::"text"
                and "condition_grade" is null
                and "condition_summary" is null
                and "stock_quantity" is not null))),
    constraint "products_name_check"
        check ((("char_length"("btrim"("name")) >= 2)
            and ("char_length"("btrim"("name")) <= 160))),
    constraint "products_price_check"
        check (("price" >= (0)::numeric)),
    constraint "products_slug_check"
        check (((("char_length"("slug") >= 2) and ("char_length"("slug") <= 160))
            and ("slug" ~ '^[ა-ჰa-z0-9]+(-[ა-ჰa-z0-9]+)*$'::"text")))
);

alter table "public"."products" owner to "postgres";

alter table only "public"."products"
    add constraint "products_pkey" primary key ("id");

alter table only "public"."products"
    add constraint "products_slug_key" unique ("slug");

-- RESTRICT (not CASCADE): deleting a category that still has products must fail.
-- app/categories/actions.ts maps the resulting 23503 to a user-facing Georgian message.
alter table only "public"."products"
    add constraint "products_category_id_fkey"
    foreign key ("category_id") references "public"."categories"("id")
    on update cascade on delete restrict;

-- RESTRICT, matching categories above: a grade that is still in use cannot be deleted.
alter table only "public"."products"
    add constraint "products_condition_grade_fkey"
    foreign key ("condition_grade") references "public"."condition_grades"("code")
    on update cascade on delete restrict;

create index if not exists "products_category_id_idx"
    on "public"."products" using "btree" ("category_id");

create index if not exists "products_created_at_idx"
    on "public"."products" using "btree" ("created_at" desc);

-- Partial indexes: sold and archived rows accumulate indefinitely (see SCHEMA_ROADMAP.md
-- on why sold rows are kept), while storefront list queries only ever want `available`.
-- Indexing just that subset lets Postgres skip the dead weight instead of filtering it
-- out afterwards. The full-table indexes above stay for the detail and admin paths, which
-- do not filter by status.
create index if not exists "products_available_created_at_idx"
    on "public"."products" using "btree" ("created_at" desc)
    where ("status" = 'available'::"text");

create index if not exists "products_available_category_id_idx"
    on "public"."products" using "btree" ("category_id", "created_at" desc)
    where ("status" = 'available'::"text");

-- width/height only: those are the two a customer filters on ("fits this gap", "fits under
-- this shelf"). Depth and weight are read on the detail page, not searched.
create index if not exists "products_available_dimensions_idx"
    on "public"."products" using "btree" ("width_cm", "height_cm")
    where ("status" = 'available'::"text");
