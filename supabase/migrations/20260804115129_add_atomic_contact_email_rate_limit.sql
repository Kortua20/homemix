create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create extension if not exists pgcrypto with schema extensions;

create table if not exists private.contact_email_rate_limits (
  client_id uuid primary key,
  send_count smallint not null default 0 check (send_count between 0 and 3),
  window_started_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

alter table private.contact_email_rate_limits enable row level security;
revoke all on table private.contact_email_rate_limits from public, anon, authenticated;

create or replace function public.reserve_contact_email_quota(
  p_client_id uuid,
  p_secret text
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
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
    contact_email_rate_limits.send_count,
    contact_email_rate_limits.window_started_at + interval '24 hours'
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

create or replace function public.release_contact_email_quota(
  p_client_id uuid,
  p_secret text
)
returns void
language plpgsql
security definer
set search_path = ''
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

revoke execute on function public.reserve_contact_email_quota(uuid, text) from public, authenticated;
revoke execute on function public.release_contact_email_quota(uuid, text) from public, authenticated;
grant execute on function public.reserve_contact_email_quota(uuid, text) to anon;
grant execute on function public.release_contact_email_quota(uuid, text) to anon;
