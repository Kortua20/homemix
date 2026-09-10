-- Contact-form rate limiting, used by the storefront's /api/contact route.
-- The table lives in the `private` schema so it is not reachable through the Data API;
-- the two SECURITY DEFINER functions are the only way in, and both require a shared
-- secret whose SHA-256 is compared below.
-- Captured from production 2026-09-11.

create table if not exists "private"."contact_email_rate_limits" (
    "client_id" "uuid" not null,
    "send_count" smallint default 0 not null,
    "window_started_at" timestamp with time zone default "clock_timestamp"() not null,
    "updated_at" timestamp with time zone default "clock_timestamp"() not null,
    constraint "contact_email_rate_limits_send_count_check"
        check ((("send_count" >= 0) and ("send_count" <= 3)))
);

alter table "private"."contact_email_rate_limits" owner to "postgres";

alter table only "private"."contact_email_rate_limits"
    add constraint "contact_email_rate_limits_pkey" primary key ("client_id");

alter table "private"."contact_email_rate_limits" enable row level security;

-- Atomically claims one of three sends per 24h window for a client id.
create or replace function "public"."reserve_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text")
returns table("allowed" boolean, "remaining" integer, "reset_at" timestamp with time zone)
    language "plpgsql" security definer
    set "search_path" to ''
    as $$
declare
  v_count smallint;
  v_reset_at timestamptz;
begin
  if encode(extensions.digest(p_secret, 'sha256'), 'hex') <>
    '1ed677e15267ec1b462b045e4e1ad29231156695d172bd68c705a41f74188f2e'
  then
    raise exception 'invalid rate limit secret' using errcode = '42501';
  end if;

  insert into private.contact_email_rate_limits as limits (
    client_id,
    send_count,
    window_started_at,
    updated_at
  )
  values (
    p_client_id,
    1,
    clock_timestamp(),
    clock_timestamp()
  )
  on conflict (client_id) do update
  set
    send_count = case
      when limits.window_started_at <= clock_timestamp() - interval '24 hours' then 1
      else limits.send_count + 1
    end,
    window_started_at = case
      when limits.window_started_at <= clock_timestamp() - interval '24 hours' then clock_timestamp()
      else limits.window_started_at
    end,
    updated_at = clock_timestamp()
  where
    limits.window_started_at <= clock_timestamp() - interval '24 hours'
    or limits.send_count < 3
  returning
    limits.send_count,
    limits.window_started_at + interval '24 hours'
  into v_count, v_reset_at;

  if found then
    return query select true, 3 - v_count, v_reset_at;
    return;
  end if;

  select
    limits.send_count,
    limits.window_started_at + interval '24 hours'
  into v_count, v_reset_at
  from private.contact_email_rate_limits as limits
  where limits.client_id = p_client_id;

  return query select false, 0, v_reset_at;
end;
$$;

alter function "public"."reserve_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text") owner to "postgres";

-- Gives a reserved send back when the email fails to dispatch.
create or replace function "public"."release_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text")
returns "void"
    language "plpgsql" security definer
    set "search_path" to ''
    as $$
begin
  if encode(extensions.digest(p_secret, 'sha256'), 'hex') <>
    '1ed677e15267ec1b462b045e4e1ad29231156695d172bd68c705a41f74188f2e'
  then
    raise exception 'invalid rate limit secret' using errcode = '42501';
  end if;

  update private.contact_email_rate_limits as limits
  set
    send_count = greatest(limits.send_count - 1, 0),
    updated_at = clock_timestamp()
  where
    limits.client_id = p_client_id
    and limits.window_started_at > clock_timestamp() - interval '24 hours'
    and limits.send_count > 0;
end;
$$;

alter function "public"."release_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text") owner to "postgres";

revoke all on function "public"."reserve_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text") from public;
grant all on function "public"."reserve_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text") to "anon";
grant all on function "public"."reserve_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text") to "service_role";

revoke all on function "public"."release_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text") from public;
grant all on function "public"."release_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text") to "anon";
grant all on function "public"."release_contact_email_quota"(
    "p_client_id" "uuid", "p_secret" "text") to "service_role";
