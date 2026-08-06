import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-2xl border border-[#d8ded8] bg-white px-6 py-12 text-center sm:px-10">
        <PackageSearch className="mx-auto size-11 text-[#1d4a38]" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-[#18221d] sm:text-3xl">პროდუქტი ვერ მოიძებნა</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#5e685f] sm:text-base">
          ეს პროდუქტი შესაძლოა წაშლილია ან ბმული აღარ არის აქტიური.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1d4a38] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#15382a] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
        >
          მთავარ გვერდზე დაბრუნება
        </Link>
      </div>
    </main>
  );
}
