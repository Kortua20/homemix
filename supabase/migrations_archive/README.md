# Archived migrations

These four migration files were the only ones ever committed to this repo. They are
archived — **not** deleted — because they no longer represent a usable baseline.

## Why they were archived

On 2026-09-11 we compared local migration files against the remote migration history
of the production project (`ywhrehfugxtbqclgdhwx`, "Homemix"):

| Remote timestamp | Present locally? |
| ---------------- | ---------------- |
| 20260728121506   | no               |
| 20260728121536   | no               |
| 20260728121953   | no               |
| 20260728122057   | no               |
| 20260730111555   | no               |
| 20260730113341   | no               |
| 20260730121146   | no               |
| 20260801123141   | yes              |
| 20260801124607   | yes              |
| 20260804115129   | yes              |
| 20260804115736   | yes              |
| 20260807142624   | no               |

Twelve migrations are applied in production; only four existed here. The eight missing
ones include everything that created `products`, `categories`, `category_images` and
`product_images`, plus one later change (20260807142624) applied *after* the last file
committed here.

Because the local history was an incomplete subset of the remote history, running
`supabase db push` would have been unsafe: the CLI's view of what is applied disagreed
with reality.

## What replaced them

`supabase/schemas/` now holds the declarative schema, generated from a read-only
`supabase db dump` of production. That snapshot is the source of truth going forward.

## Do not re-apply these

The statements in these files are already applied in production. They are kept only as
historical reference for how the RLS policies and the contact rate limiter were
originally introduced. The equivalent current state lives in `supabase/schemas/`.
