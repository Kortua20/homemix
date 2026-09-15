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
run and its result observed. Last updated: 2026-09-13.

> **Live hazard — read before any `db push`.**
> `migrations/20260913000000_add_listing_kind_status_and_condition.sql` is present in
> `migrations/` and **has not been applied to production**. A plain `db push` would apply it
> along with the two grant migrations *and* the baseline. See "Production reconciliation"
> below — that has to happen first.

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
- [ ] **Applied to production** — blocked on reconciliation below

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
- [x] `lib/database.types.ts` copied to `homemix-admin`
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
- [ ] Storefront must render `unassessed` as "not yet assessed", not as a grade

**Still unresolved — the bundle model.** A listing that is really 2-3 objects does not fit
`used_unique`. The descriptions show pieces are already sold separately
(`ოთხეული (შეგვიძლია დაშლაც)` — "set, we can split it"; `ერთი ცალი - 200 ლარი` — "one piece
200"). The likely answer is that a bundle is several products displayed together, not one
row — but that is a modelling decision to make deliberately, not to encode by accident.

### Production reconciliation (blocks step 1 completion)

Local and remote migration histories share **zero** entries: remote has 12 (through
`20260807142624`), local has 4 (from `20260910000000`). `db push` applies all pending
migrations in timestamp order, so it cannot be pointed at a subset.

- [ ] `migration repair --status applied 20260910000000` — marks the baseline as applied
      without executing it. **This asserts production already matches a dump taken
      2026-09-11, five weeks after its last tracked migration.** If anything was changed via
      the dashboard in that window, the difference gets buried permanently.
- [ ] `db push --dry-run` — must list exactly the intended migrations; stop if not
- [ ] `db push`
- [ ] Regenerate types from `--linked` once production has the columns
- [ ] Correct the placeholder `condition_grade = 'good'` on every pre-existing row — the
      migration backfills a claim about furniture nobody inspected

Also unresolved:

- [ ] `schemas/` vs `migrations/` drift unverified. `db reset` only executes `migrations/`;
      the declarative files were never run. A `db diff` against a shadow DB would close it.

## Step 2 — Condition detail

**Schema written, not yet applied.** The trust payload, and the reason this project is
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
- [ ] Applied to production — blocked on step 1 reconciliation

Application:

- [x] Types regenerated for both repos (from `--local`)
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
listings is worse than none — it signals the shop documents flaws when convenient.

Anchoring each flaw to its own close-up photo is what turns disclosure into evidence.
Flaws listed only as text read as fine print and get skimmed.

**This only builds trust if it is always filled in.** A condition block blank on half the
listings is worse than none — it signals the shop documents flaws when convenient. The
CHECK constraint from step 1 is what makes it non-optional.

## Step 3 — Attributes

**Split deliberately.** Dimensions pay off at any catalogue size; material/colour facets
only earn their complexity once there is enough inventory that browsing beats scrolling.
With ~9 products a customer simply looks at all of them, so four tables plus admin UI plus
filter plumbing would sit unused. They are independent — materials can be added later
without touching dimensions.

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
- [ ] Filter by width/height in the catalogue — the reason these are numeric
- [ ] Applied to production — blocked on step 1 reconciliation

### 3b — Materials, colours, styles (deferred)

- [ ] Many-to-many lookups, not text arrays: a sofa is "oak + linen", and stable ids with
      Georgian labels are needed for filter facets
- [ ] Admin multi-select UI
- [ ] Filter facets on the catalogue page

Revisit when the catalogue is large enough that customers filter rather than scroll.

## Step 4 — Pricing and merchandising

**Not started.**

- [ ] `compare_at_price` as the nullable "was" price; `price` stays the current selling
      price and is never overwritten by a discount
- [ ] Discount percentage **derived, never stored** — storing it creates three fields that
      can disagree
- [ ] "New arrival" badge derived from `created_at`
- [ ] Scheduled sales (`sale_starts_at` / `sale_ends_at`) — only if actually needed

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

Steps 1–2 deliver nearly all the customer-visible trust benefit. Steps 3–5 should wait for
evidence that they are needed. A complete schema with empty condition data helps nobody.

Steps 1–2 need matching admin form work or the columns sit empty. The admin product form is
currently one flat form and needs restructuring into sections (basics / condition /
dimensions / photos). **That is the real cost of this plan, not the SQL.**
