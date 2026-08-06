import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    <main className="bg-[#fcf9f8]">
      <HeroSlider />

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mb-8 flex items-end justify-between gap-5 sm:mb-10">
          <div>
            <h2 className="text-3xl leading-tight font-semibold tracking-tight text-[#1b1c1c] sm:text-4xl">
              პროდუქტები
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#605e5b] sm:text-base">
              რამე ტექსტი
            </p>
          </div>
          <Link
            href="/products"
            className="group hidden min-h-11 items-center gap-2 text-sm font-semibold text-[#7f512f] underline decoration-[#d6c3b8] underline-offset-8 transition-colors hover:text-[#6d4528] hover:decoration-[#7f512f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7f512f] sm:flex"
          >
            ყველას ნახვა
            <ArrowRight
              className="size-4 transition-transform group-hover:-translate-x-1 motion-reduce:transition-none"
              aria-hidden="true"
            />
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
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 min-[520px]:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <Link
          href="/products"
          className="mt-10 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7f512f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#6d4528] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f] sm:hidden"
        >
          ყველა პროდუქტის ნახვა
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <section className="border-y border-[#e4e2e1] bg-[#f6f3f2]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mb-8 sm:mb-10">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight text-[#1b1c1c] sm:text-4xl">
              კატეგორიები
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#605e5b] sm:text-base">
              რამე ტექსტი აქ
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
