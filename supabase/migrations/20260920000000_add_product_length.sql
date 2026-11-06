-- Optional fourth measurement: length.
--
-- HAND-WRITTEN, consistent with the step 3 dimensions migration. No RLS or grant changes —
-- a column on an existing table, already covered by the products policies.
--
-- Purely additive and idempotent: one nullable column with no default, nothing backfilled.
-- Every existing row simply reads NULL ("not measured"), which is the honest state for all
-- of them. Same type and bounds as width/depth/height so a misplaced decimal is caught the
-- same way.
--
-- NOT indexed and NOT used by the storefront width filter. Length overlaps with width (long
-- side of a sofa/table) or depth (head-to-foot of a bed) depending on the piece, so staff
-- should keep filling width_cm for anything a customer would filter on.

begin;

alter table "public"."products"
    add column if not exists "length_cm" numeric(7,1);

alter table "public"."products"
    drop constraint if exists "products_length_cm_check";

alter table "public"."products"
    add constraint "products_length_cm_check"
        check (("length_cm" is null) or (("length_cm" > 0) and ("length_cm" <= 2000)));

commit;
