"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-2xl border border-[#d6a9a4] bg-white px-6 py-12 text-center sm:px-10">
        <AlertCircle className="mx-auto size-11 text-[#a33c32]" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-[#1b1c1c] sm:text-3xl">პროდუქტი ვერ ჩაიტვირთა</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#605e5b] sm:text-base">
          მოხდა დროებითი შეცდომა. გთხოვთ, კიდევ ერთხელ სცადოთ.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="min-h-12 rounded-xl bg-[#7f512f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#6d4528] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f]"
          >
            თავიდან ცდა
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d6c3b8] bg-white px-6 text-sm font-semibold text-[#1b1c1c] transition-colors hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f]"
          >
            მთავარ გვერდზე დაბრუნება
          </Link>
        </div>
      </div>
    </main>
  );
}
