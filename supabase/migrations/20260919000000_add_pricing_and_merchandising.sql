-- Step 4 of supabase/SCHEMA_ROADMAP.md: pricing and merchandising.
--
-- HAND-WRITTEN, consistent with the step 1-3 migrations. No RLS or grant changes here —
-- these are columns on an existing table, already covered by the products policies — but
-- kept hand-written so the file reads the same way as its neighbours.
--
-- Purely additive and idempotent: two nullable columns with no default, nothing
-- backfilled, wrapped in begin/commit. Existing rows simply carry no compare-at price and
-- no publish timestamp, which is the correct state for all of them (see below).
--
-- TWO COLUMNS, NOT FOUR. The roadmap also lists sale_starts_at / sale_ends_at, hedged with
-- "only if actually needed". They are deliberately left out: a time-dependent price makes
-- a statically prerendered page go stale mid-sale, which pulls in revalidation tied to sale
-- boundaries and a priceValidUntil in the JSON-LD to stay honest. That is infrastructure
-- for a feature with no demand, and adding it later is as additive as this migration is.

begin;

alter table "public"."products"
    -- The "was" price. `price` stays what the customer actually pays, so a discount never
    -- overwrites the real selling price and cannot be lost by a second edit.
    --
    -- The discount percentage is NOT stored. Storing it creates three fields that can
    -- disagree — and the one that would be wrong is the one shouted on the card.
    add column if not exists "compare_at_price" numeric(12,2),
    -- When the listing first became `available`.
    --
    -- Deliberately not created_at, which the roadmap's "new arrival badge derived from
    -- created_at" bullet assumed. created_at is the row's insert time, and in this shop the
    -- two are genuinely days apart: a used item sits in `draft` while it is photographed
    -- and assessed (roadmap step 2), so created_at would call an item new on the day its
    -- documentation finished, not the day it went on sale. It also badges an entire bulk
    -- import simultaneously and expires it simultaneously — which is exactly what the 28
    -- existing rows would have done.
    add column if not exists "published_at" timestamp with time zone;

-- Strictly greater than `price`, not >=. An equal compare-at price means a 0% discount: the
-- storefront would render a struck-through number identical to the live one and a "-0%"
-- badge, advertising a saving that does not exist. Rejecting it in the database means every
-- read path gets to trust the column instead of re-checking it.
--
-- The upper bound matches products_price_check's implicit ceiling (numeric(12,2)) so a
-- misplaced decimal in the "was" price is caught the same way it is in the real one.
alter table "public"."products"
    add constraint "products_compare_at_price_check"
        check (("compare_at_price" is null)
            or (("compare_at_price" > "price") and ("compare_at_price" <= 9999999999.99)));

-- NO backfill of published_at, on purpose.
--
-- All 28 existing products are `available`, so a backfill is tempting — but there is no
-- honest value to write. created_at is the import timestamp, not the date any of them went
-- on sale, so setting published_at = created_at would manufacture the exact false recency
-- claim this column exists to avoid. Null means "we do not know when this was published",
-- the badge stays off, and nothing is asserted that nobody verified.
--
-- NO index on either column either. compare_at_price is read on rows already fetched and
-- never filtered or sorted on; published_at drives a badge computed per row, not a query.
-- The partial indexes from steps 1 and 3 exist because those columns are in WHERE clauses.
-- Adding one here would cost writes to serve no query.

commit;
