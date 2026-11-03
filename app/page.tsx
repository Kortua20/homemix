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

// One header for every homepage section, so the sections differ by their content and
// surface only — never by heading colour, spacing, or whether a "see all" exists.
function SectionHeader({
  title,
  description,
  href,
}: {
  title: string;
  description?: string;
  href: string;
}) {
  return (
    // The hairline closes the header as one unit — it ties the far-right link to its title
    // and marks where the section's content starts.
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-5 gap-y-3 border-b border-[#d8ded8] pb-5 sm:mb-10 sm:pb-6">
      <div className="min-w-0">
        <h2 className="text-3xl leading-tight font-semibold tracking-[-0.03em] text-[#18221d] after:mt-3 after:block after:h-1 after:w-12 after:rounded-full after:bg-[#1d4a38] sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#5e685f] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      <Link
        href={href}
        className="group flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-[#173c2f] transition-colors hover:text-[#1d4a38] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d4a38]"
      >
        ყველას ნახვა
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

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

      {/* Stone, not white: the tonal step from the canvas below separates the two sections
          without a border, and white stays reserved for cards and controls. */}
      <section className="bg-[#ece8e1] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-384 px-4 sm:px-6 lg:px-10">
          <SectionHeader title="კატალოგი" href="/categories" />

          {categoriesResult.status === "rejected" ? (
            <EmptyState
              title="კატალოგი ვერ ჩაიტვირთა"
              description="გთხოვთ, ცოტა ხანში სცადოთ თავიდან."
              tone="error"
            />
          ) : categories.length === 0 ? (
            <EmptyState
              title="კატალოგი ჯერ არ დამატებულა"
              description="ახალი კატალოგი მალე გამოჩნდება."
            />
          ) : (
            // A swipe rail on touch widths; from lg a plain grid, because a desktop mouse
            // cannot reach cards in a horizontal rail whose scrollbar is hidden.
            <div className="no-scrollbar grid snap-x snap-mandatory auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[45%] sm:gap-5 lg:snap-none lg:grid-flow-row lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pb-0">
              {categories.map((category) => (
                <div key={category.id} className="snap-start">
                  <CategoryCard category={category} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-384 px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <SectionHeader
          title="ახალი პროდუქტები"
          description="კატალოგში ბოლოს დამატებული ავეჯი — ნახეთ სიახლეები პირველებმა."
          href="/products"
        />

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
          className="mx-auto mt-12 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173c2f] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#1d4a38] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38] sm:w-fit"
        >
          ყველა პროდუქტის ნახვა
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
