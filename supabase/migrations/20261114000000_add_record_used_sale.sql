-- Selling used items from their product page, and undoing any sale from there.
--
-- HAND-WRITTEN, like 20261111000000_add_product_finances.sql, because it carries functions
-- and grants, which `db diff` does not capture reliably (see supabase/README.md). The
-- reasoning lives in schemas/10_product_finances.sql.
--
-- SAFE FOR PRODUCTION — additive and idempotent:
--   * adds record_used_sale: marks a used item sold and records its sale in one transaction;
--   * replaces delete_product_sale with a version that also undoes a used item's sale
--     (status back to available). Its behaviour for new (stocked) items is unchanged;
--   * no table, column, row or policy changes. anon gets no access to the new function.
--
-- Requires 20261111000000_add_product_finances.sql (already applied in production).
--
-- Apply BEFORE deploying the admin that calls record_used_sale.
--
-- Verify after applying, with the publishable (anon) key — must fail with 42501:
--   POST /rest/v1/rpc/record_used_sale

begin;

-- Selling a used (one-off) item from its product page: mark it sold and record its single
-- sale, together. Added 2026-11-14; see migrations/20261114000000_add_record_used_sale.sql.
--
-- A function for the same reasons as record_product_sale: the status change and the sale
-- row must not come apart, and `for update` makes a second consultant recording the same
-- piece at the same moment fail with `already_sold` instead of booking it twice.
--
-- Refuses an item already marked sold. One sold before sales were recorded has no sale row
-- and gets its price through the product form, which knows to ask for the real date rather
-- than today's.
create or replace function "public"."record_used_sale"(
    "p_product_id" "uuid",
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
    v_status text;
    v_price numeric(12,2);
    v_cost numeric(12,2);
    v_sale_id uuid;
begin
    select "listing_kind", "status", "price"
      into v_kind, v_status, v_price
      from "public"."products"
     where "id" = p_product_id
       for update;

    if not found then
        raise exception 'product_not_found' using errcode = 'P0002';
    end if;

    if v_kind <> 'used_unique' then
        raise exception 'not_used_product' using errcode = '22023';
    end if;

    if v_status = 'sold'
       or exists (select 1 from "public"."product_sales" where "product_id" = p_product_id) then
        raise exception 'already_sold' using errcode = '22023';
    end if;

    -- `archived` is a mis-entered listing, not something that can be sold.
    if v_status = 'archived' then
        raise exception 'not_sellable' using errcode = '22023';
    end if;

    if p_total_price is null then
        raise exception 'invalid_price' using errcode = '22023';
    end if;

    select "purchase_price" into v_cost
      from "public"."product_finances"
     where "product_id" = p_product_id;

    update "public"."products"
       set "status" = 'sold',
           "updated_at" = now()
     where "id" = p_product_id;

    insert into "public"."product_sales"
        ("product_id", "quantity", "total_price", "unit_cost", "list_unit_price", "sold_on", "note")
    values
        (p_product_id, 1, p_total_price, v_cost, v_price, p_sold_on, nullif(btrim(p_note), ''))
    returning "id" into v_sale_id;

    return v_sale_id;
end;
$$;

alter function "public"."record_used_sale"("uuid", numeric, "date", "text") owner to "postgres";

-- The exact inverse of either sale, for one entered by mistake:
--   * a new item's units go back on the shelf, and an item the sale had sold out becomes
--     available again;
--   * a used item becomes available again. Its status before the sale (available or
--     reserved) is not recorded, so `available` is the honest default; staff can reserve it
--     again in the form.
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

    delete from "public"."product_sales" where "id" = p_sale_id;

    if v_kind = 'new_stocked' then
        update "public"."products"
           set "stock_quantity" = coalesce("stock_quantity", 0) + v_quantity,
               "status" = case when "status" = 'sold' then 'available' else "status" end,
               "updated_at" = now()
         where "id" = v_product_id;
    else
        update "public"."products"
           set "status" = case when "status" = 'sold' then 'available' else "status" end,
               "updated_at" = now()
         where "id" = v_product_id;
    end if;
end;
$$;

alter function "public"."delete_product_sale"("uuid") owner to "postgres";

-- Functions are executable by PUBLIC by default, which includes anon.
revoke all on function "public"."record_used_sale"("uuid", numeric, "date", "text") from public, "anon";
grant execute on function "public"."record_used_sale"("uuid", numeric, "date", "text") to "authenticated", "service_role";
-- create or replace keeps delete_product_sale's existing grants; restated so the file stands alone.
revoke all on function "public"."delete_product_sale"("uuid") from public, "anon";
grant execute on function "public"."delete_product_sale"("uuid") to "authenticated", "service_role";

commit;
