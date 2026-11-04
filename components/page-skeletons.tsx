import { ProductGridSkeleton } from "@/components/product-card-skeleton";

const pulse = "animate-pulse motion-reduce:animate-none";

// Stands in for PageBanner: same height, same dark field, title and crumb placeholders.
export function PageBannerSkeleton() {
  return (
    <div aria-hidden="true" className="bg-forest-night">
      <div className="page-container flex min-h-36 flex-col justify-center gap-3 py-7 sm:min-h-40 md:flex-row md:items-center md:justify-between">
        <div className={`h-9 w-56 rounded-md bg-white/12 ${pulse}`} />
        <div className={`h-5 w-40 rounded-md bg-white/10 ${pulse}`} />
      </div>
    </div>
  );
}

// Banner, filter panel, results header and a grid — the shape of /products and a category.
export function CatalogPageSkeleton() {
  return (
    <main aria-busy="true">
      <PageBannerSkeleton />
      <div className="page-container pb-12 sm:pb-16">
        <div className="mt-6 rounded-lg bg-white p-4 shadow-card sm:p-5">
          <div className={`h-14 rounded-md bg-placeholder ${pulse}`} />
          <div className="mt-4 flex gap-2 border-t border-line pt-4">
            <div className={`h-11 w-27 rounded-md bg-placeholder ${pulse}`} />
            <div className={`h-11 w-27 rounded-md bg-placeholder ${pulse}`} />
          </div>
        </div>
        <div className="pt-8 sm:pt-10">
          <div className={`mb-7 h-8 w-40 rounded-md bg-placeholder ${pulse}`} />
          {/* ProductGridSkeleton carries the live region and the screen-reader text. */}
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    </main>
  );
}
