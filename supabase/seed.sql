-- Local development seed data.
--
-- Loaded automatically by `supabase db reset` (see [db.seed] in config.toml).
-- NEVER applied to production — this file is only read by the local stack.
--
-- Contains invented sample products, not a copy of production data. Slugs must
-- satisfy the catalog's slug CHECK constraint: Georgian letters or lowercase
-- ASCII, hyphen-separated, 2-160 chars.
--
-- Note on images: product_images / category_images rows are deliberately NOT
-- seeded. Those rows only carry metadata; the bytes live in Cloudflare R2, and
-- the object_key CHECK constraint requires a real R2 path. Seeding them would
-- produce rows whose images 404 locally. Both apps render an empty-state when a
-- product has no images, which is the honest local result.

begin;

-- Fixed UUIDs so re-running the seed is idempotent and products can reference
-- categories without a lookup.
insert into public.categories (id, slug, name, description) values
  (
    '11111111-1111-4111-8111-111111111111',
    'divani',
    'დივნები',
    'მოქნილი და კომფორტული დივნები მისაღები ოთახისთვის.'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'magida',
    'მაგიდები',
    'სასადილო და ჟურნალის მაგიდები ბუნებრივი ხისგან.'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'skami',
    'სკამები',
    'სკამები და ტაბურეტები ყოველდღიური გამოყენებისთვის.'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'karada',
    'კარადები',
    'ტანსაცმლისა და საცავის კარადები.'
  )
on conflict (id) do nothing;

-- Products carry the listing_kind / status / condition columns explicitly rather than
-- leaning on the defaults: products_condition_matches_kind_check requires a used_unique
-- row to have a condition_grade, and the column default is NULL.
--
-- The mix is deliberate — used_unique and new_stocked rows, and one of each non-draft
-- status — so local development exercises both branches of the discriminator and the
-- storefront's status filtering has something to filter.
insert into public.products
  (id, slug, name, description, price, category_id,
   listing_kind, status, condition_grade, condition_summary, stock_quantity) values
  (
    'aaaaaaaa-0001-4000-8000-000000000001',
    'tbilisi-divani',
    'თბილისი — სამადგილიანი დივანი',
    'სამადგილიანი დივანი ხის კარკასით და მოსახსნელი ქსოვილის გადასაფარებლით.',
    2450.00,
    '11111111-1111-4111-8111-111111111111',
    'used_unique', 'available', 'good',
    'ქსოვილზე მსუბუქი ცვეთა მარჯვენა სახელურთან. კარკასი მდგრადია.', null
  ),
  (
    'aaaaaaaa-0002-4000-8000-000000000002',
    'kutaisi-kutkhis-divani',
    'ქუთაისი — კუთხის დივანი',
    'კუთხის დივანი საცავით; შესაძლებელია მარცხენა ან მარჯვენა კონფიგურაცია.',
    3890.50,
    '11111111-1111-4111-8111-111111111111',
    'used_unique', 'available', 'excellent',
    'თითქმის უნაკლო მდგომარეობა. საცავის მექანიზმი გამართულია.', null
  ),
  (
    'aaaaaaaa-0003-4000-8000-000000000003',
    'mukhis-sasadilo-magida',
    'მუხის სასადილო მაგიდა',
    'მასიური მუხის სასადილო მაგიდა ექვს პერსონაზე.',
    1780.00,
    '22222222-2222-4222-8222-222222222222',
    'used_unique', 'available', 'fair',
    'ზედაპირზე ჭიქების კვალი და რამდენიმე ნაკაწრი. ფეხები მყარია.', null
  ),
  (
    'aaaaaaaa-0004-4000-8000-000000000004',
    'zhurnalis-magida-mrgvali',
    'მრგვალი ჟურნალის მაგიდა',
    'მრგვალი ჟურნალის მაგიდა ლითონის ფეხებით.',
    640.00,
    '22222222-2222-4222-8222-222222222222',
    'used_unique', 'sold', 'good',
    'მსუბუქი ცვეთა ლითონის ფეხებზე.', null
  ),
  (
    'aaaaaaaa-0005-4000-8000-000000000005',
    'sasadilo-skami-natural',
    'სასადილო სკამი — ნატურალური',
    'ხის სასადილო სკამი რბილი ჯდომის ზედაპირით.',
    295.00,
    '33333333-3333-4333-8333-333333333333',
    'new_stocked', 'available', null, null, 12
  ),
  (
    'aaaaaaaa-0006-4000-8000-000000000006',
    'baris-taburetka',
    'ბარის ტაბურეტი',
    'რეგულირებადი სიმაღლის ბარის ტაბურეტი.',
    410.00,
    '33333333-3333-4333-8333-333333333333',
    'new_stocked', 'available', null, null, 4
  ),
  (
    'aaaaaaaa-0007-4000-8000-000000000007',
    'orkariania-karada',
    'ორკარიანი კარადა',
    'ორკარიანი კარადა თაროებითა და საკიდი ჯოხით.',
    2130.00,
    '44444444-4444-4444-8444-444444444444',
    'used_unique', 'reserved', 'good',
    'შიდა თაროები უნაკლოა. კარის კიდეზე მცირე ჩამოტეხვა.', null
  ),
  (
    'aaaaaaaa-0008-4000-8000-000000000008',
    'tsignis-taro-maghali',
    'მაღალი წიგნის თარო',
    'ხუთსართულიანი წიგნის თარო მისაღები ოთახისთვის.',
    0.00,
    '44444444-4444-4444-8444-444444444444',
    'used_unique', 'draft', 'restoration',
    'საჭიროებს გადაწებებას და ხელახლა დამუშავებას. ჯერ არ არის გამოსაქვეყნებელი.', null
  )
on conflict (id) do nothing;

-- Dimensions (roadmap step 3). Deliberately uneven: some products carry a full set, some
-- only the bounding box, one has none at all. A seed where every row is complete would
-- hide the empty and partial states the storefront has to handle.
update public.products set
  width_cm = 210.0, depth_cm = 92.0, height_cm = 78.0, seat_height_cm = 44.0, weight_kg = 58.50
where slug = 'tbilisi-divani';

update public.products set
  width_cm = 265.0, depth_cm = 175.0, height_cm = 82.0, seat_height_cm = 45.0, weight_kg = 96.00,
  dimension_note = 'კუთხის ნაწილი შეიძლება მარცხნივ ან მარჯვნივ განთავსდეს.'
where slug = 'kutaisi-kutkhis-divani';

update public.products set
  width_cm = 180.0, depth_cm = 90.0, height_cm = 75.0, weight_kg = 42.00
where slug = 'mukhis-sasadilo-magida';

update public.products set
  width_cm = 90.0, depth_cm = 90.0, height_cm = 45.0,
  dimension_note = 'მრგვალი — დიამეტრი 90 სმ.'
where slug = 'zhurnalis-magida-mrgvali';

update public.products set
  width_cm = 46.0, depth_cm = 52.0, height_cm = 88.0, seat_height_cm = 46.0, weight_kg = 5.20
where slug = 'sasadilo-skami-natural';

update public.products set
  width_cm = 38.0, depth_cm = 38.0, height_cm = 96.0, seat_height_cm = 74.5, weight_kg = 4.80,
  dimension_note = 'სიმაღლე რეგულირებადია 68-სა და 78 სმ-ს შორის.'
where slug = 'baris-taburetka';

update public.products set
  width_cm = 120.0, depth_cm = 58.0, height_cm = 200.0, weight_kg = 78.00
where slug = 'orkariania-karada';

-- tsignis-taro-maghali deliberately left without dimensions: it is the draft row, and a
-- half-documented listing is exactly what `draft` is for.

-- Attributes (roadmap step 3b). Deliberately uneven, like the dimensions above: some
-- products carry material + colour + style, some only a colour, and the draft carries none.
-- A seed where every product is fully tagged would hide the partial states the facet UI
-- has to render.
insert into public.product_materials (product_id, material_code) values
  ('aaaaaaaa-0001-4000-8000-000000000001', 'linen'),
  ('aaaaaaaa-0001-4000-8000-000000000001', 'oak'),
  ('aaaaaaaa-0002-4000-8000-000000000002', 'velvet'),
  ('aaaaaaaa-0003-4000-8000-000000000003', 'oak'),
  ('aaaaaaaa-0004-4000-8000-000000000004', 'glass'),
  ('aaaaaaaa-0004-4000-8000-000000000004', 'metal'),
  ('aaaaaaaa-0005-4000-8000-000000000005', 'beech'),
  ('aaaaaaaa-0006-4000-8000-000000000006', 'metal'),
  ('aaaaaaaa-0007-4000-8000-000000000007', 'mdf')
on conflict (product_id, material_code) do nothing;

insert into public.product_colours (product_id, colour_code) values
  ('aaaaaaaa-0001-4000-8000-000000000001', 'grey'),
  ('aaaaaaaa-0002-4000-8000-000000000002', 'green'),
  ('aaaaaaaa-0003-4000-8000-000000000003', 'natural'),
  ('aaaaaaaa-0004-4000-8000-000000000004', 'black'),
  ('aaaaaaaa-0005-4000-8000-000000000005', 'natural'),
  ('aaaaaaaa-0006-4000-8000-000000000006', 'black'),
  ('aaaaaaaa-0007-4000-8000-000000000007', 'white'),
  ('aaaaaaaa-0008-4000-8000-000000000008', 'brown')
on conflict (product_id, colour_code) do nothing;

-- Styles are sparser still: only three products carry one.
insert into public.product_styles (product_id, style_code) values
  ('aaaaaaaa-0001-4000-8000-000000000001', 'scandinavian'),
  ('aaaaaaaa-0003-4000-8000-000000000003', 'rustic'),
  ('aaaaaaaa-0006-4000-8000-000000000006', 'industrial')
on conflict (product_id, style_code) do nothing;

-- Condition detail for the used products (roadmap step 2).
--
-- Every flaw here has image_id NULL. That is not a shortcut: product_images rows are
-- deliberately not seeded (the bytes live in R2 and the object_key CHECK requires a real
-- path), so there is no photo to point at locally. It also exercises the nullable path,
-- which is the one a real "smells faintly of smoke" flaw uses.
insert into public.product_condition_aspects
  (product_id, aspect_code, grade_code, note) values
  -- თბილისი — სამადგილიანი დივანი (overall: good)
  ('aaaaaaaa-0001-4000-8000-000000000001', 'structure',  'excellent', 'კარკასი მყარია, ჭრიალი არ აქვს.'),
  ('aaaaaaaa-0001-4000-8000-000000000001', 'surface',    'good',      null),
  ('aaaaaaaa-0001-4000-8000-000000000001', 'upholstery', 'fair',      'მარჯვენა სახელურთან ქსოვილი გაცვეთილია.'),
  ('aaaaaaaa-0001-4000-8000-000000000001', 'odour',      'as_new',    'უცხო სუნი არ აქვს.'),
  -- მუხის სასადილო მაგიდა (overall: fair)
  ('aaaaaaaa-0003-4000-8000-000000000003', 'structure',  'excellent', 'ფეხები მყარია.'),
  ('aaaaaaaa-0003-4000-8000-000000000003', 'surface',    'fair',      'ზედაპირი საჭიროებს განახლებას.'),
  ('aaaaaaaa-0003-4000-8000-000000000003', 'hardware',   'good',      null),
  -- ორკარიანი კარადა (reserved)
  ('aaaaaaaa-0007-4000-8000-000000000007', 'structure',  'good',      null),
  ('aaaaaaaa-0007-4000-8000-000000000007', 'hardware',   'fair',      'ერთი ანჯამა ცოტა ჩამოშვებულია.')
on conflict (product_id, aspect_code) do nothing;

insert into public.product_flaws
  (id, product_id, image_id, flaw_type, severity, location_ka, note_ka, sort_order) values
  (
    'bbbbbbbb-0001-4000-8000-000000000001',
    'aaaaaaaa-0001-4000-8000-000000000001',
    null, 'wear', 'moderate', 'მარჯვენა სახელური',
    'ქსოვილი გაცვეთილია და ფერი ოდნავ შეცვლილია.', 0
  ),
  (
    'bbbbbbbb-0002-4000-8000-000000000002',
    'aaaaaaaa-0003-4000-8000-000000000003',
    null, 'stain', 'moderate', 'ზედაპირის ცენტრი',
    'ჭიქების რგოლისებრი კვალი ორ ადგილას.', 0
  ),
  (
    'bbbbbbbb-0003-4000-8000-000000000003',
    'aaaaaaaa-0003-4000-8000-000000000003',
    null, 'scratch', 'minor', 'მარცხენა კიდე',
    'რამდენიმე ზედაპირული ნაკაწრი.', 1
  ),
  (
    'bbbbbbbb-0004-4000-8000-000000000004',
    'aaaaaaaa-0007-4000-8000-000000000007',
    null, 'repair', 'minor', 'ქვედა ანჯამა',
    'ანჯამა ერთხელ უკვე შეკეთებულია; მუშაობს გამართულად.', 0
  )
on conflict (id) do nothing;

commit;
