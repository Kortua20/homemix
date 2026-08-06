import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import {
  getCatalogProducts,
  getHomeCategories,
  type CatalogSort,
} from "@/lib/storefront";

export const metadata: Metadata = {
  title: "პროდუქტები",
  description:
    "დაათვალიერეთ Home Mix-ის პროდუქტები, მოძებნეთ სახელით და გაფილტრეთ კატეგორიის მიხედვით.",
};

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "date-desc", label: "თარიღი: ჯერ ახალი" },
  { value: "date-asc", label: "თარიღი: ჯერ ძველი" },
  { value: "price-asc", label: "ფასი: ზრდადობით" },
  { value: "price-desc", label: "ფასი: კლებადობით" },
];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function normalizeSort(value: string): CatalogSort {
  return sortOptions.some((option) => option.value === value)
    ? (value as CatalogSort)
    : "date-desc";
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const search = firstValue(params.q).trim().slice(0, 100);
  const categorySlug = firstValue(params.category).trim();
  const sort = normalizeSort(firstValue(params.sort));

  const [categoriesResult, productsResult] = await Promise.allSettled([
    getHomeCategories(),
    getCatalogProducts({ search, categorySlug, sort }),
  ]);

  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const products =
    productsResult.status === "fulfilled" ? productsResult.value : [];
  const filtersActive = Boolean(search || categorySlug || sort !== "date-desc");

  return (
    <main className="bg-[#fcf9f8]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl leading-tight font-semibold tracking-[-0.03em] text-[#1b1c1c] sm:text-5xl">
            პროდუქტები
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#605e5b]">
            რამე ტექსტი აქ
          </p>
        </div>

        <form
          action="/products"
          method="get"
          className="mt-8 grid gap-4 rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(59,40,27,0.06)] sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(260px,1.4fr)_minmax(190px,0.8fr)_minmax(210px,0.9fr)_auto] lg:items-end"
        >
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold text-[#1b1c1c]">
              ძიება სახელით
            </span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#83746b]"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                defaultValue={search}
                maxLength={100}
                placeholder="პროდუქტის სახელი"
                className="min-h-12 w-full rounded-xl border border-[#d6c3b8] bg-[#fcf9f8] pr-4 pl-11 text-base text-[#1b1c1c] placeholder:text-[#83746b] focus:border-[#7f512f] focus:outline-none focus:ring-2 focus:ring-[#7f512f]/20"
              />
            </span>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold text-[#1b1c1c]">
              კატეგორია
            </span>
            <select
              name="category"
              defaultValue={categorySlug}
              className="min-h-12 w-full rounded-xl border border-[#d6c3b8] bg-[#fcf9f8] px-4 text-base text-[#1b1c1c] focus:border-[#7f512f] focus:outline-none focus:ring-2 focus:ring-[#7f512f]/20"
            >
              <option value="">ყველა კატეგორია</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesResult.status === "rejected" ? (
              <span className="mt-2 block text-xs text-[#a33c32]">
                კატეგორიები ვერ ჩაიტვირთა
              </span>
            ) : null}
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold text-[#1b1c1c]">
              დალაგება
            </span>
            <select
              name="sort"
              defaultValue={sort}
              className="min-h-12 w-full rounded-xl border border-[#d6c3b8] bg-[#fcf9f8] px-4 text-base text-[#1b1c1c] focus:border-[#7f512f] focus:outline-none focus:ring-2 focus:ring-[#7f512f]/20"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="min-h-12 rounded-xl bg-[#7f512f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#6d4528] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f] sm:col-span-2 lg:col-span-1"
          >
            შედეგების ჩვენება
          </button>
        </form>

        <section
          className="pt-12 sm:pt-16"
          aria-labelledby="catalog-results-heading"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="catalog-results-heading"
                className="text-2xl font-semibold tracking-[-0.02em] text-[#1b1c1c] sm:text-3xl"
              >
                კატალოგი
              </h2>
              {productsResult.status === "fulfilled" ? (
                <p className="mt-2 text-sm text-[#605e5b]">
                  ნაპოვნია: {products.length}
                </p>
              ) : null}
            </div>
            {filtersActive ? (
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[#7f512f] underline decoration-[#d6c3b8] underline-offset-8 transition-colors hover:text-[#6d4528] hover:decoration-[#7f512f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7f512f]"
              >
                ფილტრების გასუფთავება
              </Link>
            ) : null}
          </div>

          {productsResult.status === "rejected" ? (
            <EmptyState
              title="პროდუქტები ვერ ჩაიტვირთა"
              description="გთხოვთ, ცოტა ხანში სცადოთ თავიდან."
              tone="error"
            />
          ) : products.length === 0 ? (
            <EmptyState
              title={
                filtersActive
                  ? "პროდუქტი ვერ მოიძებნა"
                  : "პროდუქტები ჯერ არ დამატებულა"
              }
              description={
                filtersActive
                  ? "შეცვალეთ საძიებო სიტყვა ან არჩეული კატეგორია."
                  : "ახალი პროდუქტები მალე გამოჩნდება."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-10 min-[520px]:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
