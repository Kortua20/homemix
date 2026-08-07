export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="min-w-0">
      <div className="aspect-4/3 animate-pulse rounded-xl bg-[#e6e2de] motion-reduce:animate-none" />
      <div className="pt-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-[#e6e2de] motion-reduce:animate-none" />
        <div className="mt-3 h-5 w-4/5 animate-pulse rounded-full bg-[#e6e2de] motion-reduce:animate-none" />
        <div className="mt-2 h-5 w-2/3 animate-pulse rounded-full bg-[#e6e2de] motion-reduce:animate-none" />
        <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#d8ded8] pt-3">
          <div className="h-6 w-20 animate-pulse rounded-full bg-[#e6e2de] motion-reduce:animate-none" />
          <div className="size-9 animate-pulse rounded-xl bg-[#e6e2de] motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-x-5 gap-y-10 min-[520px]:grid-cols-2 lg:grid-cols-4 lg:gap-x-6"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">პროდუქტები იტვირთება</span>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
