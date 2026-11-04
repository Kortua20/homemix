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

// Below lg the chips wrap unpredictably, so the panel centres on the whole filter block
// (details stays static). From lg it anchors to its chip: "start" when the chips begin at
// the left of the page, "end" when the form sits in a right-hand column.
function Popover({
  label,
  activeCount,
  align,
  children,
}: {
  label: string;
  activeCount: number;
  align: "start" | "end";
  children: ReactNode;
}) {
  return (
    <details className="group static shrink-0 lg:relative">
      <summary
        className={cn(
          "flex h-11 min-w-27 cursor-pointer list-none items-center justify-between gap-2 rounded-md border px-3.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest group-open:border-forest [&::-webkit-details-marker]:hidden",
          activeCount > 0
            ? "border-forest bg-mint"
            : "border-control bg-white",
        )}
      >
        {label}
        {activeCount > 0 ? (
          <span className="grid size-5 place-items-center rounded-full bg-forest text-[11px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div
        className={cn(
          "absolute left-1/2 z-30 mt-2 w-[min(calc(100vw-2rem),310px)] -translate-x-1/2 rounded-lg border border-line bg-white p-3 shadow-popover lg:translate-x-0",
          align === "start" ? "lg:left-0" : "lg:right-0 lg:left-auto",
        )}
      >
        {children}
      </div>
    </details>
  );
}

const rangeInputClass =
  "h-10 min-w-0 rounded-md border border-control bg-white px-3 text-base sm:text-sm text-ink placeholder:text-meta focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20";

// Search and category: the label sits inside the bordered box, and the control fills the
// box, so a click anywhere on it focuses the input or opens the select.
const fieldFrameClass =
  "relative block h-14 min-w-0 rounded-md border border-control bg-white transition-colors hover:border-forest focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20";

const fieldLabelClass =
  "pointer-events-none absolute top-2 text-[11px] leading-4 font-semibold text-meta";

const submitButtonClass =
  "grid size-10 place-items-center rounded-md bg-forest-deep text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

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
  const popoverAlign = variant === "panel" ? "start" : "end";

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

  // Pages normalize defaults to "" (e.g. maxPrice equal to the catalogue max), so any
  // non-empty value is a filter the shopper actually applied.
  const hasActiveFilters = Object.values(query).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );

  return (
    <div
      className={cn(
        "relative",
        variant === "panel"
          ? "mt-6 rounded-lg bg-white p-4 shadow-card sm:p-5"
          : "",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <form
          id="catalog-filter-form"
          action={action}
          method="get"
          onSubmit={handleSubmit}
          className="contents"
        >
          <CarriedParams query={query} omit={["q", "category"]} />
          <label className={cn(fieldFrameClass, "flex-1")}>
            <span className={cn(fieldLabelClass, "left-10")}>ძიება</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-meta"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={query.q}
              maxLength={100}
              placeholder="პროდუქტის სახელი"
              className="size-full rounded-md bg-transparent pt-5 pr-3.5 pl-10 text-base sm:text-sm text-ink placeholder:text-meta/70 focus:outline-none"
            />
          </label>

          {hasCategoryFilter ? (
            <label className={cn(fieldFrameClass, "sm:w-60")}>
              <span className={cn(fieldLabelClass, "left-3.5")}>კატეგორია</span>
              <select
                name="category"
                defaultValue={query.category}
                className="size-full cursor-pointer appearance-none rounded-md bg-transparent pt-5 pr-10 pl-3.5 text-base sm:text-sm text-ink focus:outline-none"
              >
                <option value="">ყველა კატეგორია</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-forest"
                aria-hidden="true"
              />
            </label>
          ) : null}
        </form>
        <button
          type="submit"
          form="catalog-filter-form"
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-forest-deep px-6 sm:h-14 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
        >
          <Search className="size-4" aria-hidden="true" />
          ძიება
        </button>
      </div>

      <div
        className={cn(
          "mt-3 flex flex-wrap items-center gap-2",
          variant === "panel" ? "mt-4 border-t border-line pt-4" : "",
        )}
      >
        <Popover
          label="ფასი"
          align={popoverAlign}
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
            <span className="text-sm text-meta" aria-hidden="true">
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
          <Popover label="ზომები" align={popoverAlign} activeCount={dimensionCount}>
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
              <p className="text-xs leading-5 text-meta">
                მხოლოდ გაზომილი ნივთები გამოჩნდება.
              </p>
              <span className="text-xs font-semibold text-ink">სიგანე (სმ)</span>
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
                <span className="text-sm text-meta" aria-hidden="true">
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
              <span className="text-xs font-semibold text-ink">სიმაღლე (სმ)</span>
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
                <span className="text-sm text-meta" aria-hidden="true">
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
                className="mt-1 h-10 rounded-md bg-forest-deep text-sm font-semibold text-white transition-colors hover:bg-forest"
              >
                ძიება
              </button>
            </form>
          </Popover>
        ) : null}

        {facets.showMaterials ? (
          <Popover label="მასალა" align={popoverAlign} activeCount={query.materials.length}>
            <form action={action} method="get" onSubmit={handleSubmit} className="grid gap-2">
              <CarriedParams query={query} omit={["materials"]} />
              <div className="max-h-56 overflow-y-auto">
                {facets.materials.map((material) => (
                  <label
                    key={material.code}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-ink hover:bg-mint"
                  >
                    <input
                      type="checkbox"
                      name="materials"
                      value={material.code}
                      defaultChecked={query.materials.includes(material.code)}
                      className="size-4 accent-forest"
                    />
                    {material.label_ka}
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="h-10 rounded-md bg-forest-deep text-sm font-semibold text-white transition-colors hover:bg-forest"
              >
                ძიება
              </button>
            </form>
          </Popover>
        ) : null}

        {facets.showColours ? (
          <Popover label="ფერი" align={popoverAlign} activeCount={query.colours.length}>
            <form action={action} method="get" onSubmit={handleSubmit} className="grid gap-2">
              <CarriedParams query={query} omit={["colours"]} />
              <div className="max-h-56 overflow-y-auto">
                {facets.colours.map((colour) => (
                  <label
                    key={colour.code}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-ink hover:bg-mint"
                  >
                    <input
                      type="checkbox"
                      name="colours"
                      value={colour.code}
                      defaultChecked={query.colours.includes(colour.code)}
                      className="size-4 accent-forest"
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
                className="h-10 rounded-md bg-forest-deep text-sm font-semibold text-white transition-colors hover:bg-forest"
              >
                ძიება
              </button>
            </form>
          </Popover>
        ) : null}

        {facets.showStyles ? (
          <Popover label="სტილი" align={popoverAlign} activeCount={query.styles.length}>
            <form action={action} method="get" onSubmit={handleSubmit} className="grid gap-2">
              <CarriedParams query={query} omit={["styles"]} />
              <div className="max-h-56 overflow-y-auto">
                {facets.styles.map((style) => (
                  <label
                    key={style.code}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-ink hover:bg-mint"
                  >
                    <input
                      type="checkbox"
                      name="styles"
                      value={style.code}
                      defaultChecked={query.styles.includes(style.code)}
                      className="size-4 accent-forest"
                    />
                    {style.label_ka}
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="h-10 rounded-md bg-forest-deep text-sm font-semibold text-white transition-colors hover:bg-forest"
              >
                ძიება
              </button>
            </form>
          </Popover>
        ) : null}

        {hasActiveFilters ? (
          <a
            href={resetHref}
            onClick={handleReset}
            className="ml-auto flex h-11 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-forest underline-offset-4 transition-colors hover:bg-mint hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
          >
            <X className="size-4" aria-hidden="true" />
            გასუფთავება
          </a>
        ) : null}
      </div>
    </div>
  );
}
