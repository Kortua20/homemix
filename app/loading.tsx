export default function Loading() {
  return (
    <main aria-live="polite" aria-busy="true">
      <span className="sr-only">გვერდი იტვირთება</span>
      <div className="mx-auto mt-3 h-125 w-[calc(100%-2rem)] max-w-350 animate-pulse rounded-[1.75rem] bg-[#e6e2de] sm:mt-5 sm:h-150 sm:w-[calc(100%-3rem)]" />
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-48 animate-pulse rounded-3xl bg-[#e8ebe7]"
          />
        ))}
      </div>
    </main>
  );
}
