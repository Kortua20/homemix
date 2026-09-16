-- Staff could not create, see or edit `draft` and `archived` products.
--
-- `products` had exactly one SELECT policy:
--
--   create policy "Published products are publicly readable" on "public"."products"
--       for select to "authenticated", "anon"
--       using ("status" <> all (array['draft', 'archived']));
--
-- It names `authenticated` as well as `anon`, and it was the only way to read the table,
-- so it restricted staff exactly as much as the public. Three consequences, all reproduced
-- against a signed-in non-anonymous user on a local stack (2026-09-16):
--
--   * INSERT of a `draft` row failed with 42501 "new row violates row-level security
--     policy". PostgREST asks for the row back (`.select("id, slug")` in
--     app/product/actions.ts), and a draft row is unreadable, so the write is refused.
--   * UPDATE moving a row to `draft` or `archived` failed the same way: Postgres checks
--     the *resulting* row against USING, and the result would be invisible.
--   * Child-table writes (product_images, product_flaws, product_condition_aspects,
--     product_materials/colours/styles) succeeded but returned nothing, because their read
--     policies test `exists (select 1 from products ...)` and that subquery runs as the
--     caller. The admin create flow inserts image rows and reads them back, so this broke
--     too.
--
-- The admin dashboard lists products with no status filter and relies on RLS, so drafts
-- and archived rows were also missing from the staff product list entirely.
--
-- `draft` was therefore a status only `service_role` or a direct psql session could write.
-- The seeded draft product exists only because seed.sql runs as `postgres` and bypasses
-- RLS, which is why this was never caught: it is the end-to-end admin check that
-- SCHEMA_ROADMAP.md has had open since step 1.
--
-- The fix is a second SELECT policy for staff. Multiple permissive policies for the same
-- command are OR'd, so the public policy keeps restricting anon while staff see every
-- status. The predicate matches the existing write policies verbatim — "signed in and not
-- anonymous" is this project's definition of staff, since there is no role table.
--
-- Anon visibility is unchanged: the new policy is `to "authenticated"` only, and
-- anonymous sign-ins are disabled on this project in any case.

begin;

create policy "Permanent users can read all products" on "public"."products"
    for select to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

commit;
