-- Table grants and RLS policies for the catalog tables.
-- Captured from production 2026-09-11, EXCEPT where marked DRIFT below.
--
-- Security model: the storefront reads anonymously with the publishable key; the admin
-- writes with a signed-in user's JWT. There is no role or admin table — "authenticated
-- and not anonymous" is treated as "staff". Both apps share this one database.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema "public" to "postgres";
grant usage on schema "public" to "anon";
grant usage on schema "public" to "authenticated";
grant usage on schema "public" to "service_role";

-- IMPORTANT: every table below is REVOKEd from anon/authenticated before being granted.
--
-- Supabase's database sets ALTER DEFAULT PRIVILEGES on `public` granting anon,
-- authenticated and service_role ALL table privileges (arwdDxtm), so a newly created
-- table starts wide open: `grant select` ADDS to that set and takes nothing away.
-- Without the revokes, anon keeps INSERT/UPDATE/DELETE/TRUNCATE at the privilege layer
-- and RLS is the only thing standing between an anonymous caller and a write. Grants and
-- RLS are meant to be independent layers; the revokes are what make the grants below
-- actually describe the intended state on a fresh database.
--
-- Verified 2026-09-12 on a local stack built from these files: without the revokes,
-- anon held DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE on categories,
-- products and product_images.

-- condition_grades
-- Reference data. The storefront reads it to render grade labels; only staff change it.
revoke all on table "public"."condition_grades" from "anon";
revoke all on table "public"."condition_grades" from "authenticated";
grant select on table "public"."condition_grades" to "anon";
grant select, insert, update, delete on table "public"."condition_grades" to "authenticated";
grant all on table "public"."condition_grades" to "service_role";

-- condition_aspects
-- Reference data, same shape as condition_grades.
revoke all on table "public"."condition_aspects" from "anon";
revoke all on table "public"."condition_aspects" from "authenticated";
grant select on table "public"."condition_aspects" to "anon";
grant select, insert, update, delete on table "public"."condition_aspects" to "authenticated";
grant all on table "public"."condition_aspects" to "service_role";

-- product_condition_aspects
revoke all on table "public"."product_condition_aspects" from "anon";
revoke all on table "public"."product_condition_aspects" from "authenticated";
grant select on table "public"."product_condition_aspects" to "anon";
grant select, insert, update, delete on table "public"."product_condition_aspects" to "authenticated";
grant all on table "public"."product_condition_aspects" to "service_role";

-- product_flaws
revoke all on table "public"."product_flaws" from "anon";
revoke all on table "public"."product_flaws" from "authenticated";
grant select on table "public"."product_flaws" to "anon";
grant select, insert, update, delete on table "public"."product_flaws" to "authenticated";
grant all on table "public"."product_flaws" to "service_role";

-- categories
-- DRIFT: production also grants MAINTAIN to anon and authenticated. Omitted here
-- deliberately; see supabase/migrations/*_tighten_image_table_grants.sql.
revoke all on table "public"."categories" from "anon";
revoke all on table "public"."categories" from "authenticated";
grant select on table "public"."categories" to "anon";
grant select, insert, update, delete on table "public"."categories" to "authenticated";
grant all on table "public"."categories" to "service_role";

-- products
revoke all on table "public"."products" from "anon";
revoke all on table "public"."products" from "authenticated";
grant select on table "public"."products" to "anon";
grant select, insert, update, delete on table "public"."products" to "authenticated";
grant all on table "public"."products" to "service_role";

-- product_images
revoke all on table "public"."product_images" from "anon";
revoke all on table "public"."product_images" from "authenticated";
grant select on table "public"."product_images" to "anon";
grant select, insert, update, delete on table "public"."product_images" to "authenticated";
grant all on table "public"."product_images" to "service_role";

-- category_images
-- DRIFT: production currently has `grant all` to BOTH anon and authenticated, which
-- would permit anonymous writes at the privilege layer. RLS is the only thing blocking
-- them today. The corrective migration brings production in line with what is written
-- here — matching product_images above.
revoke all on table "public"."category_images" from "anon";
revoke all on table "public"."category_images" from "authenticated";
grant select on table "public"."category_images" to "anon";
grant select, insert, update, delete on table "public"."category_images" to "authenticated";
grant all on table "public"."category_images" to "service_role";

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table "public"."categories" enable row level security;
alter table "public"."condition_grades" enable row level security;
alter table "public"."condition_aspects" enable row level security;
alter table "public"."products" enable row level security;
alter table "public"."category_images" enable row level security;
alter table "public"."product_images" enable row level security;
alter table "public"."product_condition_aspects" enable row level security;
alter table "public"."product_flaws" enable row level security;

-- Public reads: the storefront queries these anonymously.
create policy "Categories are publicly readable" on "public"."categories"
    for select to "authenticated", "anon" using (true);

create policy "Condition grades are publicly readable" on "public"."condition_grades"
    for select to "authenticated", "anon" using (true);

create policy "Condition aspects are publicly readable" on "public"."condition_aspects"
    for select to "authenticated", "anon" using (true);

-- Condition detail is readable for any product the reader can already see. The products
-- policy below hides draft/archived rows, but that does NOT cascade to child tables —
-- without the EXISTS check, a draft product's flaws would be readable with the publishable
-- key even though the product itself is not. That would leak exactly the half-documented
-- state this schema exists to prevent showing.
create policy "Condition aspects of visible products are readable"
    on "public"."product_condition_aspects"
    for select to "authenticated", "anon"
    using (exists (
        select 1 from "public"."products" "p"
        where "p"."id" = "product_condition_aspects"."product_id"
    ));

create policy "Flaws of visible products are readable" on "public"."product_flaws"
    for select to "authenticated", "anon"
    using (exists (
        select 1 from "public"."products" "p"
        where "p"."id" = "product_flaws"."product_id"
    ));

-- Unpublished products are hidden at the RLS layer, not merely filtered in the storefront
-- queries. A `draft` row is a half-documented listing whose flaws have not been
-- photographed yet; leaking it through the publishable key would undercut the exact
-- transparency this schema exists to guarantee. `archived` rows are mistakes and
-- duplicates that should not be reachable at all.
--
-- `sold` and `reserved` REMAIN publicly readable: their pages stay live by design.
-- Excluding them from list views is the storefront's job, not this policy's.
create policy "Published products are publicly readable" on "public"."products"
    for select to "authenticated", "anon"
    using (("status" <> all (array['draft'::"text", 'archived'::"text"])));

create policy "Category images are publicly readable" on "public"."category_images"
    for select to "authenticated", "anon" using (true);

create policy "Product images are publicly readable" on "public"."product_images"
    for select to "authenticated", "anon" using (true);

-- Writes: signed-in, non-anonymous users only.
-- `is_anonymous` is checked explicitly because anonymous sign-ins also carry the
-- `authenticated` Postgres role, so `TO authenticated` alone would not exclude them.

create policy "Permanent users can add condition aspects" on "public"."condition_aspects"
    for insert to "authenticated"
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can edit condition aspects" on "public"."condition_aspects"
    for update to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can remove condition aspects" on "public"."condition_aspects"
    for delete to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can add product condition aspects"
    on "public"."product_condition_aspects"
    for insert to "authenticated"
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can edit product condition aspects"
    on "public"."product_condition_aspects"
    for update to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can remove product condition aspects"
    on "public"."product_condition_aspects"
    for delete to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can add product flaws" on "public"."product_flaws"
    for insert to "authenticated"
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can edit product flaws" on "public"."product_flaws"
    for update to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can remove product flaws" on "public"."product_flaws"
    for delete to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can add condition grades" on "public"."condition_grades"
    for insert to "authenticated"
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can edit condition grades" on "public"."condition_grades"
    for update to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can remove condition grades" on "public"."condition_grades"
    for delete to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can add categories" on "public"."categories"
    for insert to "authenticated"
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can edit categories" on "public"."categories"
    for update to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can remove categories" on "public"."categories"
    for delete to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can add products" on "public"."products"
    for insert to "authenticated"
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can edit products" on "public"."products"
    for update to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can remove products" on "public"."products"
    for delete to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can add category images" on "public"."category_images"
    for insert to "authenticated"
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) is false)));

create policy "Permanent users can edit category images" on "public"."category_images"
    for update to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) is false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) is false)));

create policy "Permanent users can remove category images" on "public"."category_images"
    for delete to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) is false)));

create policy "Permanent users can add product images" on "public"."product_images"
    for insert to "authenticated"
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) is false)));

create policy "Permanent users can edit product images" on "public"."product_images"
    for update to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) is false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) is false)));

create policy "Permanent users can remove product images" on "public"."product_images"
    for delete to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) is false)));
