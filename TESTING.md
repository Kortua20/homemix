# Testing — storefront

Three layers, each testing what only it can:

| Command | Tool | What it covers |
| --- | --- | --- |
| `npm test` | Vitest + Testing Library | Pure logic and components: e.g. the stock label on cards and product pages. |
| `npm run test:db` | pgTAP (`supabase test db`) | The database itself: grants, RLS, the sale functions, constraints. |
| `npm run test:e2e` | Playwright | Real pages in a real browser (async Server Components can't be unit-tested), and what the public API key can reach. |

`npm run test:watch` re-runs Vitest on save.

## Prerequisites

- **The local Supabase stack** for `test:db` and `test:e2e`: `npx supabase start`. Both refuse to touch
  anything else: `supabase test db` targets the local stack unless given `--remote`, and the E2E suite
  aborts unless `NEXT_PUBLIC_SUPABASE_URL` is a loopback address.
- **Google Chrome** for `test:e2e` locally. The config uses the installed Chrome, so there's no browser
  download. In CI it uses Playwright's Chromium instead (`npx playwright install chromium`).
- `test:e2e` reuses a dev server already running on port 3000, or starts one.

## Database tests (`supabase/tests/database/`)

These are the most important tests in the project. They pin down the promise that **purchase prices and
sale prices are never readable by the storefront's publishable key**: `anon` holds no privilege on any
finance table, view or function, so a request fails with `42501` before RLS is even consulted. They
also cover staff vs. anonymous sign-ins, atomic stock changes, overselling, sold-out status, undo, and
the RESTRICT on deleting a product that has sales.

Each file runs in one transaction that is rolled back, creates its own fixtures, and leaves the
database exactly as it found it. Run them after every schema change, before `db push`.

## E2E tests (`e2e/`)

Each test creates its own category and products with unique slugs through the local service-role key,
and removes them afterwards. The key is read from `npx supabase status` (or `SUPABASE_SERVICE_ROLE_KEY`)
and never stored. Tests never depend on `seed.sql`.

## Conventions

- Unit and component tests sit next to the code they test: `lib/storefront.test.ts`,
  `components/product-card.test.tsx`.
- Query by what a user perceives — role, label, visible text — not by CSS classes.
- `server-only` is aliased to an empty stub in `vitest.config.mts`, so server modules can be imported
  in tests.
