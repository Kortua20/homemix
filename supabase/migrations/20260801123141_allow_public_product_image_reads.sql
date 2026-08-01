grant select on table public.product_images to anon, authenticated;

alter table public.product_images enable row level security;

create policy "Product images are publicly readable"
on public.product_images
for select
to anon, authenticated
using (true);
