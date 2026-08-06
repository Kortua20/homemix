import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
import { HeroSlider } from "@/components/hero-slider";
import { ProductCard } from "@/components/product-card";
import { getHomeCategories, getNewestProducts } from "@/lib/storefront";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Home Mix — ავეჯი თქვენი სახლისთვის" },
  description:
    "აღმოაჩინეთ Home Mix-ის თანამედროვე ავეჯი, ახალი პროდუქტები და კოლექციები თქვენი სახლისთვის.",
  alternates: { canonical: "/" },
};

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
    <main className="bg-[#f4f2ed]">
      <HeroSlider />

      <section className="border-b border-[#d8ded8] bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-384 px-4 sm:px-6 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-5 sm:mb-10">
            <h2 className="text-3xl leading-tight font-semibold tracking-[-0.03em] text-[#173c2f] sm:text-4xl">
              კატეგორიები
            </h2>
            <Link
              href="/products"
              className="group hidden min-h-11 items-center gap-2 text-sm font-semibold text-[#173c2f] transition-colors hover:text-[#1d4a38] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d4a38] sm:flex"
            >
              ყველას ნახვა
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
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
            <div className="no-scrollbar grid snap-x snap-mandatory auto-cols-[78%] grid-flow-col gap-3 overflow-x-auto pb-2 sm:auto-cols-[45%] lg:auto-cols-[31.5%]">
              {categories.map((category, index) => (
                <div key={category.id} className="snap-start">
                  <CategoryCard category={category} index={index} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-384 px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mb-8 flex items-end justify-between gap-5 sm:mb-10">
          <div>
            <h2 className="text-3xl leading-tight font-semibold tracking-[-0.03em] text-[#18221d] sm:text-4xl">
              ახალი პროდუქტები
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#5e685f] sm:text-base">
              გაეცანით კატალოგში ახლად დამატებულ ავეჯს.
            </p>
          </div>
          <Link
            href="/products"
            className="group hidden min-h-11 items-center gap-2 text-sm font-semibold text-[#173c2f] transition-colors hover:text-[#1d4a38] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d4a38] sm:flex"
          >
            ყველას ნახვა
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
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
          className="mt-10 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173c2f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4a38] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38] sm:hidden"
        >
          ყველა პროდუქტის ნახვა
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
