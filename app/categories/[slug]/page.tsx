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
  getHomeCategories,
  getMaxProductPrice,
  normalizeSlug,
  type Category,
} from "@/lib/storefront";
import { siteName } from "@/lib/site";

export const revalidate = 60;

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type CategoryProductResultsProps = {
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

function resultsKey(filters: CategoryProductResultsProps["filters"]) {
  return [
    filters.search,
    filters.categorySlug,
    filters.minPrice,
    filters.maxPrice,
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
  const availableMaxPrice = await getMaxProductPrice(slug);
  const minPrice = Math.min(
    parsePriceParam(firstValue(queryParams.minPrice)),
    availableMaxPrice,
  );
  const submittedMaxPrice = parsePriceParam(firstValue(queryParams.maxPrice));
  const maxPrice =
    submittedMaxPrice > 0
      ? Math.min(submittedMaxPrice, availableMaxPrice)
      : availableMaxPrice;
  const filters = { search, categorySlug: slug, minPrice, maxPrice };
  const filtersActive = Boolean(
    search || minPrice > 0 || maxPrice < availableMaxPrice,
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
            search={search}
            minPrice={minPrice}
            maxPrice={maxPrice}
            maxAvailablePrice={availableMaxPrice}
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
