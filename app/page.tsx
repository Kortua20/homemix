import Link from "next/link";
import { ArrowLeft, MoveLeft } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
import { HeroSlider } from "@/components/hero-slider";
import { ProductCard } from "@/components/product-card";
import { getHomeCategories, getNewestProducts } from "@/lib/storefront";

export const revalidate = 60;

export default async function HomePage() {
  const [categoriesResult, productsResult] = await Promise.allSettled([
    getHomeCategories(),
    getNewestProducts(8),
  ]);

  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const products =
    productsResult.status === "fulfilled" ? productsResult.value : [];

  return (
    <main className="overflow-hidden bg-[#f4efe7]">
      <HeroSlider />

      <section className="relative border-y border-[#2f2925]/20 bg-[#f4efe7]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,transparent_calc(100%-1px),rgba(58,85,119,.18)_1px),linear-gradient(to_bottom,transparent_calc(100%-1px),rgba(58,85,119,.14)_1px)] [background-size:72px_72px]" />
        <div className="relative mx-auto w-full max-w-7xl border-x border-[#2f2925]/20 px-4 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-20">
            <div>
              <span aria-hidden="true" className="mb-7 block h-px w-20 bg-[#3a5577]" />
              <h2 className="max-w-[12ch] text-[clamp(2.25rem,6vw,5.25rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-[#241b16] text-balance">
                იპოვე ავეჯი შენი სივრცისთვის
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#5d5149] sm:text-lg sm:leading-8 lg:pb-2">
              ოთახიდან ოთახამდე — დაათვალიერე Home Mix-ის ცოცხალი კატალოგი და შეარჩიე ნივთები, რომლებიც ყოველდღიურობას შენს რიტმს მოარგებს.
            </p>
          </div>

          <div className="mt-12 border-b border-[#2f2925]/30 sm:mt-16">
            {categoriesResult.status === "rejected" ? (
              <EmptyState
                title="კატეგორიები ვერ ჩაიტვირთა"
                description="გთხოვთ, ცოტა ხანში სცადოთ თავიდან."
                tone="error"
              />
            ) : categories.length === 0 ? (
              <EmptyState
                title="კატეგორიები ჯერ არ დამატებულა"
                description="ახალი კატეგორიები მალე გამოჩნდება."
              />
            ) : (
              <div>
                {categories.map((category, index) => (
                  <CategoryCard key={category.id} category={category} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#2d211a] text-white">
        <div className="mx-auto w-full max-w-7xl border-x border-white/15 px-4 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mb-12 grid gap-8 border-b border-white/25 pb-9 sm:mb-16 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <h2 className="max-w-[12ch] text-[clamp(2.4rem,6vw,5.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
              ახალი ნივთები, ახლოდან
            </h2>
            <div className="flex flex-col items-start gap-6 lg:items-end">
              <p className="max-w-md text-sm leading-6 text-[#d8cbc1] sm:text-base sm:leading-7 lg:text-right">
                უახლესი დამატებები პირდაპირ Home Mix-ის კატალოგიდან — რეალური ფოტოებითა და მიმდინარე ფასებით.
              </p>
              <Link
                href="/products"
                className="group inline-flex min-h-12 items-center gap-4 border-b border-[#d79b69] pb-2 text-sm font-semibold text-[#f1c69f] transition-colors hover:border-white hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f1c69f]"
              >
                ყველა პროდუქტის ნახვა
                <MoveLeft className="size-5 transition-transform group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {productsResult.status === "rejected" ? (
            <EmptyState
              title="პროდუქტები ვერ ჩაიტვირთა"
              description="გთხოვთ, ცოტა ხანში სცადოთ თავიდან."
              tone="error"
              inverted
            />
          ) : products.length === 0 ? (
            <EmptyState
              title="პროდუქტები მალე დაემატება"
              description="ჩვენ ვამზადებთ ახალ კოლექციას თქვენი სახლისთვის."
              inverted
            />
          ) : (
            <div className="grid grid-cols-1 gap-x-px gap-y-10 min-[520px]:grid-cols-2 lg:grid-cols-4 lg:gap-y-14">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}

          <Link
            href="/products"
            className="mt-12 flex min-h-14 w-full items-center justify-between border-y border-white/25 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f1c69f] sm:hidden"
          >
            ყველა პროდუქტის ნახვა
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
