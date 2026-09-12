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

insert into public.products
  (id, slug, name, description, price, category_id) values
  (
    'aaaaaaaa-0001-4000-8000-000000000001',
    'tbilisi-divani',
    'თბილისი — სამადგილიანი დივანი',
    'სამადგილიანი დივანი ხის კარკასით და მოსახსნელი ქსოვილის გადასაფარებლით.',
    2450.00,
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'aaaaaaaa-0002-4000-8000-000000000002',
    'kutaisi-kutkhis-divani',
    'ქუთაისი — კუთხის დივანი',
    'კუთხის დივანი საცავით; შესაძლებელია მარცხენა ან მარჯვენა კონფიგურაცია.',
    3890.50,
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'aaaaaaaa-0003-4000-8000-000000000003',
    'mukhis-sasadilo-magida',
    'მუხის სასადილო მაგიდა',
    'მასიური მუხის სასადილო მაგიდა ექვს პერსონაზე.',
    1780.00,
    '22222222-2222-4222-8222-222222222222'
  ),
  (
    'aaaaaaaa-0004-4000-8000-000000000004',
    'zhurnalis-magida-mrgvali',
    'მრგვალი ჟურნალის მაგიდა',
    'მრგვალი ჟურნალის მაგიდა ლითონის ფეხებით.',
    640.00,
    '22222222-2222-4222-8222-222222222222'
  ),
  (
    'aaaaaaaa-0005-4000-8000-000000000005',
    'sasadilo-skami-natural',
    'სასადილო სკამი — ნატურალური',
    'ხის სასადილო სკამი რბილი ჯდომის ზედაპირით.',
    295.00,
    '33333333-3333-4333-8333-333333333333'
  ),
  (
    'aaaaaaaa-0006-4000-8000-000000000006',
    'baris-taburetka',
    'ბარის ტაბურეტი',
    'რეგულირებადი სიმაღლის ბარის ტაბურეტი.',
    410.00,
    '33333333-3333-4333-8333-333333333333'
  ),
  (
    'aaaaaaaa-0007-4000-8000-000000000007',
    'orkariania-karada',
    'ორკარიანი კარადა',
    'ორკარიანი კარადა თაროებითა და საკიდი ჯოხით.',
    2130.00,
    '44444444-4444-4444-8444-444444444444'
  ),
  (
    'aaaaaaaa-0008-4000-8000-000000000008',
    'tsignis-taro-maghali',
    'მაღალი წიგნის თარო',
    'ხუთსართულიანი წიგნის თარო მისაღები ოთახისთვის.',
    0.00,
    '44444444-4444-4444-8444-444444444444'
  )
on conflict (id) do nothing;

commit;
