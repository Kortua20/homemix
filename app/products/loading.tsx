import { ProductGridSkeleton } from "@/components/product-card-skeleton";

export default function ProductsLoading() {
  // ProductGridSkeleton carries the live region and the screen-reader text.
  return (
    <main aria-busy="true" className="bg-[#f4f2ed]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <div className="h-12 w-64 animate-pulse rounded-xl bg-[#e6e2de] motion-reduce:animate-none sm:h-14" />
          <div className="mt-4 h-6 w-4/5 max-w-xl animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
        </div>
        <div className="mt-8 h-16 animate-pulse rounded-2xl bg-[#e6e2de] motion-reduce:animate-none" />
        <div className="pt-12 sm:pt-16">
          <div className="mb-8 h-9 w-40 animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    </main>
  );
}
