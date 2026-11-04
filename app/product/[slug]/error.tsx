"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-container flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-card ring-1 ring-danger-line px-6 py-12 text-center sm:px-10">
        <AlertCircle className="mx-auto size-11 text-danger" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">პროდუქტი ვერ ჩაიტვირთა</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-muted sm:text-base">
          მოხდა დროებითი შეცდომა. გთხოვთ, კიდევ ერთხელ სცადოთ.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="min-h-12 rounded-md bg-forest-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
          >
            თავიდან ცდა
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-control bg-white px-6 text-sm font-semibold text-ink transition-colors hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
          >
            მთავარ გვერდზე დაბრუნება
          </Link>
        </div>
      </div>
    </main>
  );
}
