import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-canvas">
      <div className="page-container flex min-h-[65vh] items-center py-16">
        <section className="relative w-full overflow-hidden rounded-lg bg-white shadow-card px-6 py-14 text-center sm:px-10 sm:py-20">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(9rem,28vw,22rem)] leading-none font-semibold tracking-[-0.06em] text-[#edf1ed]"
          >
            404
          </span>

          <div className="relative mx-auto max-w-xl">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-mint text-forest">
              <SearchX className="size-6" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
              გვერდი ვერ მოიძებნა
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-ink-muted">
              შესაძლოა ბმული შეიცვალა ან გვერდი აღარ არსებობს. დაბრუნდით მთავარ გვერდზე ან გააგრძელეთ პროდუქტების დათვალიერება.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-forest-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
              >
                მთავარ გვერდზე დაბრუნება
              </Link>
              <Link
                href="/products"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-control bg-white px-6 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
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
