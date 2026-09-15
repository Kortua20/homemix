-- Step 3 of supabase/SCHEMA_ROADMAP.md: physical dimensions.
--
-- HAND-WRITTEN, consistent with the step 1 and 2 migrations. No RLS or grant changes here
-- (these are columns on an existing table, already covered by the products policies), but
-- kept hand-written so the file reads the same way as its neighbours.
--
-- NOT YET APPLIED TO PRODUCTION. Production still lacks steps 1 and 2; see README.md
-- "Known drift" and the reconciliation checklist in the roadmap.
--
-- Every column is nullable with no default and nothing is backfilled, so this is safe to
-- apply to a table with existing rows: they simply have no dimensions recorded.
--
-- Separate numeric columns rather than text in the description, because "will it fit my
-- 180cm alcove" is the question that blocks a furniture purchase, and free text cannot be
-- filtered or compared. numeric(7,1) holds up to 999999.9 cm with one decimal — far more
-- than any furniture needs, and the decimal matters because 74.5cm is a real seat height.
--
-- Nullable rather than NOT NULL DEFAULT 0 because a missing measurement and a measurement
-- of zero are different claims. A lamp genuinely has no seat height; recording 0 would be
-- a lie that filters would then act on.

begin;

alter table "public"."products"
    add column if not exists "width_cm" numeric(7,1),
    add column if not exists "depth_cm" numeric(7,1),
    add column if not exists "height_cm" numeric(7,1),
    -- Type-specific: chairs, sofas, stools. Null for tables, wardrobes, lamps.
    add column if not exists "seat_height_cm" numeric(7,1),
    add column if not exists "weight_kg" numeric(7,2),
    -- For pieces a bounding box does not describe: an L-shaped corner sofa, a round table,
    -- an extendable dining table with two lengths.
    add column if not exists "dimension_note" "text";

-- Upper bounds are deliberately generous rather than tight. The point is to reject data
-- entry mistakes (a decimal in the wrong place, centimetres typed as millimetres), not to
-- encode assumptions about what furniture exists.
alter table "public"."products"
    add constraint "products_width_cm_check"
        check (("width_cm" is null) or (("width_cm" > 0) and ("width_cm" <= 2000))),
    add constraint "products_depth_cm_check"
        check (("depth_cm" is null) or (("depth_cm" > 0) and ("depth_cm" <= 2000))),
    add constraint "products_height_cm_check"
        check (("height_cm" is null) or (("height_cm" > 0) and ("height_cm" <= 2000))),
    add constraint "products_seat_height_cm_check"
        check (("seat_height_cm" is null) or (("seat_height_cm" > 0) and ("seat_height_cm" <= 300))),
    add constraint "products_weight_kg_check"
        check (("weight_kg" is null) or (("weight_kg" > 0) and ("weight_kg" <= 1000))),
    add constraint "products_dimension_note_check"
        check (("char_length"("dimension_note") <= 500));

-- Partial index on the available subset, matching the pattern established in step 1: the
-- storefront only ever filters dimensions within the buyable catalogue, and sold rows
-- accumulate indefinitely.
--
-- width/height only: those are the two a customer actually filters on ("fits this gap",
-- "fits under this shelf"). Depth and weight are read on the detail page, not searched.
create index if not exists "products_available_dimensions_idx"
    on "public"."products" using "btree" ("width_cm", "height_cm")
    where ("status" = 'available'::"text");

commit;
