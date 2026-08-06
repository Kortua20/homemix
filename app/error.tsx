"use client";

import { AlertCircle } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-[#d6a9a4] bg-white p-8 text-center">
        <AlertCircle className="mx-auto size-9 text-[#1d4a38]" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold">გვერდი ვერ ჩაიტვირთა</h1>
        <p className="mt-3 text-sm leading-6 text-[#5e685f]">მოხდა დროებითი შეცდომა. გთხოვთ, კიდევ ერთხელ სცადოთ.</p>
        <button type="button" onClick={reset} className="mt-7 min-h-12 rounded-full bg-[#1d4a38] px-6 text-sm font-semibold text-white hover:bg-[#15382a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4a38]">თავიდან ცდა</button>
      </div>
    </main>
  );
}
