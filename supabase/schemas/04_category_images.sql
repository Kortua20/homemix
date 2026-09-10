-- Category image metadata. Bytes live in Cloudflare R2; only the object key is stored.
-- Captured from production 2026-09-11.

create table if not exists "public"."category_images" (
    "id" "uuid" default "gen_random_uuid"() not null,
    "category_id" "uuid" not null,
    "object_key" "text" not null,
    "original_name" "text" not null,
    "content_type" "text" not null,
    "size_bytes" bigint not null,
    "sort_order" integer default 0 not null,
    "created_at" timestamp with time zone default "now"() not null,
    constraint "category_images_content_type_check"
        check (("content_type" = any (array[
            'image/jpeg'::"text", 'image/png'::"text", 'image/webp'::"text"]))),
    -- Enforces the R2 layout: categories/<category-uuid>/<file-uuid>.<ext>
    constraint "category_images_object_key_check"
        check (("object_key" ~ '^categories/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f-]+\.(jpg|jpeg|png|webp)$'::"text")),
    constraint "category_images_size_check"
        check ((("size_bytes" > 0) and ("size_bytes" <= 5242880))),
    constraint "category_images_sort_order_check"
        check (("sort_order" >= 0))
);

alter table "public"."category_images" owner to "postgres";

alter table only "public"."category_images"
    add constraint "category_images_pkey" primary key ("id");

alter table only "public"."category_images"
    add constraint "category_images_object_key_key" unique ("object_key");

-- CASCADE: deleting a category removes its image rows. The R2 objects are deleted
-- separately, best-effort, by the admin's deleteCategory server action.
alter table only "public"."category_images"
    add constraint "category_images_category_id_fkey"
    foreign key ("category_id") references "public"."categories"("id")
    on update cascade on delete cascade;

create index if not exists "category_images_category_id_sort_order_idx"
    on "public"."category_images" using "btree" ("category_id", "sort_order", "created_at");
