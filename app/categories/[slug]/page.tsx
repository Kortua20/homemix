import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogFilterForm } from "@/components/catalog-filter-form";
import { EmptyState } from "@/components/empty-state";
import { HeroSlider, type HeroSlide } from "@/components/hero-slider";
import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import {
  getCatalogProducts,
  getCategoryBySlug,
  getCategorySlugs,
  getFacetAvailability,
  getHomeCategories,
  getMaxProductPrice,
  normalizeSlug,
  type Category,
} from "@/lib/storefront";
import type { CatalogQuery } from "@/components/catalog-filter-form";
import { siteName } from "@/lib/site";

export const revalidate = 60;

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type CategoryFilterValues = {
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

type CategoryProductResultsProps = {
  filters: CategoryFilterValues;
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

// undefined, not 0: a blank box means "no bound", while 0 is a real lower bound.
function parseOptionalNumber(value: string) {
  const text = value.trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

function categorySlides(category: Category): HeroSlide[] {
  return category.images.map((image) => ({
    image: `/api/category-images/${image.id}`,
    alt: category.name,
    title: category.name,
    description: category.description?.trim() || category.name,
    href: `/categories/${encodeURIComponent(category.slug)}`,
  }));
}

function resultsKey(filters: CategoryFilterValues) {
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

async function CategoryProductResults({
  filters,
  filtersActive,
}: CategoryProductResultsProps) {
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
    <div className="grid grid-cols-1 gap-x-5 gap-y-10 min-[520px]:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category not found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    category.description?.trim().slice(0, 160) ||
    `${category.name} | ${siteName}`;
  const image = category.images[0]
    ? `/api/category-images/${category.images[0].id}`
    : "/logo.png";

  return {
    title: category.name,
    description,
    alternates: {
      canonical: `/categories/${encodeURIComponent(category.slug)}`,
    },
    openGraph: {
      type: "website",
      title: `${category.name} | ${siteName}`,
      description,
      url: `/categories/${encodeURIComponent(category.slug)}`,
      images: [{ url: image, alt: category.name }],
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug: rawSlug } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const slug = normalizeSlug(rawSlug);
  const search = firstValue(queryParams.q).trim().slice(0, 100);
  const [availableMaxPrice, facets] = await Promise.all([
    getMaxProductPrice(slug),
    getFacetAvailability(slug),
  ]);
  const minPrice = Math.min(
    parsePriceParam(firstValue(queryParams.minPrice)),
    availableMaxPrice,
  );
  const submittedMaxPrice = parsePriceParam(firstValue(queryParams.maxPrice));
  const maxPrice =
    submittedMaxPrice > 0
      ? Math.min(submittedMaxPrice, availableMaxPrice)
      : availableMaxPrice;

  // An explicit param is always honoured, even where coverage hides the control — see the
  // note in app/products/page.tsx. This matters more here than on the catalogue page:
  // getFacetAvailability is scoped to the category, so a single category drops below
  // FACET_MIN_PRODUCTS long before the catalogue does, and gating the parse on it silently
  // discarded every facet param on every category page.
  const materials = listValue(queryParams.materials);
  const colours = listValue(queryParams.colours);
  const styles = listValue(queryParams.styles);
  const minWidth = parseOptionalNumber(firstValue(queryParams.minWidth));
  const maxWidth = parseOptionalNumber(firstValue(queryParams.maxWidth));
  const minHeight = parseOptionalNumber(firstValue(queryParams.minHeight));
  const maxHeight = parseOptionalNumber(firstValue(queryParams.maxHeight));

  const filters: CategoryFilterValues = {
    search,
    categorySlug: slug,
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
    category: "",
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

  const filtersActive = Boolean(
    search ||
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
  const [category] = await Promise.all([
    getCategoryBySlug(slug),
    getHomeCategories(),
  ]);

  if (!category) notFound();

  const slides = categorySlides(category);
  console.log(slides);

  return (
    <main className="bg-[#f4f2ed]">
      {slides.length !== 0 ? <HeroSlider slides={slides} /> : null}

      <section className="mx-auto w-full max-w-384 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <nav className="mb-7 flex flex-wrap items-center gap-2 text-sm text-[#5e685f]">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg font-semibold transition-colors hover:text-[#1d4a38] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
          >
            Home
          </Link>
          <span aria-hidden="true" className="text-[#b3aaa4]">
            /
          </span>
          <span aria-current="page" className="text-[#667168]">
            {category.name}
          </span>
        </nav>

        <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end sm:mb-10">
          <div>
            <p className="text-sm font-semibold text-[#667168]">Category</p>
            <h1 className="mt-2 text-4xl leading-tight font-semibold tracking-[-0.03em] text-[#18221d] sm:text-5xl">
              {category.name}
            </h1>
            {category.description ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5e685f]">
                {category.description}
              </p>
            ) : null}
          </div>
          <CatalogFilterForm
            action={`/categories/${encodeURIComponent(category.slug)}`}
            query={query}
            maxAvailablePrice={availableMaxPrice}
            facets={facets}
            resetHref={`/categories/${encodeURIComponent(category.slug)}`}
            variant="inline"
          />
        </div>

        <Suspense
          key={resultsKey(filters)}
          fallback={<ProductGridSkeleton count={4} />}
        >
          <CategoryProductResults
            filters={filters}
            filtersActive={filtersActive}
          />
        </Suspense>
      </section>
    </main>
  );
}
