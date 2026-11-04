import { cn } from "@/lib/utils";

const pulse = "animate-pulse bg-placeholder motion-reduce:animate-none";

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="min-w-0 rounded-lg bg-white p-2.5 shadow-card">
      <div className={cn("aspect-4/3 rounded-md", pulse)} />
      <div className="px-1 pt-3 pb-0.5">
        <div className={cn("h-3 w-20 rounded-full", pulse)} />
        <div className={cn("mt-2.5 h-4 w-4/5 rounded-full", pulse)} />
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className={cn("h-5 w-16 rounded-full", pulse)} />
          <div className={cn("h-8 w-16 rounded-md", pulse)} />
        </div>
      </div>
    </div>
  );
}

// The one product grid. Every list of product cards uses this column/gap rule.
export const productGridClass =
  "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5";

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={productGridClass} aria-live="polite" aria-busy="true">
      <span className="sr-only">პროდუქტები იტვირთება</span>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
