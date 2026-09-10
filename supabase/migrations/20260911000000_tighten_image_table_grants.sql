-- Tighten table-level grants on category_images (and drop stray MAINTAIN on categories).
--
-- NOT YET APPLIED TO PRODUCTION. Review before running.
--
-- Problem
-- -------
-- Production currently has:
--     grant all on table public.category_images to anon;
--     grant all on table public.category_images to authenticated;
--
-- `grant all` to `anon` means the *privilege* layer permits INSERT/UPDATE/DELETE by
-- unauthenticated callers. Today nothing exploits this: RLS is enabled on the table and
-- there is no INSERT/UPDATE/DELETE policy for `anon`, so writes are refused at the policy
-- layer. But grants and RLS are meant to be independent layers of defence, and right now
-- one of them is wide open. A single mistaken policy would expose anonymous writes.
--
-- Compare product_images, which is already correct:
--     grant select on table public.product_images to anon;
--
-- `categories` additionally has MAINTAIN granted to anon/authenticated (MAINTAIN allows
-- VACUUM/ANALYZE/REINDEX etc.). Neither app needs it.
--
-- This migration makes category_images match product_images and removes the stray
-- MAINTAIN grants. It changes no policy, no data, and no table structure.
--
-- Expected effect on the running apps: none. The storefront only SELECTs these tables
-- anonymously, and the admin writes with a signed-in user's JWT (the `authenticated`
-- role), all of which remain granted.

begin;

-- category_images: revoke everything, then re-grant the minimum each role needs.
revoke all on table "public"."category_images" from "anon";
revoke all on table "public"."category_images" from "authenticated";

grant select on table "public"."category_images" to "anon";
grant select, insert, update, delete on table "public"."category_images" to "authenticated";

-- categories: drop MAINTAIN, keep the rest as-is.
revoke maintain on table "public"."categories" from "anon";
revoke maintain on table "public"."categories" from "authenticated";

commit;
