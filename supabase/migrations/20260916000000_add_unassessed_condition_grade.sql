-- Adds the `unassessed` condition grade and repoints the step 1 backfill at it.
--
-- WHY THIS EXISTS
-- ---------------
-- The step 1 migration (20260913000000) backfills every pre-existing product with
-- condition_grade = 'good'. Testing that against a copy of production showed what it
-- actually asserts: "Good condition" on 28 items nobody has inspected, including 13
-- multi-piece bundles and 4 listings whose own names say "ახალი" (new).
--
-- The CHECK constraint makes a grade mandatory for used_unique rows — that is the point of
-- it — so the backfill cannot simply leave the column NULL. `unassessed` is the honest
-- third option: it satisfies the constraint without making a claim.
--
-- Products stay `available`, so the live catalogue is unaffected. The storefront renders
-- "assessment in progress" rather than a fabricated grade, and each item can be reassessed
-- at whatever pace suits.
--
-- sort_order 99, not 0: the other five grades form a quality ladder (as_new → restoration).
-- `unassessed` is not a rung on that ladder, it is the absence of a rating. Sorting it last
-- keeps "show me the roughest items" ordering meaningful.
--
-- SAFE TO RE-RUN. The insert is ON CONFLICT DO NOTHING, and the UPDATE only touches rows
-- still carrying the placeholder.

begin;

insert into "public"."condition_grades"
    ("code", "sort_order", "label_ka", "label_en", "description_ka")
values
    ('unassessed', 99, 'შეფასება მიმდინარეობს', 'Assessment in progress',
        'ამ ნივთის მდგომარეობა ჯერ დეტალურად არ შეგვიფასებია. დაგვიკავშირდით ზუსტი ინფორმაციისთვის.')
on conflict ("code") do nothing;

-- Repoint the step 1 placeholder.
--
-- Scoped to rows that still look untouched: grade 'good' AND no condition_summary AND no
-- flaws recorded. A product someone has genuinely assessed as 'good' since the step 1
-- migration ran would have a summary or flaws, and must not be reset to unassessed.
update "public"."products" as p
set "condition_grade" = 'unassessed'
where p."listing_kind" = 'used_unique'
  and p."condition_grade" = 'good'
  and coalesce("btrim"(p."condition_summary"), '') = ''
  and not exists (
      select 1 from "public"."product_flaws" f where f."product_id" = p."id"
  )
  and not exists (
      select 1 from "public"."product_condition_aspects" a where a."product_id" = p."id"
  );

commit;
