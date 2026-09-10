-- Extensions and non-public schemas.
-- Captured from production 2026-09-11 via `supabase db dump --linked`.

create schema if not exists "private";

alter schema "private" owner to "postgres";

create extension if not exists "pg_stat_statements" with schema "extensions";
create extension if not exists "pgcrypto" with schema "extensions";
create extension if not exists "supabase_vault" with schema "vault";
create extension if not exists "uuid-ossp" with schema "extensions";
