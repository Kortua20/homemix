import { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogFilterForm } from "@/components/catalog-filter-form";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import {
  getCatalogProducts,
  getHomeCategories,
  getMaxProductPrice,
} from "@/lib/storefront";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ProductResultsProps = {
  filters: {
    search: string;
    categorySlug: string;
    minPrice: number;
    maxPrice: number;
  };
  filtersActive: boolean;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parsePriceParam(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function resultsKey(filters: ProductResultsProps["filters"]) {
  return [
    filters.search,
    filters.categorySlug,
    filters.minPrice,
    filters.maxPrice,
  ].join("|");
}

async function CatalogProductResults({
  filters,
  filtersActive,
}: ProductResultsProps) {
  const products = await getCatalogProducts(filters).catch(() => null);

  if (!products) {
    return (
      <EmptyState
        title="პროდუქტები ვერ ჩაიტვირთა"
        description="გთხოვთ, ცოტა ხანში სცადოთ თავიდან."
        tone="error"
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={
          filtersActive
            ? "პროდუქტი ვერ მოიძებნა"
            : "პროდუქტები ჯერ არ დამატებულა"
        }
        description={
          filtersActive
            ? "შეცვალეთ საძიებო სიტყვა, კატეგორია ან ფასის დიაპაზონი."
            : "ახალი პროდუქტები მალე გამოჩნდება."
        }
      />
    );
  }

  return (
    <>
      <p
        className="-mt-6 mb-8 text-sm text-[#5e685f]"
        role="status"
        aria-live="polite"
      >
        ნაპოვნია: {products.length}
      </p>
      <div className="grid grid-cols-1 gap-x-5 gap-y-10 min-[520px]:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const search = firstValue(params.q).trim().slice(0, 100);
  const category = firstValue(params.category).trim();
  const minPrice = parsePriceParam(firstValue(params.minPrice));
  const maxPrice = parsePriceParam(firstValue(params.maxPrice));
  const filtered = Boolean(search || category || minPrice > 0 || maxPrice > 0);
  const description = search
    ? `Home Mix-ის კატალოგში ძიების შედეგები: ${search}.`
    : "დაათვალიერეთ Home Mix-ის პროდუქტები და გაფილტრეთ ავეჯი კატეგორიისა და ფასის მიხედვით.";

  return {
    title: search ? `${search} — ძიების შედეგები` : "პროდუქტები",
    description,
    alternates: { canonical: "/products" },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: {
      title: "ავეჯის კატალოგი | Home Mix",
      description,
      url: "/products",
      type: "website",
    },
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const search = firstValue(params.q).trim().slice(0, 100);
  const categorySlug = firstValue(params.category).trim();
  const availableMaxPrice = await getMaxProductPrice(categorySlug);
  const minPrice = Math.min(
    parsePriceParam(firstValue(params.minPrice)),
    availableMaxPrice,
  );
  const submittedMaxPrice = parsePriceParam(firstValue(params.maxPrice));
  const maxPrice =
    submittedMaxPrice > 0
      ? Math.min(submittedMaxPrice, availableMaxPrice)
      : availableMaxPrice;
  const filters = { search, categorySlug, minPrice, maxPrice };

  const categoriesResult = await getHomeCategories().then(
    (categories) => ({ status: "fulfilled" as const, value: categories }),
    () => ({ status: "rejected" as const, value: [] }),
  );

  const filtersActive = Boolean(
    search || categorySlug || minPrice > 0 || maxPrice < availableMaxPrice,
  );

  return (
    <main className="bg-[#f4f2ed]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl leading-tight font-semibold tracking-[-0.03em] text-[#18221d] sm:text-5xl">
            პროდუქტები
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#5e685f]">
            მოძებნეთ პროდუქტი სახელით, კატეგორიით ან ფასის დიაპაზონით.
          </p>
        </div>

        <CatalogFilterForm
          action="/products"
          search={search}
          categories={categoriesResult.value}
          categorySlug={categorySlug}
          minPrice={minPrice}
          maxPrice={maxPrice}
          maxAvailablePrice={availableMaxPrice}
          resetHref="/products"
        />

        {categoriesResult.status === "rejected" ? (
          <p className="mt-3 text-xs text-[#a33c32]">
            კატეგორიები ვერ ჩაიტვირთა.
          </p>
        ) : null}

        <section
          className="pt-12 sm:pt-16"
          aria-labelledby="catalog-results-heading"
        >
          <div className="mb-8">
            <h2
              id="catalog-results-heading"
              className="text-2xl font-semibold tracking-[-0.02em] text-[#18221d] sm:text-3xl"
            >
              კატალოგი
            </h2>
          </div>

          <Suspense
            key={resultsKey(filters)}
            fallback={<ProductGridSkeleton count={4} />}
          >
            <CatalogProductResults
              filters={filters}
              filtersActive={filtersActive}
            />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
