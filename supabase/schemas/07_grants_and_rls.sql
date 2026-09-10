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

-- categories
-- DRIFT: production also grants MAINTAIN to anon and authenticated. Omitted here
-- deliberately; see supabase/migrations/*_tighten_image_table_grants.sql.
grant select on table "public"."categories" to "anon";
grant select, insert, update, delete on table "public"."categories" to "authenticated";
grant all on table "public"."categories" to "service_role";

-- products
grant select on table "public"."products" to "anon";
grant select, insert, update, delete on table "public"."products" to "authenticated";
grant all on table "public"."products" to "service_role";

-- product_images
grant select on table "public"."product_images" to "anon";
grant select, insert, update, delete on table "public"."product_images" to "authenticated";
grant all on table "public"."product_images" to "service_role";

-- category_images
-- DRIFT: production currently has `grant all` to BOTH anon and authenticated, which
-- would permit anonymous writes at the privilege layer. RLS is the only thing blocking
-- them today. The corrective migration brings production in line with what is written
-- here — matching product_images above.
grant select on table "public"."category_images" to "anon";
grant select, insert, update, delete on table "public"."category_images" to "authenticated";
grant all on table "public"."category_images" to "service_role";

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table "public"."categories" enable row level security;
alter table "public"."products" enable row level security;
alter table "public"."category_images" enable row level security;
alter table "public"."product_images" enable row level security;

-- Public reads: the storefront queries these anonymously.
create policy "Categories are publicly readable" on "public"."categories"
    for select to "authenticated", "anon" using (true);

create policy "Products are publicly readable" on "public"."products"
    for select to "authenticated", "anon" using (true);

create policy "Category images are publicly readable" on "public"."category_images"
    for select to "authenticated", "anon" using (true);

create policy "Product images are publicly readable" on "public"."product_images"
    for select to "authenticated", "anon" using (true);

-- Writes: signed-in, non-anonymous users only.
-- `is_anonymous` is checked explicitly because anonymous sign-ins also carry the
-- `authenticated` Postgres role, so `TO authenticated` alone would not exclude them.

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
