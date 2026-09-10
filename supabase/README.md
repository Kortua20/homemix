# Database

One Supabase project (`ywhrehfugxtbqclgdhwx`, "Homemix", Postgres 17) backs **both**
applications:

- `homemix` (this repo) — the public storefront. Reads anonymously with the publishable key.
- `homemix-admin` (sibling repo) — the staff back-office. Writes with a signed-in user's JWT.

There is no shared API between them. They share a *database*, not a backend. Each app
queries Postgres directly through PostgREST.

**This repo owns the schema.** The admin repo consumes `lib/database.types.ts` and must
not carry its own migrations — two migration histories against one database will desync.

## Layout

| Path                   | What it is                                                        |
| ---------------------- | ----------------------------------------------------------------- |
| `schemas/`             | Declarative schema — the source of truth for the desired state.    |
| `migrations/`          | Generated/hand-written migrations, applied in timestamp order.     |
| `migrations_archive/`  | Superseded migrations, kept for history. Never re-apply.           |
| `config.toml`          | Project ref and the explicit `schema_paths` load order.            |

`schemas/` files are numbered because foreign keys impose an order: `categories` before
`products` and `category_images`; `products` before `product_images`; grants and policies
last. That order is declared in `config.toml`.

## Changing the schema

1. Edit the relevant file in `schemas/`.
2. Generate a migration:
   ```bash
   npx supabase db diff -f describe_the_change
   ```
3. Read the generated SQL in `migrations/`. Do not skip this — see Caveats.
4. Apply it:
   ```bash
   npx supabase db push
   ```
5. Regenerate types for **both** repos:
   ```bash
   npx supabase gen types typescript --linked > lib/database.types.ts
   cp lib/database.types.ts ../homemix-admin/lib/database.types.ts
   ```

Do not change the schema through the Supabase dashboard. That is how the drift described
below happened.

## Caveats

**`db diff` compares schema files against migrations, not against the live database.**
Changes made directly in the dashboard are invisible to it — it will report "no schema
changes found" while production has silently moved.

**The differ does not reliably capture RLS policies, grants, comments, or view
`security_invoker` settings.** Since RLS is the only thing authorising writes here, treat
`schemas/07_grants_and_rls.sql` as hand-maintained: when you change a policy, write the
migration yourself rather than trusting the diff to notice.

## Known drift (2026-09-11)

Production's migration history has 12 entries; this repo had 4. The 8 missing ones include
everything that created the catalog tables, plus one change applied after the last commited
file. The four stale files were moved to `migrations_archive/`, and `schemas/` was rebuilt
from a read-only `supabase db dump` of production, which is now the baseline.

Consequence: **local migration history does not match remote.** Before the first
`db push`, confirm what the CLI intends to apply:

```bash
npx supabase migration list --linked
npx supabase db push --dry-run
```

One corrective migration is written but **not applied**:
`migrations/20260911000000_tighten_image_table_grants.sql`. See its header for why.
