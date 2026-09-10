-- Product catalogs. Referenced by products and category_images, so it loads first.
-- Captured from production 2026-09-11.

create table if not exists "public"."categories" (
    "id" "uuid" default "gen_random_uuid"() not null,
    "slug" "text" not null,
    "name" "text" not null,
    "description" "text" default ''::"text" not null,
    constraint "categories_description_check"
        check (("char_length"("description") <= 5000)),
    -- Slug allows Georgian letters and lowercase ASCII, hyphen-separated.
    constraint "categories_slug_check"
        check (((("char_length"("slug") >= 2) and ("char_length"("slug") <= 80))
            and ("slug" ~ '^[ა-ჰa-z0-9]+(-[ა-ჰa-z0-9]+)*$'::"text")))
);

alter table "public"."categories" owner to "postgres";

alter table only "public"."categories"
    add constraint "categories_pkey" primary key ("id");

alter table only "public"."categories"
    add constraint "categories_name_key" unique ("name");

alter table only "public"."categories"
    add constraint "categories_slug_key" unique ("slug");
