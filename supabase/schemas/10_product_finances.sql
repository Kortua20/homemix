-- Internal finances: what a product was bought for, and every sale of it.
-- Added 2026-11-11; see migrations/20261111000000_add_product_finances.sql.
--
-- STAFF ONLY. These are the only catalog objects the storefront must never be able to read,
-- which is why they are separate tables rather than more columns on `products`:
--
--   * `products` is granted SELECT to anon, and RLS works on rows, not columns. Any column
--     added there is readable with the publishable key by anyone who asks for it
--     (`/rest/v1/products?select=purchase_price`), whatever the storefront's own queries
--     select.
--   * Column-level grants could hide them, but a column REVOKE on a table that is granted
--     wholesale is easy to undo by accident (one `grant select on products to anon`
--     restores it), and it would break any `select=*` read with a 42501. A table that anon
--     holds no privilege on at all fails closed.
--
-- Two tables, because a product has one cost but can sell many times:
--
--   * product_finances — one row per product: the purchase price PER UNIT.
--   * product_sales    — one row per sale. A used item sells once (quantity 1); a new item
--     can sell 2 chairs today and 3 next week. Each row snapshots the unit cost and the list
--     price at the moment of sale, so restocking at a new cost or repricing the listing later
--     does not rewrite past profit.
--
-- Nullable figures follow the `not measured ≠ zero` rule in 03_products.sql: a purchase
-- price of 0 (a free pickup) is a real figure, a blank one is "not recorded".

-- ---------------------------------------------------------------------------
-- Purchase price
-- ---------------------------------------------------------------------------

create table if not exists "public"."product_finances" (
    "product_id" "uuid" not null,
    -- Per unit. For new_stocked, stock value = purchase_price * stock_quantity.
    "purchase_price" numeric(12,2),
    "updated_at" timestamp with time zone default "now"() not null,
    constraint "product_finances_purchase_price_check"
        check (("purchase_price" is null)
            or (("purchase_price" >= 0) and ("purchase_price" <= 9999999999.99)))
);

alter table "public"."product_finances" owner to "postgres";

alter table only "public"."product_finances"
    add constraint "product_finances_pkey" primary key ("product_id");

-- CASCADE: a cost means nothing without its product, and nothing else references it.
alter table only "public"."product_finances"
    add constraint "product_finances_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id") on delete cascade;

-- ---------------------------------------------------------------------------
-- Sales
-- ---------------------------------------------------------------------------

create table if not exists "public"."product_sales" (
    "id" "uuid" default "gen_random_uuid"() not null,
    "product_id" "uuid" not null,
    "quantity" integer not null,
    -- What the buyer actually paid for all `quantity` units together. A total rather than a
    -- unit price because a bargain is agreed on the total ("two for 90"), and dividing it
    -- back out can produce a unit price no one ever said.
    "total_price" numeric(12,2) not null,
    -- product_finances.purchase_price at the moment of sale. Null when no cost was recorded;
    -- profit is then unknown rather than equal to the sale price.
    "unit_cost" numeric(12,2),
    -- products.price at the moment of sale, so the bargaining discount is measured against
    -- what was actually advertised then.
    "list_unit_price" numeric(12,2) not null,
    -- A date, not a timestamp: accounting periods are calendar days in Tbilisi, and a
    -- timestamptz would put a sale made at 23:30 local time on the wrong day in UTC.
    "sold_on" "date" not null,
    "note" "text",
    "created_at" timestamp with time zone default "now"() not null,
    constraint "product_sales_quantity_check"
        check (("quantity" >= 1) and ("quantity" <= 1000000)),
    constraint "product_sales_total_price_check"
        check (("total_price" >= 0) and ("total_price" <= 9999999999.99)),
    constraint "product_sales_unit_cost_check"
        check (("unit_cost" is null) or ("unit_cost" >= 0)),
    constraint "product_sales_list_unit_price_check"
        check (("list_unit_price" >= 0)),
    -- Rejects an obviously mistyped year such as 0026. A date in the future is rejected by
    -- the admin instead: a CHECK must not depend on current_date, since it is only evaluated
    -- when a row is written and would not mean the same thing tomorrow.
    constraint "product_sales_sold_on_check"
        check (("sold_on" >= '2000-01-01'::"date")),
    constraint "product_sales_note_check"
        check (("char_length"("note") <= 500))
);

alter table "public"."product_sales" owner to "postgres";

alter table only "public"."product_sales"
    add constraint "product_sales_pkey" primary key ("id");

-- RESTRICT, not CASCADE: deleting a product must not silently delete its sales from the
-- books. A product that has sold is archived; the admin maps the 23503 to a message saying
-- so. (Products sold before this table existed have no sale rows and delete as before.)
alter table only "public"."product_sales"
    add constraint "product_sales_product_id_fkey"
    foreign key ("product_id") references "public"."products"("id") on delete restrict;

-- The FK lookup, and the product page's sale history.
create index if not exists "product_sales_product_id_idx"
    on "public"."product_sales" using "btree" ("product_id");

-- The accounting page's main query: sales between two dates.
create index if not exists "product_sales_sold_on_idx"
    on "public"."product_sales" using "btree" ("sold_on");

-- ---------------------------------------------------------------------------
-- Recording and reversing a sale of a new (stocked) item
-- ---------------------------------------------------------------------------
--
-- A function rather than two client calls, because the sale row and the stock decrement
-- must happen together or not at all: two staff selling the last chair at the same moment
-- must not both succeed, and a failure between the two writes must not leave stock that
-- disagrees with the books. `for update` serialises concurrent sales of the same product.
--
-- SECURITY INVOKER: it runs as the caller, so the RLS policies on products and
-- product_sales still decide who may do this. It grants no power of its own.
--
-- Used items do not come through here. A used item sells exactly once, and its sale is
-- recorded by setting its status to `sold` in the product form, which writes the sale row
-- directly — there is no stock to keep in step.
--
-- Selling the last unit sets the status to `sold`, so the item leaves the storefront's
-- catalog lists (which filter on status) instead of lingering there as unbuyable.

create or replace function "public"."record_product_sale"(
    "p_product_id" "uuid",
    "p_quantity" integer,
    "p_total_price" numeric,
    "p_sold_on" "date",
    "p_note" "text" default null
) returns "uuid"
    language "plpgsql"
    security invoker
    set "search_path" to ''
    as $$
declare
    v_kind text;
    v_stock integer;
    v_price numeric(12,2);
    v_cost numeric(12,2);
    v_sale_id uuid;
begin
    select "listing_kind", "stock_quantity", "price"
      into v_kind, v_stock, v_price
      from "public"."products"
     where "id" = p_product_id
       for update;

    if not found then
        raise exception 'product_not_found' using errcode = 'P0002';
    end if;

    if v_kind <> 'new_stocked' then
        raise exception 'not_stocked_product' using errcode = '22023';
    end if;

    if p_quantity is null or p_quantity < 1 then
        raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    if coalesce(v_stock, 0) < p_quantity then
        raise exception 'insufficient_stock' using errcode = '22023';
    end if;

    select "purchase_price" into v_cost
      from "public"."product_finances"
     where "product_id" = p_product_id;

    update "public"."products"
       set "stock_quantity" = v_stock - p_quantity,
           "status" = case when v_stock - p_quantity = 0 then 'sold' else "status" end,
           "updated_at" = now()
     where "id" = p_product_id;

    insert into "public"."product_sales"
        ("product_id", "quantity", "total_price", "unit_cost", "list_unit_price", "sold_on", "note")
    values
        (p_product_id, p_quantity, p_total_price, v_cost, v_price, p_sold_on, nullif(btrim(p_note), ''))
    returning "id" into v_sale_id;

    return v_sale_id;
end;
$$;

alter function "public"."record_product_sale"("uuid", integer, numeric, "date", "text") owner to "postgres";

-- The exact inverse, for a sale entered by mistake: the units go back on the shelf, and an
-- item that the sale had sold out becomes available again.
create or replace function "public"."delete_product_sale"("p_sale_id" "uuid")
    returns void
    language "plpgsql"
    security invoker
    set "search_path" to ''
    as $$
declare
    v_product_id uuid;
    v_quantity integer;
    v_kind text;
begin
    select s."product_id", s."quantity", p."listing_kind"
      into v_product_id, v_quantity, v_kind
      from "public"."product_sales" s
      join "public"."products" p on p."id" = s."product_id"
     where s."id" = p_sale_id
       for update of p;

    if not found then
        raise exception 'sale_not_found' using errcode = 'P0002';
    end if;

    if v_kind <> 'new_stocked' then
        raise exception 'not_stocked_product' using errcode = '22023';
    end if;

    delete from "public"."product_sales" where "id" = p_sale_id;

    update "public"."products"
       set "stock_quantity" = coalesce("stock_quantity", 0) + v_quantity,
           "status" = case when "status" = 'sold' then 'available' else "status" end,
           "updated_at" = now()
     where "id" = v_product_id;
end;
$$;

alter function "public"."delete_product_sale"("uuid") owner to "postgres";

-- ---------------------------------------------------------------------------
-- Accounting views
-- ---------------------------------------------------------------------------
--
-- security_invoker on both: the view runs with the CALLER's privileges and RLS, not the
-- owner's. Without it a view owned by postgres would bypass RLS entirely, and the grants
-- below would be the only protection. With it, both layers apply.

-- One row per product, for the stock report and for finding products marked `sold` that
-- have no sale recorded (everything sold before this table existed).
create or replace view "public"."product_accounting"
    with ("security_invoker" = true) as
select
    "p"."id",
    "p"."slug",
    "p"."name",
    "p"."status",
    "p"."listing_kind",
    "p"."stock_quantity",
    "p"."price",
    "p"."created_at",
    "p"."category_id",
    "c"."name" as "category_name",
    "f"."purchase_price",
    exists (
        select 1 from "public"."product_sales" "s" where "s"."product_id" = "p"."id"
    ) as "has_sales"
from "public"."products" "p"
join "public"."categories" "c" on "c"."id" = "p"."category_id"
left join "public"."product_finances" "f" on "f"."product_id" = "p"."id";

alter view "public"."product_accounting" owner to "postgres";

-- One row per sale, with the product details the sales report shows.
create or replace view "public"."product_sale_ledger"
    with ("security_invoker" = true) as
select
    "s"."id",
    "s"."product_id",
    "p"."slug",
    "p"."name",
    "p"."listing_kind",
    "c"."name" as "category_name",
    "s"."quantity",
    "s"."total_price",
    "s"."unit_cost",
    "s"."list_unit_price",
    "s"."sold_on",
    "s"."note",
    "s"."created_at"
from "public"."product_sales" "s"
join "public"."products" "p" on "p"."id" = "s"."product_id"
join "public"."categories" "c" on "c"."id" = "p"."category_id";

alter view "public"."product_sale_ledger" owner to "postgres";

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------
--
-- Kept here rather than in 07_grants_and_rls.sql because 07 loads first and these objects
-- do not exist yet at that point — same reason 08 carries its own grants.
--
-- Revoke first: Supabase's default privileges grant ALL on new public tables, views and
-- functions to anon. See migrations/20260912000000_tighten_catalog_table_grants.sql.
--
-- Unlike every other catalog table, anon gets NOTHING back. Not even SELECT behind a
-- restrictive policy: with no privilege, an anonymous request fails with 42501 before RLS
-- is consulted, so a future policy mistake cannot expose these figures on its own.

revoke all on table "public"."product_finances" from "anon";
revoke all on table "public"."product_finances" from "authenticated";
grant select, insert, update, delete on table "public"."product_finances" to "authenticated";
grant all on table "public"."product_finances" to "service_role";

revoke all on table "public"."product_sales" from "anon";
revoke all on table "public"."product_sales" from "authenticated";
grant select, insert, update, delete on table "public"."product_sales" to "authenticated";
grant all on table "public"."product_sales" to "service_role";

revoke all on table "public"."product_accounting" from "anon";
revoke all on table "public"."product_accounting" from "authenticated";
grant select on table "public"."product_accounting" to "authenticated";
grant all on table "public"."product_accounting" to "service_role";

revoke all on table "public"."product_sale_ledger" from "anon";
revoke all on table "public"."product_sale_ledger" from "authenticated";
grant select on table "public"."product_sale_ledger" to "authenticated";
grant all on table "public"."product_sale_ledger" to "service_role";

-- Functions are executable by PUBLIC by default, which includes anon.
revoke all on function "public"."record_product_sale"("uuid", integer, numeric, "date", "text") from public, "anon";
grant execute on function "public"."record_product_sale"("uuid", integer, numeric, "date", "text") to "authenticated", "service_role";
revoke all on function "public"."delete_product_sale"("uuid") from public, "anon";
grant execute on function "public"."delete_product_sale"("uuid") to "authenticated", "service_role";

alter table "public"."product_finances" enable row level security;
alter table "public"."product_sales" enable row level security;

-- Same "signed in and not anonymous" predicate as every staff policy in 07: there is no role
-- table, so that is this project's definition of staff.
create policy "Permanent users can manage product finances" on "public"."product_finances"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

create policy "Permanent users can manage product sales" on "public"."product_sales"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));
