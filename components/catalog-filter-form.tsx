"use client";

import type { FormEvent, MouseEvent, ReactNode } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CatalogQuery } from "@/lib/catalog-query";
import type { Category, FacetAvailability } from "@/lib/storefront";

// CatalogQuery and buildPageHrefFrom live in lib/catalog-query.ts, not here: this file is
// "use client", which turns every one of its exports into a client reference that a server
// component cannot call. Re-exported as a type so existing imports keep working.
export type { CatalogQuery };

function formActionUrl(form: HTMLFormElement) {
  const data = new FormData(form);
  const params = new URLSearchParams();
  const action = form.getAttribute("action") || window.location.pathname;

  for (const [key, value] of data.entries()) {
    const text = String(value).trim();
    // append, not set: materials/colours/styles legitimately repeat.
    if (text) params.append(key, text);
  }

  return params.size ? `${action}?${params.toString()}` : action;
}

// Hidden inputs preserving everything except the group this form owns.
function CarriedParams({
  query,
  omit,
}: {
  query: CatalogQuery;
  omit: (keyof CatalogQuery)[];
}) {
  const skip = new Set<string>(omit as string[]);
  const scalars: (keyof CatalogQuery)[] = [
    "q",
    "category",
    "minPrice",
    "maxPrice",
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight",
  ];
  const lists: (keyof CatalogQuery)[] = ["materials", "colours", "styles"];

  return (
    <>
      {scalars
        .filter((key) => !skip.has(key) && String(query[key] ?? ""))
        .map((key) => (
          <input
            key={key}
            type="hidden"
            name={key}
            value={String(query[key])}
          />
        ))}
      {lists
        .filter((key) => !skip.has(key))
        .flatMap((key) =>
          (query[key] as string[]).map((value) => (
            <input
              key={`${key}-${value}`}
              type="hidden"
              name={key}
              value={value}
            />
          )),
        )}
    </>
  );
}

function Popover({
  label,
  activeCount,
  children,
}: {
  label: string;
  activeCount: number;
  children: ReactNode;
}) {
  return (
    <details className="group static shrink-0 sm:relative">
      <summary className="flex h-11 min-w-27 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-[#b9c6bd] px-3.5 text-sm font-semibold text-[#1d4a38] transition-colors hover:border-[#1d4a38] hover:bg-[#e9eee9] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38] [&::-webkit-details-marker]:hidden">
        {label}
        {activeCount > 0 ? (
          <span className="grid size-5 place-items-center rounded-full bg-[#1d4a38] text-[11px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="absolute left-1/2 z-30 mt-2 w-[min(calc(100vw-2rem),310px)] -translate-x-1/2 rounded-xl border border-[#d8ded8] bg-white p-3 shadow-[0_16px_40px_rgba(12,34,25,0.16)] sm:right-0 sm:left-auto sm:w-[min(92vw,310px)] sm:translate-x-0">
        {children}
      </div>
    </details>
  );
}

const rangeInputClass =
  "h-10 min-w-0 rounded-lg border border-[#b9c6bd] bg-[#f4f2ed] px-3 text-sm text-[#18221d] placeholder:text-[#667168] focus:border-[#1d4a38] focus:outline-none focus:ring-2 focus:ring-[#1d4a38]/20";

const submitButtonClass =
  "grid size-10 place-items-center rounded-lg bg-[#1d4a38] text-white transition-colors hover:bg-[#15382a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4a38]";

export function CatalogFilterForm({
  action,
  query,
  categories = [],
  maxAvailablePrice,
  facets,
  resetHref,
  variant = "panel",
  className,
}: {
  action: string;
  query: CatalogQuery;
  categories?: Category[];
  maxAvailablePrice: number;
  facets: FacetAvailability;
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

  const dimensionCount = [
    query.minWidth,
    query.maxWidth,
    query.minHeight,
    query.maxHeight,
  ].filter(Boolean).length;

  return (
    <div
      className={cn(
        "relative flex flex-wrap items-end gap-2",
        variant === "panel" ? "mt-8 rounded-2xl p-4 sm:p-5" : "",
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
        <CarriedParams query={query} omit={["q", "category"]} />
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
              defaultValue={query.q}
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
              defaultValue={query.category}
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

      <Popover
        label="ფასი"
        activeCount={[query.minPrice, query.maxPrice].filter(Boolean).length}
      >
        <form
          action={action}
          method="get"
          onSubmit={handleSubmit}
          className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2"
        >
          <CarriedParams query={query} omit={["minPrice", "maxPrice"]} />
          <input
            type="number"
            name="minPrice"
            min={0}
            max={maxAvailablePrice}
            step="0.01"
            defaultValue={query.minPrice}
            aria-label="მინიმალური ფასი"
            placeholder="Min."
            className={rangeInputClass}
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
            defaultValue={query.maxPrice}
            aria-label="მაქსიმალური ფასი"
            placeholder="Max."
            className={rangeInputClass}
          />
          <button type="submit" aria-label="ფასით ძიება" className={submitButtonClass}>
            <Search className="size-4" aria-hidden="true" />
          </button>
        </form>
      </Popover>

      {/* Each facet renders only when enough of the catalogue carries that data — a
          dimension filter over mostly-unmeasured products empties the page on first click.
          See FacetAvailability in lib/storefront.ts. */}
      {facets.showDimensions ? (
        <Popover label="ზომები" activeCount={dimensionCount}>
          <form
            action={action}
            method="get"
            onSubmit={handleSubmit}
            className="grid gap-2"
          >
            <CarriedParams
              query={query}
              omit={["minWidth", "maxWidth", "minHeight", "maxHeight"]}
            />
            <p className="text-xs leading-5 text-[#667168]">
              მხოლოდ გაზომილი ნივთები გამოჩნდება.
            </p>
            <span className="text-xs font-semibold text-[#18221d]">სიგანე (სმ)</span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                type="number"
                name="minWidth"
                min={0}
                step="0.1"
                defaultValue={query.minWidth}
                aria-label="მინიმალური სიგანე"
                placeholder="Min."
                className={rangeInputClass}
              />
              <span className="text-sm text-[#667168]" aria-hidden="true">
                -
              </span>
              <input
                type="number"
                name="maxWidth"
                min={0}
                step="0.1"
                defaultValue={query.maxWidth}
                aria-label="მაქსიმალური სიგანე"
                placeholder="Max."
                className={rangeInputClass}
              />
            </div>
            <span className="text-xs font-semibold text-[#18221d]">სიმაღლე (სმ)</span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                type="number"
                name="minHeight"
                min={0}
                step="0.1"
                defaultValue={query.minHeight}
                aria-label="მინიმალური სიმაღლე"
                placeholder="Min."
                className={rangeInputClass}
              />
              <span className="text-sm text-[#667168]" aria-hidden="true">
                -
              </span>
              <input
                type="number"
                name="maxHeight"
                min={0}
                step="0.1"
                defaultValue={query.maxHeight}
                aria-label="მაქსიმალური სიმაღლე"
                placeholder="Max."
                className={rangeInputClass}
              />
            </div>
            <button
              type="submit"
              className="mt-1 h-10 rounded-lg bg-[#1d4a38] text-sm font-semibold text-white transition-colors hover:bg-[#15382a]"
            >
              ძიება
            </button>
          </form>
        </Popover>
      ) : null}

      {facets.showMaterials ? (
        <Popover label="მასალა" activeCount={query.materials.length}>
          <form action={action} method="get" onSubmit={handleSubmit} className="grid gap-2">
            <CarriedParams query={query} omit={["materials"]} />
            <div className="max-h-56 overflow-y-auto">
              {facets.materials.map((material) => (
                <label
                  key={material.code}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-[#18221d] hover:bg-[#f0f3f0]"
                >
                  <input
                    type="checkbox"
                    name="materials"
                    value={material.code}
                    defaultChecked={query.materials.includes(material.code)}
                    className="size-4 accent-[#1d4a38]"
                  />
                  {material.label_ka}
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="h-10 rounded-lg bg-[#1d4a38] text-sm font-semibold text-white transition-colors hover:bg-[#15382a]"
            >
              ძიება
            </button>
          </form>
        </Popover>
      ) : null}

      {facets.showColours ? (
        <Popover label="ფერი" activeCount={query.colours.length}>
          <form action={action} method="get" onSubmit={handleSubmit} className="grid gap-2">
            <CarriedParams query={query} omit={["colours"]} />
            <div className="max-h-56 overflow-y-auto">
              {facets.colours.map((colour) => (
                <label
                  key={colour.code}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-[#18221d] hover:bg-[#f0f3f0]"
                >
                  <input
                    type="checkbox"
                    name="colours"
                    value={colour.code}
                    defaultChecked={query.colours.includes(colour.code)}
                    className="size-4 accent-[#1d4a38]"
                  />
                  {colour.hex ? (
                    <span
                      aria-hidden="true"
                      className="size-3.5 shrink-0 rounded-full border border-[#00000022]"
                      style={{ backgroundColor: colour.hex }}
                    />
                  ) : null}
                  {colour.label_ka}
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="h-10 rounded-lg bg-[#1d4a38] text-sm font-semibold text-white transition-colors hover:bg-[#15382a]"
            >
              ძიება
            </button>
          </form>
        </Popover>
      ) : null}

      {facets.showStyles ? (
        <Popover label="სტილი" activeCount={query.styles.length}>
          <form action={action} method="get" onSubmit={handleSubmit} className="grid gap-2">
            <CarriedParams query={query} omit={["styles"]} />
            <div className="max-h-56 overflow-y-auto">
              {facets.styles.map((style) => (
                <label
                  key={style.code}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-[#18221d] hover:bg-[#f0f3f0]"
                >
                  <input
                    type="checkbox"
                    name="styles"
                    value={style.code}
                    defaultChecked={query.styles.includes(style.code)}
                    className="size-4 accent-[#1d4a38]"
                  />
                  {style.label_ka}
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="h-10 rounded-lg bg-[#1d4a38] text-sm font-semibold text-white transition-colors hover:bg-[#15382a]"
            >
              ძიება
            </button>
          </form>
        </Popover>
      ) : null}

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
