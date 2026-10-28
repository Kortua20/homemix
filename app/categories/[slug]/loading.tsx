import { ProductGridSkeleton } from "@/components/product-card-skeleton";

export default function CategoryLoading() {
  // ProductGridSkeleton carries the live region and the screen-reader text.
  return (
    <main aria-busy="true" className="bg-[#f4f2ed]">
      <div className="mx-auto w-full max-w-384 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <div className="mb-7 h-11 w-40 animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
        <div className="mb-8 sm:mb-10">
          <div className="h-5 w-20 animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
          <div className="mt-2 h-12 w-72 animate-pulse rounded-xl bg-[#e6e2de] motion-reduce:animate-none sm:h-14" />
          <div className="mt-4 h-6 w-4/5 max-w-2xl animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
        </div>
        <ProductGridSkeleton count={4} />
      </div>
    </main>
  );
}
