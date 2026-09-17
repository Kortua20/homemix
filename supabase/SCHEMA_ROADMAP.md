# Catalog schema roadmap

Plan for taking the catalog from a generic product list to a second-hand furniture shop
that documents the real state of every used item.

Context and constraints live in [`README.md`](./README.md) — in particular, **this repo
owns the schema**, the admin repo only consumes `lib/database.types.ts`, and RLS/grant
changes must be hand-written because `db diff` does not capture them reliably.

## The decision the rest of this rests on

`products` rows are **hybrid**, discriminated by `listing_kind`:

| `listing_kind` | Meaning | Quantity | Condition data |
| -------------- | ------------------------------- | ------------------- | -------------- |
| `used_unique`  | One specific physical object    | Implicitly 1        | **Required**   |
| `new_stocked`  | New item held in stock          | `stock_quantity`    | Must be NULL   |

Rejected alternatives, and why:

- **Everything unique (qty 1).** Simple, but duplicates rows for identical new stock.
- **Full variant model** (`products` → `product_variants`). The variant abstraction assumes
  configurations of one product share a description, photos and SEO. Two used oak tables
  share none of those — they are two objects. ~90% of rows would be a product with exactly
  one variant, carrying a join and a second set of policies forever to express "quantity 1".

The hybrid does not block variants later: `product_variants` can be added for
`new_stocked` rows only, without `used_unique` rows ever touching it.

**Flipping `listing_kind` on an existing row invalidates the condition data hanging off
it.** It should be rare and deliberate.

## Sold items keep their row

`status = 'sold'` retains the row and the public page. Sold listings are social proof, the
URL stays alive for SEO, and once orders exist a deleted product would orphan history.

Consequences, which are easy to get wrong:

- List queries filter `status = 'available'`; the detail query deliberately does not.
- `generateStaticParams` uses available items only, so the prerender set stays bounded.
  Sold pages render on demand.
- The `products(count)` aggregate embedded in `categorySelection` must be filtered too, or
  category cards count sold items.
- JSON-LD must emit `SoldOut` vs `InStock`. Advertising a sold item as in stock is a
  structured-data violation and costs rich-result eligibility.
- `draft` and `archived` are invisible to anon **at the RLS layer**, not just in queries.

Status values:

| Status      | Storefront behaviour                                    |
| ----------- | ------------------------------------------------------- |
| `draft`     | Invisible. Being photographed and documented.           |
| `available` | Buyable. Appears in lists.                              |
| `reserved`  | Hidden from lists; page shows as reserved.              |
| `sold`      | Hidden from lists; page renders with a sold state.      |
| `archived`  | Invisible. Mistake or duplicate listing — not proof.    |

`archived` is distinct from `sold` on purpose: a mis-entered listing must not become fake
social proof.

---

---

# Progress

Checkboxes reflect **verified** state, not intent. A box is ticked only when the thing was
run and its result observed. Last updated: 2026-09-17.

> **Steps 1-3 are live in production as of 2026-09-16.** All seven migrations applied, and
> the result was verified against the hosted database directly: 28 products, 3 categories,
> 50 product images intact, and all 28 products carrying the `unassessed` grade rather than
> a fabricated one. Types in both repos are generated from production and both type-check.
>
> **Step 3b shipped early, against the deferral recorded below.** The reasoning for
> deferring was catalogue size; what actually gates a facet is *coverage*, and the coverage
> gate makes shipping safe at any size — a control appears only once enough products carry
> the attribute. The tables and admin UI are live; the facets stay invisible until the data
> earns them. See "Why 3b shipped anyway" under step 3b.
>
> **Nothing is tagged yet.** Production has the vocabularies (17 materials, 13 colours,
> 7 styles) and zero rows in all three join tables, so every facet is correctly hidden.

## Step 1 — Foundation

`listing_kind`, `status`, the `condition_grades` lookup, condition columns on `products`,
and the CHECK constraints that tie them together. Backfill existing rows as `used_unique`
with a placeholder grade to be corrected by hand.

Also tightens the public-read RLS policy so `draft` and `archived` rows are not readable
with the publishable key.

Schema and migration:

- [x] `schemas/02a_condition_grades.sql` — lookup table, five grades, Georgian labels
- [x] `schemas/03_products.sql` — new columns, CHECKs, grade FK, partial indexes
- [x] `schemas/07_grants_and_rls.sql` — grants + policies for the new table; products
      read policy replaced with the status-aware one
- [x] `config.toml` — `02a` registered in `schema_paths`
- [x] `seed.sql` — rewritten; exercises both `listing_kind` branches and four statuses
- [x] Migration `20260913000000_add_listing_kind_status_and_condition.sql` written
- [x] Applied and verified **locally** (`supabase db reset`, clean run)
- [x] **Applied to production** (2026-09-15)

Verified behaviour (local, 2026-09-13):

- [x] used item without a grade → rejected
- [x] used item with a `stock_quantity` → rejected
- [x] new item with a grade → rejected
- [x] invalid status value → rejected
- [x] grade not in the lookup table → rejected (FK)
- [x] valid `new_stocked` row → accepted
- [x] anon sees 7 of 8 seeded rows; the `draft` row is hidden by RLS
- [x] anon INSERT refused at the privilege layer (42501)

Application layer:

- [x] `lib/database.types.ts` regenerated (from **local**, via `--local`)
- [x] `lib/database.types.ts` shared with `homemix-admin` — copied at the time; admin now
      generates its own with `--project-id <ref>`, since only this repo is CLI-linked
- [x] Storefront list queries filtered to `available`, detail query deliberately not
- [x] `getSitemapProducts` added so sold listings stay indexed
- [x] Category `products(count)` filtered via `!inner` — verified against ground truth
- [x] `tsc --noEmit` clean in **both** repos
- [x] Product detail page: sold / reserved states
- [x] **JSON-LD `availability`** (`InStock` / `BackOrder` / `SoldOut`) plus `itemCondition`
      (`UsedCondition` / `NewCondition`)
- [x] Condition grade and summary displayed on the storefront detail page, above the
      general description
- [x] `ProductCard` sold/reserved badge and condition label; `isPurchasable` now read
- [x] "See similar available items" on sold pages — links to the product's category
- [x] Sitemap product images — restored; `getSitemapProducts` embeds `product_images` and
      the entries keep their lead image

Admin (`homemix-admin`):

- [x] `Product` type carries status, listing kind, condition grade, stock
- [x] `productSelect` embeds `condition_grades`; `normalizeProduct` maps it
- [x] `lib/condition-grade-data.ts` — grade lookup, matching the `category-data.ts` pattern
- [x] Product form: listing-kind selector that toggles condition vs stock inputs, status
      selector, grade selector, condition summary
- [x] `readProductFields` builds the payload from the discriminator, so the hidden half of
      the form cannot produce a row the CHECK rejects
- [x] Status badge on both dashboard cards and the detail page
- [x] Condition panel on the admin detail page
- [x] Runtime verification of the admin write payloads against the live constraints
      (2026-09-13): `used_unique` insert, `new_stocked` insert, a correct discriminator
      flip, a flip that fails to clear the old half (**rejected**), and a payload carrying
      both halves at once (**rejected**)
- [ ] End-to-end check through the running admin app with a signed-in session — the tests
      above exercised the payload shapes directly against Postgres, not the server action

### Dry run against a copy of production (2026-09-15)

Production was dumped read-only (`db dump --linked`, then `--data-only`) and rebuilt as a
local `prodcopy` database — real structure, real rows. All five migrations were then applied
to it.

- [x] **All five migrations applied cleanly** to production's real structure and its 28
      products, 50 images, 3 categories. Nothing lost; every row satisfied the CHECK.
- [x] Every new table and column present afterwards.

**The migrations are not the risk. The backfill's claims are.** The dry run showed what
step 1 would actually assert on live data:

- 13 of 28 listings are **multi-piece bundles** with per-component prices written into the
  description (`დივანი 1 - 1599 / დივანი 2 - 1599 / სავარძლები - 599`, `ორივე - 299`).
  One `products` row is 2-3 physical objects — which contradicts `used_unique` meaning one
  specific object.
- 4 listings are named **ახალი** (new) but would be marked `used_unique`.
- All 28 would claim `good` condition, assessed by nobody.

Resolved by `20260916000000_add_unassessed_condition_grade.sql`:

- [x] `unassessed` grade added (`sort_order` 99 — not a rung on the quality ladder, the
      absence of a rating)
- [x] Backfill repointed at it; products stay `available`, so the live catalogue is
      unaffected
- [x] The UPDATE is **scoped** to rows that still look untouched (grade `good`, no summary,
      no flaws, no aspect ratings) so a genuine assessment is never reset
- [x] Verified on `prodcopy`: 26 rows flipped to `unassessed`, the 2 rows deliberately
      given a summary/flaw kept `good`, all 28 stayed `available`
- [x] Storefront renders `unassessed` as an absence, not a grade: the detail page styles it
      muted rather than as a confident rating (`isUnassessed`,
      `app/product/[slug]/page.tsx`), and `ProductCard` suppresses it entirely so a grid
      does not read "assessment pending" on every tile

**Still unresolved — the bundle model.** A listing that is really 2-3 objects does not fit
`used_unique`. The descriptions show pieces are already sold separately
(`ოთხეული (შეგვიძლია დაშლაც)` — "set, we can split it"; `ერთი ცალი - 200 ლარი` — "one piece
200"). The likely answer is that a bundle is several products displayed together, not one
row — but that is a modelling decision to make deliberately, not to encode by accident.

### Production reconciliation (blocks step 1 completion)

Local and remote migration histories share **zero** entries: remote has 12 (through
`20260807142624`), local has 4 (from `20260910000000`). `db push` applies all pending
migrations in timestamp order, so it cannot be pointed at a subset.

**Done 2026-09-15.** The sequence that worked:

- [x] Re-dumped production and diffed it against the copy the dry run used — byte-identical,
      so the baseline assertion below was true at the moment it was made
- [x] `migration repair --status applied 20260910000000`
- [x] `migration repair --status reverted <the 12 July-August versions>` — `db push` needs
      the histories to agree in **both** directions, and those 12 had no local files. Eight
      of them were never committed to this repo at all; the other four are in
      `migrations_archive/`. The bookkeeping table is the CLI's ledger of which *local
      files* are applied, not a historical record of the database, so clearing entries for
      files that do not exist is correct. It changed no schema and no data.
- [x] `db push --dry-run` — listed exactly the six expected migrations, baseline absent
- [x] `db push` — all six applied
- [x] Verified against the hosted database: 28/3/50/3 rows intact, all 28 products
      `used_unique` / `available` / `unassessed`, all six grades present, the three new
      tables reachable through the publishable key
- [x] Types regenerated from `--linked` for both repos; both `tsc --noEmit` clean
- [x] The placeholder-grade problem resolved by `unassessed` rather than by hand-correcting
      28 rows — see the dry-run section above

**Encoding trap, worth remembering:** `npx supabase gen types typescript --linked > file.ts`
in PowerShell writes **UTF-16LE**. The file looks right in an editor and TypeScript tolerates
the BOM, but git treats it as binary and every grep, diff and review tool fails silently.
Redirect from Git Bash, or use `| Out-File -Encoding utf8`.

**It recurred on 2026-09-16**, in both repos, and survived a commit unnoticed —
`3af5139` shipped the storefront's types as UTF-16. `tsc --noEmit` passed the whole time,
which is exactly why it hid. Both files were converted back with `iconv`; the content was
never wrong, only the encoding. Two lessons: PowerShell's `>` empties the target *before*
running the command, so a failed generate leaves a 0-byte file; and the check that actually
catches this is `grep -c product_materials lib/database.types.ts` (0 means UTF-16) or
`head -c 2 … | od -An -tx1` (`ff fe` means UTF-16), never `tsc` alone.

Drift, and what closing it turned up:

- [x] `schemas/` vs `migrations/` drift — **found and fixed** (2026-09-16). Policies and
      grants live centrally in `07_grants_and_rls.sql`, not in the per-table files (every
      other `schemas/*.sql` has zero of both, so `05b`'s zero is the correct convention).
      But `07` named only eight tables — `categories`, `category_images`,
      `condition_aspects`, `condition_grades`, `product_condition_aspects`, `product_flaws`,
      `product_images`, `products` — and was never extended for the six attribute tables.
      `migrations/20260917000000` carried their 12 policies and 18 grants, so **production
      was correct**; the declarative copy was incomplete, and anyone reading `schemas/`
      alone would have concluded the attribute tables had no RLS at all.
- [x] Fixed 2026-09-16: the six tables' grants and policies transcribed into
      `07_grants_and_rls.sql` verbatim from the migration — 3 grants and 2 policies each,
      policy bodies byte-identical. `07` now names all 14 tables. Transcribed rather than
      improved on purpose: this file describes the database as it is, so a change belongs
      in a migration first.
- [x] **The bare `EXISTS` on the child-table read policies is correct** — tested, not
      assumed (2026-09-16). All five child tables (`product_flaws`,
      `product_condition_aspects`, `product_materials`, `product_colours`,
      `product_styles`) guard reads with `exists (select 1 from products p where p.id =
      …product_id)` and no status test, which reads like a leak: RLS does not cascade, so
      the subquery looks like it would match a draft row. It does not. A subquery inside a
      policy is itself evaluated as the calling role, so the `products` read policy applies
      *within* it — for anon the draft row is invisible there too, the `EXISTS` is false,
      and the child row is filtered out. Adding `and p.status <> all (…)` would be
      redundant, not a fix.
- [x] Verified on the local stack: the draft product (`tsignis-taro-maghali`) was given a
      material and a flaw as `service_role`, then read back with the publishable key —
      **both invisible to anon**, as was the product itself. Test rows removed afterwards.
- [ ] A `db diff` against a shadow DB would close the general question of whether anything
      else has drifted. Still not run.

## Step 2 — Condition detail

**Live in production as of 2026-09-15.** The trust payload, and the reason this project is
worth doing.

### The constraint that shaped the design

`product_images.id` is assigned by Postgres on insert, *after* the R2 upload completes
server-side, so the client never sees an id for a newly uploaded photo. A flaw referencing
`product_images.id` therefore could not be captured in the same submit as its photo.

Resolved by **client-generated image ids**: `product_images.id` has a `gen_random_uuid()`
*default* rather than being identity-generated, so the admin can mint UUIDs up front, send
them alongside the files, and have flaws reference them in one atomic submit. Rejected
alternatives: a two-phase "save product, then attach flaws" flow (lets a listing sit
half-documented), and flaws with no photo link at all (makes the anchor optional, which is
how "always documented" decays into "documented when convenient").

`product_flaws.image_id` is nullable regardless — some real flaws (an odour, a slight
wobble) have no meaningful photo, and forcing one produces decorative images that prove
nothing.

Schema:

- [x] `condition_aspects` lookup — structure, surface, upholstery, hardware, **odour**
- [x] `product_condition_aspects` — per-aspect grades against the step 1 scale. A single
      overall grade is too coarse to be believed; "Structure: excellent / Surface: fair —
      ring marks" tells a buyer whether the flaw matters *for them*.
- [x] `product_flaws` — type, severity, location, note, optional photo FK.
      **`ON DELETE SET NULL`**, not CASCADE: deleting a photo must not delete the flaw it
      documented.
- [x] `product_images.kind` (`primary` / `detail` / `flaw` / `dimension_diagram`)
- [x] `product_images.alt_text` — optional, with an app-side fallback
- [x] RLS with an `EXISTS` check against `products` — the products policy does **not**
      cascade to child tables, so without it a draft product's flaws would be readable
      with the publishable key
- [x] Migration `20260914000000_add_condition_detail_and_image_kinds.sql` written
- [x] Seed data — aspect ratings and flaws for the used products
- [x] **Applied locally** (`supabase db reset`, 2026-09-14) — five migrations, clean run
- [x] Verified (2026-09-14): empty flaw note **rejected**, bogus `flaw_type` **rejected**,
      bogus `severity` **rejected**, unknown aspect code **rejected** (FK), duplicate
      aspect for one product **rejected** (composite PK), bogus image `kind` **rejected**
- [x] **RLS leak test passed**: a flaw attached to the `draft` product is invisible to
      anon (5 flaws as `postgres`, 4 visible as `anon`, draft's flaw count 0)
- [x] Applied to production (2026-09-15)

Application:

- [x] Types regenerated for both repos (now from `--linked`)
- [x] Admin: client-generated image ids threaded through `uploadImages`, paired to files
      **before** empty entries are filtered (pairing after would shift every id by one
      whenever the browser submits a zero-size entry)
- [x] Admin UI for capturing flaws against photos — flaw rows keyed by a client-generated
      value, not by index, so reordering cannot move one flaw's note onto another's photo
- [x] Admin server parsing: `readFlaws` validates each flaw's `image_id` against the set
      of photos the product will own after the submit. **The foreign key only proves the
      image row exists, not that it belongs to this product.**
- [x] Storefront data layer — nested `aspect`/`grade` double-embed verified through
      PostgREST
- [x] Storefront: flaw list that jumps to its photo, per-aspect condition table
- [ ] End-to-end check through the running admin app (needs a real R2 upload)

Anchoring each flaw to its own close-up photo is what turns disclosure into evidence.
Flaws listed only as text read as fine print and get skimmed.

**This only builds trust if it is always filled in.** A condition block blank on half the
listings is worse than none — it signals the shop documents flaws when convenient. The
CHECK constraint from step 1 is what makes it non-optional.

## Step 3 — Attributes

**Split deliberately**, and both halves are now live. The split still holds as a unit of
work — dimensions and attributes are independent, and either could have shipped without the
other.

The original argument for deferring 3b ("with ~9 products a customer simply looks at all of
them, so the tables and filter plumbing would sit unused") turned out to be reasoning from
the wrong variable. What makes a facet useless is sparse *data*, not a small catalogue, and
a coverage gate handles that directly — so both halves shipped with the controls hidden
until the data earns them. See "Why 3b shipped anyway" below.

### 3a — Dimensions

- [x] Six nullable columns on `products`: `width_cm`, `depth_cm`, `height_cm`,
      `seat_height_cm`, `weight_kg`, `dimension_note`
- [x] **Nullable, not `NOT NULL DEFAULT 0`** — a missing measurement and a measurement of
      zero are different claims. A lamp has no seat height; recording `0` would be a lie
      that filters then act on.
- [x] `numeric(7,1)` not integer — 74.5cm is a real seat height
- [x] Bounds are generous (2000cm, 300cm seat, 1000kg): they catch a misplaced decimal or
      mm typed as cm, not encode assumptions about what furniture exists
- [x] Partial index on `(width_cm, height_cm) where status = 'available'` — the two people
      actually filter on; depth and weight are read, not searched
- [x] Migration `20260915000000_add_product_dimensions.sql`
- [x] Seed data, deliberately uneven (full / partial / none) so the UI's empty and partial
      states are exercised rather than hidden
- [x] **Applied locally** (2026-09-15) and verified: zero width **rejected**, negative
      weight **rejected**, 18000cm **rejected**, 450cm seat height **rejected**, NULL
      **accepted**, 74.5 round-trips exactly
- [x] Types regenerated for both repos
- [x] Admin form inputs — six optional fields, outside the `isUsed` branch since a new
      chair has a seat height too. Blank writes NULL, never 0.
- [x] `readOptionalMeasurement` distinguishes "left blank" (→ NULL) from "typed nonsense"
      (→ field error), so a bad entry cannot silently become a missing measurement
- [x] Storefront dimensions table — unmeasured fields are **omitted entirely** rather than
      shown with a dash, since a dash implies someone looked and found nothing
- [x] Admin detail page dimensions panel
- [x] Verified through PostgREST as anon: 74.5 round-trips exactly, null seat height on
      the dining table renders as an absent row
- [x] Applied to production (2026-09-15)
- [x] Filter by width/height in the catalogue (2026-09-16) — built alongside the 3b facets
      and gated the same way. The deferral below was superseded by the coverage gate: the
      control appears only once 30% of listable products are actually measured, so it can
      ship before the catalogue is large without becoming a filter that empties the page.
      Verified locally: `?minWidth=150` returns exactly the three products ≥150cm.

### 3b — Materials, colours, styles

**Live in production as of 2026-09-16**, ahead of the deferral this section originally
recorded.

- [x] Many-to-many lookups, not text arrays: a sofa is "oak + linen", and stable ids with
      Georgian labels are needed for filter facets
- [x] Six tables — three vocabularies (`materials`, `colours`, `styles`) and three join
      tables — in `schemas/05b_product_attributes.sql`, registered in `config.toml`
- [x] Migration `20260917000000_add_product_attributes.sql`, hand-written: it adds 12
      policies and 18 grants, which `db diff` does not capture reliably
- [x] Purely additive and idempotent — six `create table if not exists`, no `alter` against
      an existing table, nothing backfilled, wrapped in `begin`/`commit`. Existing products
      simply carry no attributes.
- [x] Vocabularies seeded **by the migration itself**, so production got a working picklist
      the moment it applied: 17 materials, 13 colours, 7 styles
- [x] Seed data deliberately uneven (some products fully tagged, some colour-only, the
      draft row none) so the facet UI's partial states are exercised
- [x] Applied to production (2026-09-16) and verified: all six tables reachable through the
      publishable key, vocabularies present, all three join tables empty
- [x] Admin multi-select UI — three checkbox groups, shown for every listing kind, since a
      new stocked product has materials and colours too (admin PR #2)
- [x] Codes deduplicated before insert, so a malformed submit cannot hit the composite
      primary key with a raw 23505 after the product write has already committed
- [x] Filter facets on the catalogue page, plus the category pages
- [x] Verified locally: `oak ∩ natural` returns one product, `oak` alone two, `oak OR
      velvet` three; an unknown code returns zero on both page types
- [ ] Tag real products through admin — **nothing is tagged yet**, so no facet is visible

#### Why 3b shipped anyway

The deferral was argued from catalogue size: with ~28 products a customer scrolls, so
facets would sit unused. That reasoning was about the wrong variable. A facet is useless
not when the catalogue is small but when the *data behind it* is sparse — a material filter
over untagged products empties the page on first click regardless of how many listings
exist.

So the gate is coverage, not size. `getFacetAvailability` renders a control only when at
least `FACET_COVERAGE_THRESHOLD` (0.3) of listable products actually carry that attribute,
and `FACET_MIN_PRODUCTS` (8) keeps it off a catalogue too small to be worth filtering at
all. The filter bar grows by itself as products get tagged rather than shipping as a set of
traps. That makes shipping the schema early cheap and reversible, and it means the tables
can fill up gradually without a second deploy.

**Coverage gates the control, never the param.** A facet that is not rendered still filters
when its parameter is in the URL. Those are different questions: rendering is a judgement
about whether a control earns its space, but a filter in the URL is a promise about what
the page shows, and discarding it renders unfiltered results that look correct — a shared
link then lies about what it points at. This bit the category pages specifically, where
`getFacetAvailability` is scoped to the category and so drops below the minimum long before
the catalogue does; gating the parse on it silently discarded every facet param on every
category page.

Known cost, accepted: when coverage hides a facet, its `activeCount` badge goes with it, so
the only way out of a hidden-but-active filter is the global reset. Worse than a per-facet
clear, better than results that are quietly wrong. If hidden-but-active filters become
common, add a standalone active-filter summary — do not re-drop the param.

## Step 4 — Pricing and merchandising

**Live in production as of 2026-09-17.**

Two columns, not four. `compare_at_price` and `published_at`; scheduled sales left out and
the new-arrival source changed from what this section originally specified — see below.

Schema and migration:

- [x] `compare_at_price numeric(12,2)` nullable — the "was" price. `price` stays the current
      selling price and is never overwritten by a discount
- [x] CHECK `compare_at_price > price`, **strictly** greater. An equal compare-at price is a
      0% discount: it renders a struck-through number identical to the live one and a "-0%"
      badge, advertising a saving that does not exist. Rejecting it in the database means no
      read path has to remember to filter it
- [x] Discount percentage **derived, never stored** — `getDiscountPercent` in
      `lib/storefront.ts`, with a `MIN_DISCOUNT_PERCENT` of 5 so a rounding-error saving does
      not earn a badge
- [x] `published_at timestamptz` nullable, **no backfill** and no index on either column
      (neither appears in a WHERE clause; see the migration header)
- [x] Migration `20260919000000_add_pricing_and_merchandising.sql`, hand-written, purely
      additive and idempotent, wrapped in `begin`/`commit`
- [x] `schemas/03_products.sql` updated to match
- [x] Seed data deliberately uneven: a discounted available item, a discounted **sold** item,
      a discounted `new_stocked` item, and three `published_at` values spread across the
      recency boundary so the badge cut-off is exercised rather than assumed
- [x] Applied locally and verified — compare-at equal to price **rejected**, below price
      **rejected**, above price accepted, NULL accepted, and **raising `price` above an
      existing `compare_at_price` rejected** (the row can be invalidated from either side,
      which a column-level check would have missed)
- [x] Types regenerated from `--local` for both repos, UTF-8 confirmed by the
      `grep -c compare_at_price` check rather than by `tsc` alone; both `tsc --noEmit` clean
- [x] **Applied to production** (2026-09-17) and verified against the hosted database: both
      columns readable through the publishable key, all 28 products intact and all carrying
      NULL in both, migration history aligned 10-for-10 local/remote, and an anon write to
      `compare_at_price` still refused at the privilege layer (42501) — so the new columns
      inherited no unintended grant
- [x] Pre-flight dry run before the push: production's real 28 rows were copied locally and
      the migration replayed against them. All 28 survived and `pg_constraint.convalidated`
      came back `t`, meaning Postgres validated the CHECK against every existing row rather
      than deferring it. Nothing could have failed, because a NULL `compare_at_price`
      satisfies the `is null` branch by construction

### "New arrival" is derived from `published_at`, not `created_at`

This section originally said `created_at`. That was wrong for this shop, and the repo's own
history is the evidence: 28 products were bulk-imported on one day, so every one of them
would have badged "new" simultaneously and gone stale simultaneously. More fundamentally,
`created_at` is the row's insert time, and a used item sits in `draft` for days while it is
photographed and assessed (step 2) — so `created_at` would call an item new on the day its
documentation finished, not the day it went on sale.

`published_at` is stamped by the server action on the **first** transition into `available`,
and never cleared. Two rules, both load-bearing:

- Stamping on every save would make any edit to a live listing re-badge it as new, turning
  the badge into "recently edited".
- Clearing it would let a listing that sold and was re-listed present as a new arrival on its
  second outing.

Written in `actions.ts` rather than as a database trigger, because this codebase keeps write
rules in the save path where they are visible. Verified against all 8 status-transition
cases, including "edit a live listing" and "sold → available".

**No backfill.** All 28 existing rows are `available`, so a backfill is tempting, but there
is no honest value to write — `created_at` is the import timestamp. NULL means "we do not
know when this was published", the badge stays off, and nothing unverified is asserted.

### Scheduled sales: deliberately not built

The original bullet hedged these with "only if actually needed", and nothing has made them
needed. The cost is not the two columns: a time-dependent price makes a statically
prerendered page go stale mid-sale, which pulls in revalidation tied to sale boundaries and
a `priceValidUntil` in the JSON-LD to stay honest. That is infrastructure for a feature with
no demand, and adding it later is as additive as this migration was. `compare_at_price` set
and cleared by hand covers any sale this catalogue will run.

### A sold item does not advertise a discount

Not in the original plan, and it is the case most easily got wrong. A sold listing keeps its
page as social proof (step 1), but "was 820, now 640" on it advertises an offer that has
expired — and a saving sitting next to a sold notice reads as a taunt.

`showsDiscount` is therefore `discountPercent !== null && isPurchasable`, and `isNewArrival`
carries the same `isPurchasable` guard. This governs the JSON-LD as well as the pixels:
emitting a sale price on a `SoldOut` offer is the same class of structured-data violation as
claiming `InStock` for a sold item.

- [x] Verified against the running storefront: the sold discounted product renders **no**
      strike-through, no badge, no `StrikethroughPrice`, and the old price appears nowhere in
      its HTML; the available discounted product renders all three

### JSON-LD strikethrough encoding

`offers.price` keeps the **active** price and the "was" price goes in a
`priceSpecification` typed `https://schema.org/StrikethroughPrice`. Checked against Google's
merchant-listing reference rather than written from memory, because the adjacent precedence
rule is a trap: "if you use both `offers.price` and `offers.priceSpecification` to encode an
**active** price, `priceSpecification` is ignored". That applies to an active price only, so
a strikethrough-typed spec coexists with `offers.price` — but encoding the sale price in
`priceSpecification` instead would have been silently discarded.

Verified emitted shape:
`"price":295, "priceSpecification":{"priceType":".../StrikethroughPrice","price":360}`.

Application layer:

- [x] Storefront: `compareAtPrice`, `discountPercent`, `showsDiscount`, `publishedAt`,
      `isNewArrival` on `Product`; percentage and recency derived in `normalizeProduct`
- [x] `ProductCard`: **at most one** badge — a card carrying both "-20%" and "new arrival"
      makes the viewer read two claims and trust neither, so the discount wins when both
      apply. Old price marked up as `<s>` with an `sr-only` label, since the strike-through
      is the meaning and two bare numbers are ambiguous read aloud
- [x] Product detail page: price row with strike-through and percentage, separate
      new-arrival badge
- [x] Admin: optional "ძველი ფასი" input beside the price, validation mirroring the CHECK
      (blank → NULL, never 0), error-summary descriptor wired
- [x] Admin detail page: compare-at price with derived percentage, plus a staff-facing
      `გამოქვეყნდა` row — staff need to see whether a listing has ever been published,
      since that is what the storefront badge is derived from
- [x] `getMaxProductPrice` and the price filter deliberately left reading `price`: a filter
      must operate on what the customer actually pays
- [x] Both repos build (`next build`) and lint clean; the three `no-unused-vars` warnings are
      pre-existing and intentional (query functions used only to derive row types)
- [ ] End-to-end check through the running admin app with a signed-in session — the
      `published_at` transition rules were tested as pure logic and the write payloads
      directly against Postgres, not through the server action

## Step 5 — Later: orders, guest checkout, reservations

**Not scheduled.** Two things must be true when it happens:

- [ ] **Order lines snapshot** the name, price and condition grade as values at purchase
      time, rather than only referencing `product_id`. Otherwise editing a product silently
      rewrites order history.
- [ ] **Unique items reserve atomically at checkout**, not at payment confirmation — two
      people can open the same used sofa page at once. The `status` column from step 1 is
      what makes the `available → reserved` transition possible.
- [ ] Orders written via `service_role` only, readable by nobody through the anon key

Guest checkout (no authorisation) is workable, but **orders break the current security
model.** They carry names, addresses and phone numbers, while RLS today is "anon reads
everything". Orders must not inherit the catalog's public-read policy.

---

## Sequencing note

Steps 1–2 deliver nearly all the customer-visible trust benefit. Steps 4–5 should wait for
evidence that they are needed. A complete schema with empty condition data helps nobody.

Step 4 shipped its two justified columns and **declined the other two**. That is the rule
working rather than being bent: `compare_at_price` and `published_at` are inert when unset —
no compare-at price means no badge, and a NULL `published_at` means no recency claim — so
they cost nothing while unused, exactly like the coverage-gated facets. Scheduled sales
cannot hide themselves that way, because a time-dependent price drags in revalidation and
`priceValidUntil` the moment it exists, so they waited. "Can this feature be invisible until
its data earns it?" is the question that decides, not the step number.

Step 3 shipped ahead of that rule, on the argument that a coverage-gated control costs
nothing while its data is empty — it is invisible until tagging makes it useful. That is a
narrow exception, not a general licence: it works because the gate is real and verified. A
feature that *cannot* hide itself when its data is sparse should still wait.

Steps 1–2 need matching admin form work or the columns sit empty. The admin product form is
currently one flat form and needs restructuring into sections (basics / condition /
dimensions / photos). **That is the real cost of this plan, not the SQL.**
