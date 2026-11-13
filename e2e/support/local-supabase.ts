import { execSync } from "node:child_process";

import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

// Access to the LOCAL Supabase stack for end-to-end tests. Mirrors the admin repo's
// e2e/support/local-supabase.ts — the two repos share a database, not code.
//
// SAFETY: fixtures are written with the service-role key, which bypasses RLS, so these tests
// must never point at production. assertLocalSupabase() refuses anything that is not a
// loopback address.

loadEnvConfig(process.cwd());

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export function assertLocalSupabase() {
  let host = "";
  try {
    host = new URL(supabaseUrl).hostname;
  } catch {
    // falls through to the error below
  }

  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `E2E tests only run against a local Supabase stack, but NEXT_PUBLIC_SUPABASE_URL is "${supabaseUrl || "(unset)"}". ` +
        "Point .env.local at the local stack (`npx supabase start`) and try again.",
    );
  }
}

// From SUPABASE_SERVICE_ROLE_KEY if set, otherwise from the local stack this repo runs.
function resolveServiceRoleKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;

  let status: { API_URL?: string; SERVICE_ROLE_KEY?: string };
  try {
    status = JSON.parse(
      execSync("npx --yes supabase status -o json", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
  } catch {
    throw new Error(
      "Could not read the local Supabase stack. Start it with `npx supabase start`, or set SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (status.API_URL?.replace(/\/$/, "") !== supabaseUrl.replace(/\/$/, "")) {
    throw new Error(`The local stack serves ${status.API_URL}, but the app uses ${supabaseUrl}.`);
  }
  if (!status.SERVICE_ROLE_KEY) throw new Error("`supabase status` returned no service-role key.");
  return status.SERVICE_ROLE_KEY;
}

let adminClient: SupabaseClient<Database> | null = null;

// Service-role client: bypasses RLS. Fixtures only — never app code.
export function createAdminClient() {
  assertLocalSupabase();
  adminClient ??= createClient<Database>(supabaseUrl, resolveServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
