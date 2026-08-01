import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <main>
      <HeroSlider />

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-7 max-w-2xl sm:mb-9">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-[#7f512f] uppercase">
            აღმოაჩინე
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#1b1c1c] sm:text-4xl">
            ავეჯი ყველა სივრცისთვის
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#605e5b] sm:text-base">
            შეარჩიე კატეგორია და იპოვე შენს სახლზე მორგებული ავეჯი.
          </p>
        </div>

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#f6f3f2]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-bold tracking-[0.18em] text-[#7f512f] uppercase">
                ახალი კოლექცია
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#1b1c1c] sm:text-4xl">
                უახლესი პროდუქტები
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden min-h-11 items-center gap-2 rounded-full border border-[#d6c3b8] bg-white px-5 text-sm font-semibold text-[#7f512f] transition-colors hover:bg-[#fcf9f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f512f] sm:flex"
            >
              ყველას ნახვა
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {productsResult.status === "rejected" ? (
            <EmptyState
              title="პროდუქტები ვერ ჩაიტვირთა"
              description="გთხოვთ, ცოტა ხანში სცადოთ თავიდან."
              tone="error"
            />
          ) : products.length === 0 ? (
            <EmptyState
              title="პროდუქტები მალე დაემატება"
              description="ჩვენ ვამზადებთ ახალ კოლექციას თქვენი სახლისთვის."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Link
            href="/products"
            className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#7f512f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#6d4528] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f512f] sm:hidden"
          >
            ყველა პროდუქტის ნახვა
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
