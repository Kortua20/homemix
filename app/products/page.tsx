import { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogFilterForm } from "@/components/catalog-filter-form";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import {
  getCatalogProducts,
  getFacetAvailability,
  getHomeCategories,
  getMaxProductPrice,
} from "@/lib/storefront";
import type { CatalogQuery } from "@/components/catalog-filter-form";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type CatalogFilterValues = {
  search: string;
  categorySlug: string;
  minPrice: number;
  maxPrice: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  materials: string[];
  colours: string[];
  styles: string[];
};

type ProductResultsProps = {
  filters: CatalogFilterValues;
  filtersActive: boolean;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

// Facet params repeat (materials=oak&materials=walnut), so they read as arrays.
function listValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
  const single = (value ?? "").trim();
  return single ? [single] : [];
}

function parsePriceParam(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

// undefined, not 0: a blank dimension box means "no bound", while 0 is a real lower bound
// that would exclude nothing but still mark the filter active.
function parseOptionalNumber(value: string) {
  const text = value.trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function resultsKey(filters: CatalogFilterValues) {
  return [
    filters.search,
    filters.categorySlug,
    filters.minPrice,
    filters.maxPrice,
    filters.minWidth ?? "",
    filters.maxWidth ?? "",
    filters.minHeight ?? "",
    filters.maxHeight ?? "",
    filters.materials.join(","),
    filters.colours.join(","),
    filters.styles.join(","),
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
  const [availableMaxPrice, facets] = await Promise.all([
    getMaxProductPrice(categorySlug),
    getFacetAvailability(categorySlug),
  ]);
  const minPrice = Math.min(
    parsePriceParam(firstValue(params.minPrice)),
    availableMaxPrice,
  );
  const submittedMaxPrice = parsePriceParam(firstValue(params.maxPrice));
  const maxPrice =
    submittedMaxPrice > 0
      ? Math.min(submittedMaxPrice, availableMaxPrice)
      : availableMaxPrice;

  // Coverage decides whether a facet earns a *control*, never whether an explicit param is
  // honoured. Those are different questions: rendering is a judgement about whether a
  // control is worth its space, but a filter in the URL is a promise about what the page
  // shows. Discarding it renders unfiltered results that look correct, so a shared link
  // lies about what it points at.
  //
  // The cost of honouring it: when coverage hides a facet, its Popover — and the
  // activeCount badge inside it — is gone too, so the only way out of such a filter is the
  // global reset. That is a worse affordance than a per-facet clear, but it is still an
  // escape hatch, and it beats results that are silently wrong. If hidden-but-active
  // filters become common, the fix is a standalone active-filter summary, not re-dropping
  // the param.
  const materials = listValue(params.materials);
  const colours = listValue(params.colours);
  const styles = listValue(params.styles);
  const minWidth = parseOptionalNumber(firstValue(params.minWidth));
  const maxWidth = parseOptionalNumber(firstValue(params.maxWidth));
  const minHeight = parseOptionalNumber(firstValue(params.minHeight));
  const maxHeight = parseOptionalNumber(firstValue(params.maxHeight));

  const filters: CatalogFilterValues = {
    search,
    categorySlug,
    minPrice,
    maxPrice,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    materials,
    colours,
    styles,
  };

  const query: CatalogQuery = {
    q: search,
    category: categorySlug,
    minPrice: minPrice > 0 ? String(minPrice) : "",
    maxPrice: maxPrice < availableMaxPrice ? String(maxPrice) : "",
    minWidth: minWidth === undefined ? "" : String(minWidth),
    maxWidth: maxWidth === undefined ? "" : String(maxWidth),
    minHeight: minHeight === undefined ? "" : String(minHeight),
    maxHeight: maxHeight === undefined ? "" : String(maxHeight),
    materials,
    colours,
    styles,
  };

  const categoriesResult = await getHomeCategories().then(
    (categories) => ({ status: "fulfilled" as const, value: categories }),
    () => ({ status: "rejected" as const, value: [] }),
  );

  const filtersActive = Boolean(
    search ||
      categorySlug ||
      minPrice > 0 ||
      maxPrice < availableMaxPrice ||
      minWidth !== undefined ||
      maxWidth !== undefined ||
      minHeight !== undefined ||
      maxHeight !== undefined ||
      materials.length > 0 ||
      colours.length > 0 ||
      styles.length > 0,
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
          query={query}
          categories={categoriesResult.value}
          maxAvailablePrice={availableMaxPrice}
          facets={facets}
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
