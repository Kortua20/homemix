import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CatalogFilterForm } from "@/components/catalog-filter-form";
import { EmptyState } from "@/components/empty-state";
import { HeroSlider, type HeroSlide } from "@/components/hero-slider";
import { Breadcrumbs, PageBanner } from "@/components/page-banner";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import {
  ProductGridSkeleton,
  productGridClass,
} from "@/components/product-card-skeleton";
import { SectionHeader } from "@/components/section-header";
import {
  getCatalogProducts,
  getCategoryBySlug,
  getCategorySlugs,
  getFacetAvailability,
  getMaxProductPrice,
  getRenamedCategorySlug,
  normalizeSlug,
  parsePageParam,
  type Category,
} from "@/lib/storefront";
import {
  buildPageHrefFrom,
  readFeatureParams,
  storageFilterValue,
  type CatalogQuery,
} from "@/lib/catalog-query";
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
  // undefined = no ceiling. See where it is set in CategoryPage.
  maxPrice?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  materials: string[];
  colours: string[];
  styles: string[];
  foldable: boolean;
  mechanisms: string[];
  hasStorage?: boolean;
  page: number;
};

type CategoryProductResultsProps = {
  filters: CategoryFilterValues;
  filtersActive: boolean;
  buildPageHref: (page: number) => string;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function withQuery(
  pathname: string,
  query: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) params.append(key, item);
    }
  }
  return params.size ? `${pathname}?${params.toString()}` : pathname;
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
    filters.maxPrice ?? "",
    filters.minWidth ?? "",
    filters.maxWidth ?? "",
    filters.minHeight ?? "",
    filters.maxHeight ?? "",
    filters.materials.join(","),
    filters.colours.join(","),
    filters.styles.join(","),
    filters.foldable ? "1" : "",
    filters.mechanisms.join(","),
    filters.hasStorage ?? "",
    // Paging re-triggers the skeleton rather than leaving the old cards in place.
    filters.page,
  ].join("|");
}

async function CategoryProductResults({
  filters,
  filtersActive,
  buildPageHref,
}: CategoryProductResultsProps) {
  const result = await getCatalogProducts(filters).catch(() => null);

  if (!result) {
    return (
      <EmptyState
        title="პროდუქტები ვერ ჩაიტვირთა"
        description="გთხოვთ, ცოტა ხანში სცადოთ თავიდან."
        tone="error"
      />
    );
  }

  // Results exist, just not on this page — a stale deep link rather than an empty category.
  if (result.items.length === 0 && result.total > 0) {
    return (
      <EmptyState
        title="ეს გვერდი აღარ არსებობს"
        description="შესაძლოა პროდუქტები შეიცვალა. დაბრუნდით პირველ გვერდზე."
        action={{ href: buildPageHref(1), label: "პირველი გვერდი" }}
      />
    );
  }

  if (result.total === 0) {
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
      {result.pageCount > 1 ? (
        <p
          className="-mt-3 mb-6 text-sm text-ink-muted"
          role="status"
          aria-live="polite"
        >
          ნაპოვნია: {result.total} — გვერდი {result.page} / {result.pageCount}
        </p>
      ) : null}
      <div className={productGridClass}>
        {result.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        buildHref={buildPageHref}
      />
    </>
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
  // One round, not two: the category was previously fetched only after price and facets
  // resolved, though nothing here depends on them.
  const [availableMaxPrice, facets, category] = await Promise.all([
    getMaxProductPrice(slug),
    getFacetAvailability(slug),
    getCategoryBySlug(slug),
  ]);

  if (!category) {
    // Same as the product page: 308 a renamed category's old URL to its current one,
    // keeping the filters and page the visitor arrived with.
    const currentSlug = await getRenamedCategorySlug(slug);
    if (currentSlug) {
      permanentRedirect(
        withQuery(`/categories/${encodeURIComponent(currentSlug)}`, queryParams),
      );
    }
    notFound();
  }
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
  const features = readFeatureParams(queryParams);
  const minWidth = parseOptionalNumber(firstValue(queryParams.minWidth));
  const maxWidth = parseOptionalNumber(firstValue(queryParams.maxWidth));
  const minHeight = parseOptionalNumber(firstValue(queryParams.minHeight));
  const maxHeight = parseOptionalNumber(firstValue(queryParams.maxHeight));
  const page = parsePageParam(firstValue(queryParams.page));

  const filters: CategoryFilterValues = {
    search,
    categorySlug: slug,
    minPrice,
    // A ceiling only when the customer narrowed it. availableMaxPrice is cached and can
    // trail a newly added or repriced product, so using it as an implicit ceiling would
    // hide that product from the unfiltered grid until the cache refreshed.
    maxPrice: maxPrice < availableMaxPrice ? maxPrice : undefined,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    materials,
    colours,
    styles,
    foldable: features.foldable,
    mechanisms: features.mechanisms,
    hasStorage: storageFilterValue(features.storage),
    page,
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
    foldable: features.foldable ? "1" : "",
    mechanisms: features.mechanisms,
    storage: features.storage,
  };

  // The category lives in the path, not in a param — `query.category` is deliberately ""
  // above — so the pager's base is this category's own URL.
  const buildPageHref = buildPageHrefFrom(
    `/categories/${encodeURIComponent(slug)}`,
    query,
  );

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
      styles.length > 0 ||
      features.foldable ||
      features.mechanisms.length > 0 ||
      features.storage !== "",
  );
  const slides = categorySlides(category);
  const crumbs = [
    { label: "კატალოგი", href: "/categories" },
    { label: category.name },
  ];

  return (
    <main>
      {/* With photos, the category keeps its own slider (its h1 is the category name);
          without, it gets the standard inner-page banner. */}
      {slides.length !== 0 ? (
        <HeroSlider slides={slides} />
      ) : (
        <PageBanner
          title={category.name}
          description={category.description?.trim() || undefined}
          crumbs={crumbs}
        />
      )}

      <div className="page-container pb-12 sm:pb-16">
        {slides.length !== 0 ? (
          <Breadcrumbs crumbs={crumbs} className="pt-4" />
        ) : null}

        <CatalogFilterForm
          action={`/categories/${encodeURIComponent(category.slug)}`}
          query={query}
          maxAvailablePrice={availableMaxPrice}
          facets={facets}
          resetHref={`/categories/${encodeURIComponent(category.slug)}`}
          className={slides.length !== 0 ? "mt-3" : undefined}
        />

        <section
          className="pt-8 sm:pt-10"
          aria-labelledby="category-results-heading"
        >
          <SectionHeader id="category-results-heading" title="პროდუქტები" />
          <Suspense
            key={resultsKey(filters)}
            fallback={<ProductGridSkeleton count={4} />}
          >
            <CategoryProductResults
              filters={filters}
              filtersActive={filtersActive}
              buildPageHref={buildPageHref}
            />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
