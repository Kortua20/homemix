import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function ProductNotFound() {
  return (
    <main className="page-container flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-card px-6 py-12 text-center sm:px-10">
        <PackageSearch className="mx-auto size-11 text-forest" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">პროდუქტი ვერ მოიძებნა</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-muted sm:text-base">
          ეს პროდუქტი შესაძლოა წაშლილია ან ბმული აღარ არის აქტიური.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-md bg-forest-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
        >
          მთავარ გვერდზე დაბრუნება
        </Link>
      </div>
    </main>
  );
}
