import { defineConfig, devices } from "@playwright/test";

// End-to-end tests for what a customer sees (async Server Components can only be tested in a
// real browser) and for what the storefront's public key can reach. Unit and component tests
// run with Vitest (`npm test`); database tests with pgTAP (`npm run test:db`).
//
// Runs against the LOCAL Supabase stack only — see e2e/support/local-supabase.ts. Every test
// creates and removes its own data.

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // Serial: the suite is small, and one dev server compiling pages for parallel workers is
  // slower and flakier than running the tests one after another.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  // First visits compile pages in `next dev`, which can take a while.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices["Desktop Chrome"],
    // Locally, the installed Google Chrome — no browser download needed. In CI, the
    // Chromium that `npx playwright install chromium` provides.
    channel: process.env.CI ? undefined : "chrome",
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
