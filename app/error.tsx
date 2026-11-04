"use client";

import { AlertCircle } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-container flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-card ring-1 ring-danger-line p-8 text-center">
        <AlertCircle className="mx-auto size-9 text-forest" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-bold text-ink">გვერდი ვერ ჩაიტვირთა</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">მოხდა დროებითი შეცდომა. გთხოვთ, კიდევ ერთხელ სცადოთ.</p>
        <button type="button" onClick={reset} className="mt-7 min-h-12 rounded-md bg-forest-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">თავიდან ცდა</button>
      </div>
    </main>
  );
}
