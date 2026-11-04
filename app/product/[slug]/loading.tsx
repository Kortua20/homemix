import { PageBannerSkeleton } from "@/components/page-skeletons";

const block = "animate-pulse bg-placeholder motion-reduce:animate-none";

export default function ProductLoading() {
  return (
    <main aria-live="polite" aria-busy="true">
      <span className="sr-only">პროდუქტი იტვირთება</span>
      <PageBannerSkeleton />
      <div className="page-container py-6 sm:py-8">
        <div className="grid gap-8 rounded-lg bg-white p-4 shadow-card sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:p-8">
          <div>
            <div className={`aspect-4/3 rounded-lg ${block}`} />
            <div className="mt-3 grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className={`aspect-4/3 rounded-md ${block}`} />
              ))}
            </div>
          </div>
          <div className="space-y-4 pt-1">
            <div className={`h-4 w-24 rounded-md ${block}`} />
            <div className={`h-9 w-4/5 rounded-md ${block}`} />
            <div className={`h-9 w-32 rounded-md ${block}`} />
            <div className={`mt-6 h-12 rounded-md ${block}`} />
            <div className={`h-12 rounded-md ${block}`} />
            <div className={`mt-6 h-28 rounded-md ${block}`} />
          </div>
        </div>
      </div>
    </main>
  );
}
