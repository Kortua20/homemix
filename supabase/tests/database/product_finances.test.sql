-- pgTAP tests for the staff-only finances: schemas/10_product_finances.sql.
--
-- Run against the LOCAL stack (never production):
--   npx supabase test db
--
-- Everything runs inside one transaction that is rolled back at the end, so the suite
-- creates its own fixtures and leaves the database exactly as it found it — it does not
-- depend on seed.sql and does not touch seeded rows.
--
-- What these tests protect, in order of how bad a regression would be:
--   1. The storefront's publishable key (role `anon`) can read NOTHING: not the tables, not
--      the views, not the functions, not through an embed. This is the "purchase and sale
--      prices are internal" promise.
--   2. Staff writes go through RLS, and an anonymous sign-in is not staff.
--   3. Recording a sale and changing stock happen together, and cannot oversell.
--   4. Sales cannot silently disappear from the books with their product.

begin;

create extension if not exists pgtap with schema extensions;

select plan(46);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, before any role switch)
-- ---------------------------------------------------------------------------

insert into public.categories (id, slug, name, description)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'pgtap-test-category', 'pgTAP ტესტი', '');

-- A new (stocked) item: 5 chairs at 60 on the site, bought at 50 each.
insert into public.products
    (id, slug, name, price, category_id, listing_kind, status, stock_quantity)
values
    ('aaaaaaaa-0000-4000-8000-000000000002', 'pgtap-chair', 'pgTAP სკამი', 60,
     'aaaaaaaa-0000-4000-8000-000000000001', 'new_stocked', 'available', 5);

insert into public.product_finances (product_id, purchase_price)
values ('aaaaaaaa-0000-4000-8000-000000000002', 50);

-- A used (unique) item, which must not be sold through the stock functions.
insert into public.products
    (id, slug, name, price, category_id, listing_kind, status, condition_grade)
values
    ('aaaaaaaa-0000-4000-8000-000000000003', 'pgtap-used-table', 'pgTAP მაგიდა', 400,
     'aaaaaaaa-0000-4000-8000-000000000001', 'used_unique', 'available',
     (select code from public.condition_grades order by sort_order limit 1));

-- ---------------------------------------------------------------------------
-- 1. Grants: anon holds nothing, staff holds exactly what it needs
-- ---------------------------------------------------------------------------

select table_privs_are('public', 'product_finances', 'anon', array[]::text[],
    'anon has no privilege on product_finances');
select table_privs_are('public', 'product_sales', 'anon', array[]::text[],
    'anon has no privilege on product_sales');
select table_privs_are('public', 'product_accounting', 'anon', array[]::text[],
    'anon has no privilege on the product_accounting view');
select table_privs_are('public', 'product_sale_ledger', 'anon', array[]::text[],
    'anon has no privilege on the product_sale_ledger view');

select table_privs_are('public', 'product_finances', 'authenticated',
    array['DELETE', 'INSERT', 'SELECT', 'UPDATE'],
    'authenticated has CRUD on product_finances and nothing more (no TRUNCATE)');
select table_privs_are('public', 'product_sales', 'authenticated',
    array['DELETE', 'INSERT', 'SELECT', 'UPDATE'],
    'authenticated has CRUD on product_sales and nothing more (no TRUNCATE)');
select table_privs_are('public', 'product_accounting', 'authenticated', array['SELECT'],
    'authenticated can only read product_accounting');
select table_privs_are('public', 'product_sale_ledger', 'authenticated', array['SELECT'],
    'authenticated can only read product_sale_ledger');

select function_privs_are('public', 'record_product_sale',
    array['uuid', 'integer', 'numeric', 'date', 'text'], 'anon', array[]::text[],
    'anon cannot execute record_product_sale');
select function_privs_are('public', 'delete_product_sale', array['uuid'], 'anon',
    array[]::text[], 'anon cannot execute delete_product_sale');
select function_privs_are('public', 'record_product_sale',
    array['uuid', 'integer', 'numeric', 'date', 'text'], 'authenticated', array['EXECUTE'],
    'authenticated can execute record_product_sale');
select function_privs_are('public', 'delete_product_sale', array['uuid'], 'authenticated',
    array['EXECUTE'], 'authenticated can execute delete_product_sale');

-- ---------------------------------------------------------------------------
-- 2. RLS and view security
-- ---------------------------------------------------------------------------

select ok((select relrowsecurity from pg_class where oid = 'public.product_finances'::regclass),
    'RLS is enabled on product_finances');
select ok((select relrowsecurity from pg_class where oid = 'public.product_sales'::regclass),
    'RLS is enabled on product_sales');

-- Without security_invoker a view owned by postgres would bypass RLS entirely.
select ok((select 'security_invoker=true' = any(reloptions) from pg_class
           where oid = 'public.product_accounting'::regclass),
    'product_accounting runs with the caller''s privileges (security_invoker)');
select ok((select 'security_invoker=true' = any(reloptions) from pg_class
           where oid = 'public.product_sale_ledger'::regclass),
    'product_sale_ledger runs with the caller''s privileges (security_invoker)');

-- SECURITY INVOKER functions grant no power of their own; RLS still decides.
select ok(not (select prosecdef from pg_proc where oid =
           'public.record_product_sale(uuid, integer, numeric, date, text)'::regprocedure),
    'record_product_sale is SECURITY INVOKER');
select ok(not (select prosecdef from pg_proc where oid =
           'public.delete_product_sale(uuid)'::regprocedure),
    'delete_product_sale is SECURITY INVOKER');

-- ---------------------------------------------------------------------------
-- 3. As the storefront: role anon
-- ---------------------------------------------------------------------------

set local role anon;

select throws_ok('select * from public.product_finances', '42501', null,
    'anon reading product_finances is refused');
select throws_ok('select * from public.product_sales', '42501', null,
    'anon reading product_sales is refused');
select throws_ok('select * from public.product_accounting', '42501', null,
    'anon reading product_accounting is refused');
select throws_ok('select * from public.product_sale_ledger', '42501', null,
    'anon reading product_sale_ledger is refused');
select throws_ok(
    $$select public.record_product_sale('aaaaaaaa-0000-4000-8000-000000000002', 1, 10, current_date)$$,
    '42501', null, 'anon calling record_product_sale is refused');
-- The storefront itself keeps working: products stay publicly readable.
select lives_ok('select id, stock_quantity from public.products',
    'anon can still read products (the storefront is unaffected)');

reset role;

-- ---------------------------------------------------------------------------
-- 4. As an anonymous sign-in: authenticated role, but not staff
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
    '{"sub":"aaaaaaaa-0000-4000-8000-0000000000a2","role":"authenticated","is_anonymous":true}',
    true);

select is((select count(*) from public.product_finances), 0::bigint,
    'an anonymous sign-in sees no purchase prices');
-- The row is readable through the public products policy, but FOR UPDATE needs the staff
-- update policy, so the function cannot lock it and reports it as not found.
select throws_ok(
    $$select public.record_product_sale('aaaaaaaa-0000-4000-8000-000000000002', 1, 10, current_date)$$,
    'P0002', 'product_not_found', 'an anonymous sign-in cannot record a sale');

reset role;

-- ---------------------------------------------------------------------------
-- 5. As staff: recording and undoing sales
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
    '{"sub":"aaaaaaaa-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

select is((select count(*) from public.product_finances
           where product_id = 'aaaaaaaa-0000-4000-8000-000000000002'), 1::bigint,
    'staff can read purchase prices');

-- The example from the spec: 2 of 5 chairs sold for 90 in total.
select isnt(public.record_product_sale('aaaaaaaa-0000-4000-8000-000000000002', 2, 90,
                '2026-11-11', '  ორი სკამი  '), null,
    'staff can record a sale and gets its id back');

select results_eq(
    $$select stock_quantity, status from public.products
      where id = 'aaaaaaaa-0000-4000-8000-000000000002'$$,
    $$values (3, 'available'::text)$$,
    'the sale takes 2 units off the stock and leaves the item available');

select results_eq(
    $$select quantity, total_price, unit_cost, list_unit_price, note
      from public.product_sales where product_id = 'aaaaaaaa-0000-4000-8000-000000000002'$$,
    $$values (2, 90.00::numeric(12,2), 50.00::numeric(12,2), 60.00::numeric(12,2), 'ორი სკამი'::text)$$,
    'the sale snapshots unit cost and list price, and trims the note');

select results_eq(
    $$select total_price - unit_cost * quantity from public.product_sale_ledger
      where product_id = 'aaaaaaaa-0000-4000-8000-000000000002'$$,
    $$values (-10.00::numeric)$$,
    'the ledger shows the loss: 90 paid for 2 units that cost 50 each');

select ok((select has_sales from public.product_accounting
           where id = 'aaaaaaaa-0000-4000-8000-000000000002'),
    'product_accounting reports the product as having sales');

-- A later change to cost or price must not rewrite the recorded sale.
update public.product_finances set purchase_price = 55
 where product_id = 'aaaaaaaa-0000-4000-8000-000000000002';
update public.products set price = 70 where id = 'aaaaaaaa-0000-4000-8000-000000000002';
select results_eq(
    $$select unit_cost, list_unit_price from public.product_sales
      where product_id = 'aaaaaaaa-0000-4000-8000-000000000002'$$,
    $$values (50.00::numeric(12,2), 60.00::numeric(12,2))$$,
    'restocking at a new cost or repricing does not rewrite past sales');

select throws_ok(
    $$select public.record_product_sale('aaaaaaaa-0000-4000-8000-000000000002', 4, 100, current_date)$$,
    '22023', 'insufficient_stock', 'selling more than is in stock is refused');
select is((select stock_quantity from public.products
           where id = 'aaaaaaaa-0000-4000-8000-000000000002'), 3,
    'a refused sale leaves the stock untouched');

select throws_ok(
    $$select public.record_product_sale('aaaaaaaa-0000-4000-8000-000000000002', 0, 0, current_date)$$,
    '22023', 'invalid_quantity', 'a quantity below 1 is refused');

select throws_ok(
    $$select public.record_product_sale('aaaaaaaa-0000-4000-8000-000000000003', 1, 350, current_date)$$,
    '22023', 'not_stocked_product', 'a used item cannot be sold through the stock function');

-- Selling the last units sells the item out.
select isnt(public.record_product_sale('aaaaaaaa-0000-4000-8000-000000000002', 3, 150,
                '2026-11-11'), null,
    'the remaining 3 units can be sold');
select results_eq(
    $$select stock_quantity, status from public.products
      where id = 'aaaaaaaa-0000-4000-8000-000000000002'$$,
    $$values (0, 'sold'::text)$$,
    'selling the last unit marks the item sold, so it leaves the catalog');

-- Undo restores exactly what the sale took.
select lives_ok(
    $$select public.delete_product_sale((select id from public.product_sales
       where product_id = 'aaaaaaaa-0000-4000-8000-000000000002' and quantity = 3))$$,
    'staff can undo a sale');
select results_eq(
    $$select stock_quantity, status from public.products
      where id = 'aaaaaaaa-0000-4000-8000-000000000002'$$,
    $$values (3, 'available'::text)$$,
    'undo puts the units back on the shelf and makes the item available again');

select throws_ok(
    $$select public.delete_product_sale('aaaaaaaa-0000-4000-8000-0000000000ff')$$,
    'P0002', 'sale_not_found', 'undoing a sale that does not exist is refused');

-- ---------------------------------------------------------------------------
-- 6. Integrity of the books
-- ---------------------------------------------------------------------------

select throws_ok(
    $$delete from public.products where id = 'aaaaaaaa-0000-4000-8000-000000000002'$$,
    '23503', null, 'a product with recorded sales cannot be deleted');

select throws_ok(
    $$insert into public.product_sales (product_id, quantity, total_price, list_unit_price, sold_on)
      values ('aaaaaaaa-0000-4000-8000-000000000003', 0, 10, 10, current_date)$$,
    '23514', null, 'a sale row with quantity 0 is rejected by the CHECK constraint');

select throws_ok(
    $$insert into public.product_finances (product_id, purchase_price)
      values ('aaaaaaaa-0000-4000-8000-000000000003', -1)$$,
    '23514', null, 'a negative purchase price is rejected by the CHECK constraint');

reset role;

-- A product with no sales still deletes, and its purchase price goes with it (CASCADE).
select lives_ok(
    $$delete from public.products where id = 'aaaaaaaa-0000-4000-8000-000000000003'$$,
    'a product without sales can still be deleted');

select * from finish();
rollback;
