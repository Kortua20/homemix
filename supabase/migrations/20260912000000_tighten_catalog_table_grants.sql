-- Tighten table-level grants on categories, products and product_images.
--
-- NOT YET APPLIED TO PRODUCTION. Review before running.
--
-- Companion to 20260911000000_tighten_image_table_grants.sql, which did this for
-- category_images. That migration's reasoning applies to the other three tables too; it
-- simply was not noticed at the time, because the grants on them were never inspected on
-- a freshly built database.
--
-- Problem
-- -------
-- Supabase's database sets ALTER DEFAULT PRIVILEGES on schema `public`:
--     ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
--       GRANT ALL ON TABLES TO anon, authenticated, service_role;   -- arwdDxtm
--
-- So a table created in `public` starts with every privilege already granted to `anon`.
-- A later `grant select on table ... to anon` ADDS to that set; it removes nothing. The
-- declarative file supabase/schemas/07_grants_and_rls.sql granted without revoking,
-- which means the intended least-privilege state was never actually reached.
--
-- Verified 2026-09-12 on a local stack built from supabase/schemas/:
--     categories      anon = DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--     products        anon = DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--     product_images  anon = DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--     category_images anon = SELECT            <- correct, revoked by the 0911 migration
--
-- Nothing exploits this today: RLS is enabled on all four tables and no policy grants
-- anon INSERT/UPDATE/DELETE, so writes are refused at the policy layer. That was
-- confirmed directly — an anonymous INSERT returns 42501 and an anonymous DELETE removes
-- no rows. But grants and RLS are meant to be two independent layers of defence, and on
-- these three tables only one of them is holding. A single mistaken policy would expose
-- anonymous writes.
--
-- This migration changes no policy, no data, and no table structure.
--
-- Expected effect on the running apps: none. The storefront only SELECTs anonymously,
-- and the admin writes with a signed-in user's JWT (the `authenticated` role), which
-- keeps select/insert/update/delete below.

begin;

-- categories
revoke all on table "public"."categories" from "anon";
revoke all on table "public"."categories" from "authenticated";

grant select on table "public"."categories" to "anon";
grant select, insert, update, delete on table "public"."categories" to "authenticated";

-- products
revoke all on table "public"."products" from "anon";
revoke all on table "public"."products" from "authenticated";

grant select on table "public"."products" to "anon";
grant select, insert, update, delete on table "public"."products" to "authenticated";

-- product_images
revoke all on table "public"."product_images" from "anon";
revoke all on table "public"."product_images" from "authenticated";

grant select on table "public"."product_images" to "anon";
grant select, insert, update, delete on table "public"."product_images" to "authenticated";

commit;
