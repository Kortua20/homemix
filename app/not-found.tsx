import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-[#f4f2ed]">
      <div className="mx-auto flex min-h-[65vh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <section className="relative w-full overflow-hidden rounded-2xl bg-white px-6 py-14 text-center sm:px-10 sm:py-20">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(9rem,28vw,22rem)] leading-none font-semibold tracking-[-0.06em] text-[#edf1ed]"
          >
            404
          </span>

          <div className="relative mx-auto max-w-xl">
            <span className="mx-auto grid size-14 place-items-center rounded-xl bg-[#e9eee9] text-[#1d4a38]">
              <SearchX className="size-6" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-3xl leading-tight font-semibold tracking-[-0.03em] text-[#18221d] sm:text-4xl">
              გვერდი ვერ მოიძებნა
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#5e685f]">
              შესაძლოა ბმული შეიცვალა ან გვერდი აღარ არსებობს. დაბრუნდით მთავარ გვერდზე ან გააგრძელეთ პროდუქტების დათვალიერება.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1d4a38] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#15382a] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
              >
                მთავარ გვერდზე დაბრუნება
              </Link>
              <Link
                href="/products"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#b9c6bd] bg-white px-6 text-sm font-semibold text-[#1d4a38] transition-colors hover:border-[#1d4a38] hover:bg-[#e9eee9] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
              >
                პროდუქტების ნახვა
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
