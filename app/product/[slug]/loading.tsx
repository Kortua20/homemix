export default function ProductLoading() {
  return (
    <main aria-live="polite" aria-busy="true" className="bg-[#f4f2ed]">
      <span className="sr-only">პროდუქტი იტვირთება</span>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mb-9 h-6 w-44 animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:gap-14">
          <div className="aspect-4/3 animate-pulse rounded-2xl bg-[#e6e2de] motion-reduce:animate-none" />
          <div className="space-y-5 pt-2">
            <div className="h-5 w-28 animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
            <div className="h-12 w-4/5 animate-pulse rounded-xl bg-[#e6e2de] motion-reduce:animate-none" />
            <div className="h-9 w-32 animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
            <div className="mt-8 h-px bg-[#d8ded8]" />
            <div className="h-5 w-40 animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
            <div className="h-24 animate-pulse rounded-xl bg-[#e6e2de] motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </main>
  );
}
