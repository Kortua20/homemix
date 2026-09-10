-- Product image metadata. Bytes live in Cloudflare R2; only the object key is stored.
-- Captured from production 2026-09-11.

create table if not exists "public"."product_images" (
    "id" "uuid" default "gen_random_uuid"() not null,
    "product_id" "uuid" not null,
    "object_key" "text" not null,
    "original_name" "text" not null,
    "content_type" "text" not null,
    "size_bytes" bigint not null,
    "sort_order" integer default 0 not null,
    "created_at" timestamp with time zone default "now"() not null,
    constraint "product_images_content_type_check"
        check (("content_type" = any (array[
            'image/jpeg'::"text", 'image/png'::"text", 'image/webp'::"text"]))),
    -- Enforces the R2 layout: products/<product-uuid>/<file-uuid>.<ext>
    constraint "product_images_object_key_check"
        check (("object_key" ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f-]+\.(jpg|jpeg|png|webp)$'::"text")),
    constraint "product_images_size_check"
        check ((("size_bytes" > 0) and ("size_bytes" <= 5242880))),
    constraint "product_images_sort_order_check"
        check (("sort_order" >= 0))
);

alter table "public"."product_images" owner to "postgres";

alter table only "public"."product_images"
    add constraint "product_images_pkey" primary key ("id");

alter table only "public"."product_images"
    add constraint "product_images_object_key_key" unique ("object_key");

-- CASCADE: deleteProduct relies on this. It deletes only the products row and never
-- touches product_images; the cascade removes the metadata rows.
alter table only "public"."product_images"
    add constraint "product_images_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id")
    on update cascade on delete cascade;

create index if not exists "product_images_product_id_sort_order_idx"
    on "public"."product_images" using "btree" ("product_id", "sort_order", "created_at");
