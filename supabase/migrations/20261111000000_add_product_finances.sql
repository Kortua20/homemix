-- Internal finances: purchase price per product, a sales table, atomic sale recording for
-- stocked items, and two staff-only accounting views.
--
-- HAND-WRITTEN, like 20261110000000_add_folding_and_storage.sql, because it carries grants,
-- RLS, functions and security_invoker views, none of which `db diff` captures reliably (see
-- supabase/README.md). The reasoning for every object lives in schemas/10_product_finances.sql.
--
-- SAFE FOR PRODUCTION — purely additive:
--   * creates 2 tables, 2 views and 2 functions. No existing table, column, constraint,
--     policy or row is altered or deleted;
--   * no backfill: existing products start with no recorded cost and no sale rows;
--   * the storefront never reads any of these objects, and anon is granted nothing on them;
--   * idempotent: re-running it is a no-op.
--
-- The one behaviour change to existing data paths: a product with recorded sales can no
-- longer be deleted (product_sales_product_id_fkey is RESTRICT). Products sold before this
-- migration have no sale rows and delete exactly as before.
--
-- Apply BEFORE deploying the admin: its product pages embed these tables and would fail to
-- load against a database without them. The storefront change (showing stock counts) reads
-- only existing columns and can deploy in any order.
--
-- Verify after applying, with the publishable (anon) key — all must fail with 42501:
--   GET  /rest/v1/product_finances?select=*
--   GET  /rest/v1/product_sales?select=*
--   GET  /rest/v1/product_accounting?select=*
--   GET  /rest/v1/product_sale_ledger?select=*
--   POST /rest/v1/rpc/record_product_sale
--
-- Rollback (only while no real sales have been recorded — it deletes them):
--   drop view public.product_sale_ledger, public.product_accounting;
--   drop function public.record_product_sale(uuid, integer, numeric, date, text),
--                 public.delete_product_sale(uuid);
--   drop table public.product_sales, public.product_finances;

begin;

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
            or (("purchase_price" >= 0) and ("purchase_price" <= 9999999999.99))),
    constraint "product_finances_pkey" primary key ("product_id"),
    constraint "product_finances_product_id_fkey"
        foreign key ("product_id") references "public"."products"("id") on delete cascade
);

alter table "public"."product_finances" owner to "postgres";

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
        check (("char_length"("note") <= 500)),
    constraint "product_sales_pkey" primary key ("id"),
    -- RESTRICT, not CASCADE: deleting a product must not silently delete its sales from
    -- the books. See schemas/10_product_finances.sql.
    constraint "product_sales_product_id_fkey"
        foreign key ("product_id") references "public"."products"("id") on delete restrict
);

alter table "public"."product_sales" owner to "postgres";

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
drop policy if exists "Permanent users can manage product finances" on "public"."product_finances";
create policy "Permanent users can manage product finances" on "public"."product_finances"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

drop policy if exists "Permanent users can manage product sales" on "public"."product_sales";
create policy "Permanent users can manage product sales" on "public"."product_sales"
    for all to "authenticated"
    using (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)))
    with check (((( select "auth"."uid"() as "uid") is not null)
        and (coalesce((((select "auth"."jwt"() as "jwt") ->> 'is_anonymous'::"text"))::boolean, false) = false)));

commit;
