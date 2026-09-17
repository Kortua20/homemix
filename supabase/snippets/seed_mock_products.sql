-- 80 mock products for pagination testing. LOCAL DEVELOPMENT ONLY.
--
-- Every row is tagged with the marker below so the whole set can be removed in one
-- statement without touching real data — see the DELETE at the bottom of this file. That
-- tag is the reason this is safe to run against a database that already has products in it.
--
-- Run:    docker exec -i supabase_db_homemix psql -U postgres -d postgres < this_file.sql
-- Remove: see the commented DELETE at the end.
--
-- Deliberate properties, so the data actually exercises the code rather than just filling
-- the grid:
--   * spread across all 4 categories and every status, with ~62 `available` — enough for
--     3 pages at 24/page, which is what pagination needs to be worth testing
--   * created_at spread over 120 days, INCLUDING deliberate exact-duplicate timestamps, to
--     exercise the (created_at desc, id asc) tiebreak that keeps offset paging stable
--   * a mix of used_unique (condition grade, no stock) and new_stocked (stock, no grade),
--     satisfying products_condition_matches_kind_check
--   * some with compare_at_price for the discount badge, some recently published for the
--     new-arrival badge, some with dimensions and some without, so facet-coverage gating
--     has both to look at
--   * NO product_images rows: images live in R2 and mock rows would render broken <img>s.
--     Cards fall back to the placeholder icon, which is a real state worth seeing.

begin;

-- Idempotent: re-running replaces the previous mock set rather than stacking duplicates
-- (slug is unique, so a second run would otherwise fail halfway).
delete from products where description like '%[MOCK]%';

with categories_ranked as (
  select id, row_number() over (order by slug) - 1 as idx
  from categories
),
grades as (
  select code, row_number() over (order by sort_order) - 1 as idx
  from condition_grades
  where code <> 'unassessed'
),
series as (
  select generate_series(1, 80) as n
),
base as (
  select
    n,
    -- Latin slugs only: the CHECK allows Georgian or lowercase latin, and mixing them in
    -- generated ids buys nothing.
    'mock-product-' || lpad(n::text, 3, '0') as slug,
    'ტესტ პროდუქტი ' || n as name,
    (c.id) as category_id,
    -- Two rows in every ten share an exact created_at, so the id tiebreak in the paging
    -- query has something real to resolve. Without this the ordering looks stable by luck.
    (now() - make_interval(days => (n / 2) * 3))::timestamptz as created_at,
    -- Statuses: mostly available (pagination needs volume), with the others represented so
    -- the storefront's status filtering and the admin's badges both have cases to show.
    case
      when n % 13 = 0 then 'sold'
      when n % 17 = 0 then 'reserved'
      when n % 19 = 0 then 'draft'
      when n % 23 = 0 then 'archived'
      else 'available'
    end as status,
    -- Every 4th row is a new_stocked item; the rest are used_unique.
    case when n % 4 = 0 then 'new_stocked' else 'used_unique' end as listing_kind,
    (80 + (n * 37) % 1900)::numeric(12,2) as price
  from series
  join categories_ranked c on c.idx = (series.n % (select count(*) from categories_ranked))
)
insert into products (
  slug, name, description, price, compare_at_price, category_id, created_at, updated_at,
  published_at, status, listing_kind, condition_grade, condition_summary, stock_quantity,
  width_cm, depth_cm, height_cm, seat_height_cm, weight_kg
)
select
  b.slug,
  b.name,
  '[MOCK] სატესტო აღწერა პროდუქტისთვის ' || b.n || '. ეს ჩანაწერი შექმნილია მხოლოდ ტესტირებისთვის.',
  b.price,
  -- Every 5th row is discounted. The CHECK requires compare_at_price > price strictly, and
  -- the +20% keeps the derived percentage above MIN_DISCOUNT_PERCENT so the badge shows.
  case when b.n % 5 = 0 then (b.price * 1.25)::numeric(12,2) else null end,
  b.category_id,
  b.created_at,
  b.created_at,
  -- Only non-draft rows get a published_at. The newest few land inside the 21-day
  -- new-arrival window so that badge has something to render.
  case when b.status = 'draft' then null else b.created_at end,
  b.status,
  b.listing_kind,
  -- condition_grade and stock_quantity are mutually exclusive per
  -- products_condition_matches_kind_check.
  case when b.listing_kind = 'used_unique'
    then (select code from grades where idx = b.n % (select count(*) from grades))
    else null end,
  case when b.listing_kind = 'used_unique'
    then '[MOCK] მდგომარეობის აღწერა — ტესტი.'
    else null end,
  case when b.listing_kind = 'new_stocked' then (b.n % 9) + 1 else null end,
  -- Two rows in three carry dimensions. The rest stay null so getFacetAvailability's
  -- coverage gating sees a realistic mix rather than 100% coverage.
  case when b.n % 3 <> 0 then (40 + (b.n * 7) % 160)::numeric(7,1) else null end,
  case when b.n % 3 <> 0 then (35 + (b.n * 5) % 90)::numeric(7,1) else null end,
  case when b.n % 3 <> 0 then (45 + (b.n * 11) % 140)::numeric(7,1) else null end,
  case when b.n % 3 <> 0 and b.listing_kind = 'used_unique'
    then (40 + (b.n * 3) % 20)::numeric(7,1) else null end,
  case when b.n % 3 <> 0 then (5 + (b.n * 2) % 60)::numeric(7,2) else null end
from base b;

-- Attribute tags. Each product gets 1-2 materials, 1 colour and 1 style, so the facet
-- filters have enough coverage to clear FACET_COVERAGE_THRESHOLD and actually render.
insert into product_materials (product_id, material_code)
select p.id, m.code
from products p
join lateral (
  select code, row_number() over (order by code) - 1 as idx from materials
) m on m.idx = (abs(hashtext(p.slug)) % (select count(*) from materials))
where p.description like '%[MOCK]%'
on conflict do nothing;

-- A second material for every other product, so "oak AND grey" style intersections have
-- multi-tag rows to match.
insert into product_materials (product_id, material_code)
select p.id, m.code
from products p
join lateral (
  select code, row_number() over (order by code) - 1 as idx from materials
) m on m.idx = ((abs(hashtext(p.slug)) + 5) % (select count(*) from materials))
where p.description like '%[MOCK]%'
  and abs(hashtext(p.slug)) % 2 = 0
on conflict do nothing;

insert into product_colours (product_id, colour_code)
select p.id, c.code
from products p
join lateral (
  select code, row_number() over (order by code) - 1 as idx from colours
) c on c.idx = (abs(hashtext(p.slug || 'c')) % (select count(*) from colours))
where p.description like '%[MOCK]%'
on conflict do nothing;

insert into product_styles (product_id, style_code)
select p.id, s.code
from products p
join lateral (
  select code, row_number() over (order by code) - 1 as idx from styles
) s on s.idx = (abs(hashtext(p.slug || 's')) % (select count(*) from styles))
where p.description like '%[MOCK]%'
on conflict do nothing;

-- Condition aspect ratings, for used items only — the detail page's condition report.
insert into product_condition_aspects (product_id, aspect_code, grade_code, note)
select
  p.id,
  a.code,
  (select code from condition_grades
    where code <> 'unassessed'
    order by sort_order
    offset (abs(hashtext(p.slug || a.code)) % 5) limit 1),
  '[MOCK] შენიშვნა.'
from products p
cross join condition_aspects a
where p.description like '%[MOCK]%'
  and p.listing_kind = 'used_unique'
on conflict do nothing;

commit;

-- Verification
select status, count(*) from products where description like '%[MOCK]%' group by status order by status;
select 'total mock' as label, count(*) from products where description like '%[MOCK]%';
select 'available (drives pagination)' as label, count(*) from products
  where description like '%[MOCK]%' and status = 'available';

-- TO REMOVE ALL MOCK DATA (child rows cascade):
--   delete from products where description like '%[MOCK]%';
