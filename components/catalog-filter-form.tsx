"use client";

import type { FormEvent, MouseEvent } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/storefront";

function formActionUrl(form: HTMLFormElement) {
  const data = new FormData(form);
  const params = new URLSearchParams();
  const action = form.getAttribute("action") || window.location.pathname;

  for (const [key, value] of data.entries()) {
    const text = String(value).trim();
    if (text) params.set(key, text);
  }

  return params.size ? `${action}?${params.toString()}` : action;
}

export function CatalogFilterForm({
  action,
  search,
  categories = [],
  categorySlug = "",
  minPrice,
  maxPrice,
  maxAvailablePrice,
  resetHref,
  variant = "panel",
  className,
}: {
  action: string;
  search: string;
  categories?: Category[];
  categorySlug?: string;
  minPrice: number;
  maxPrice: number;
  maxAvailablePrice: number;
  resetHref: string;
  variant?: "panel" | "inline";
  className?: string;
}) {
  const router = useRouter();
  const hasCategoryFilter = categories.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(formActionUrl(event.currentTarget), { scroll: false });
  }

  function handleReset(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    router.push(resetHref, { scroll: false });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-2",
        variant === "panel"
          ? "mt-8 rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(59,40,27,0.06)] sm:p-5"
          : "",
        className,
      )}
    >
      <form
        id="catalog-filter-form"
        action={action}
        method="get"
        onSubmit={handleSubmit}
        className={cn(
          "contents",
          " [&_label]:min-w-0 [&_label]:flex-1",
          hasCategoryFilter
            ? "[&_label:first-child]:basis-60 [&_label:nth-child(2)]:basis-47.5"
            : "[&_label:first-child]:basis-65",
        )}
      >
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-[#18221d]">
            ძიება
          </span>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#667168]"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={search}
              maxLength={100}
              placeholder="პროდუქტის სახელი"
              className="h-11 w-full rounded-xl border border-[#b9c6bd] bg-[#f4f2ed] pr-3.5 pl-10 text-sm text-[#18221d] placeholder:text-[#667168] focus:border-[#1d4a38] focus:outline-none focus:ring-2 focus:ring-[#1d4a38]/20"
            />
          </span>
        </label>

        {hasCategoryFilter ? (
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-[#18221d]">
              კატეგორია
            </span>
            <select
              name="category"
              defaultValue={categorySlug}
              className="h-11 w-full rounded-xl border border-[#b9c6bd] bg-[#f4f2ed] px-3.5 text-sm text-[#18221d] focus:border-[#1d4a38] focus:outline-none focus:ring-2 focus:ring-[#1d4a38]/20"
            >
              <option value="">ყველა კატეგორია</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </form>

      <details className="group relative shrink-0">
        <summary className="flex h-11 min-w-27 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-[#b9c6bd] bg-white px-3.5 text-sm font-semibold text-[#1d4a38] transition-colors hover:border-[#1d4a38] hover:bg-[#e9eee9] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38] [&::-webkit-details-marker]:hidden">
          ფასი
          <ChevronDown
            className="size-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="absolute right-0 z-30 mt-2 w-[min(92vw,310px)] rounded-xl border border-[#d8ded8] bg-white p-3 shadow-[0_16px_40px_rgba(12,34,25,0.16)]">
          <form
            action={action}
            method="get"
            onSubmit={handleSubmit}
            className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2"
          >
            {search ? <input type="hidden" name="q" value={search} /> : null}
            {categorySlug ? (
              <input type="hidden" name="category" value={categorySlug} />
            ) : null}
            <input
              type="number"
              name="minPrice"
              min={0}
              max={maxAvailablePrice}
              step="0.01"
              defaultValue={minPrice}
              aria-label="მინიმალური ფასი"
              placeholder="Min."
              className="h-10 min-w-0 rounded-lg border border-[#b9c6bd] bg-[#f4f2ed] px-3 text-sm text-[#18221d] placeholder:text-[#667168] focus:border-[#1d4a38] focus:outline-none focus:ring-2 focus:ring-[#1d4a38]/20"
            />
            <span className="text-sm text-[#667168]" aria-hidden="true">
              -
            </span>
            <input
              type="number"
              name="maxPrice"
              min={0}
              max={maxAvailablePrice}
              step="0.01"
              defaultValue={maxPrice}
              aria-label="მაქსიმალური ფასი"
              placeholder="Max."
              className="h-10 min-w-0 rounded-lg border border-[#b9c6bd] bg-[#f4f2ed] px-3 text-sm text-[#18221d] placeholder:text-[#667168] focus:border-[#1d4a38] focus:outline-none focus:ring-2 focus:ring-[#1d4a38]/20"
            />
            <button
              type="submit"
              aria-label="ფასით ძიება"
              className="grid size-10 place-items-center rounded-lg bg-[#1d4a38] text-white transition-colors hover:bg-[#15382a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4a38]"
            >
              <Search className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </details>

      <div className="flex shrink-0 items-end gap-2">
        <button
          type="submit"
          form="catalog-filter-form"
          aria-label="ძიება"
          className="grid size-11 place-items-center rounded-xl bg-[#1d4a38] text-white transition-colors hover:bg-[#15382a] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
        >
          <Search className="size-4.5" aria-hidden="true" />
        </button>
        <a
          href={resetHref}
          onClick={handleReset}
          aria-label="გასუფთავება"
          className="grid size-11 place-items-center rounded-xl border border-[#b9c6bd] bg-white text-[#1d4a38] transition-colors hover:border-[#1d4a38] hover:bg-[#e9eee9] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
        >
          <X className="size-4.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
