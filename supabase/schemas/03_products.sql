-- Products. Depends on categories.
-- Captured from production 2026-09-11.

create table if not exists "public"."products" (
    "id" "uuid" default "gen_random_uuid"() not null,
    "name" "text" not null,
    "description" "text" default ''::"text" not null,
    "price" numeric(12,2) not null,
    "category_id" "uuid" not null,
    "created_at" timestamp with time zone default "now"() not null,
    "updated_at" timestamp with time zone default "now"() not null,
    "slug" "text" not null,
    constraint "products_description_check"
        check (("char_length"("description") <= 5000)),
    constraint "products_name_check"
        check ((("char_length"("btrim"("name")) >= 2)
            and ("char_length"("btrim"("name")) <= 160))),
    constraint "products_price_check"
        check (("price" >= (0)::numeric)),
    constraint "products_slug_check"
        check (((("char_length"("slug") >= 2) and ("char_length"("slug") <= 160))
            and ("slug" ~ '^[ა-ჰa-z0-9]+(-[ა-ჰa-z0-9]+)*$'::"text")))
);

alter table "public"."products" owner to "postgres";

alter table only "public"."products"
    add constraint "products_pkey" primary key ("id");

alter table only "public"."products"
    add constraint "products_slug_key" unique ("slug");

-- RESTRICT (not CASCADE): deleting a category that still has products must fail.
-- app/categories/actions.ts maps the resulting 23503 to a user-facing Georgian message.
alter table only "public"."products"
    add constraint "products_category_id_fkey"
    foreign key ("category_id") references "public"."categories"("id")
    on update cascade on delete restrict;

create index if not exists "products_category_id_idx"
    on "public"."products" using "btree" ("category_id");

create index if not exists "products_created_at_idx"
    on "public"."products" using "btree" ("created_at" desc);
