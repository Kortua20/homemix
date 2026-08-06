export default function ProductsLoading() {
  return (
    <main aria-live="polite" aria-busy="true" className="bg-[#f4f2ed]">
      <span className="sr-only">პროდუქტები იტვირთება</span>
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="h-12 w-56 animate-pulse rounded-xl bg-[#e6e2de] motion-reduce:animate-none" />
        <div className="mt-4 h-6 w-full max-w-lg animate-pulse rounded-lg bg-[#e6e2de] motion-reduce:animate-none" />
        <div className="mt-8 h-52 animate-pulse rounded-2xl bg-white shadow-[0_10px_28px_rgba(59,40,27,0.06)] motion-reduce:animate-none lg:h-24" />
        <div className="mt-16 grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="aspect-4/3 animate-pulse rounded-2xl bg-[#e6e2de] motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
