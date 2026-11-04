import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Links, not buttons. The pager is navigation: a crawler has to be able to follow it to
// reach page 2, and a customer has to be able to middle-click it or copy the address. A
// button that calls router.push satisfies neither, and this is a server component so it
// ships no JavaScript at all.

type PaginationProps = {
  page: number;
  pageCount: number;
  // Builds the href for a page. The caller owns it because each page carries a different
  // set of filter params that must survive the jump.
  buildHref: (page: number) => string;
  className?: string;
};

// How many numbered links to show at most, excluding the first/last anchors and ellipses.
// 5 keeps the strip inside a phone's width while still showing a neighbour on each side.
const WINDOW_SIZE = 5;

// The page numbers to render, with null standing for a gap.
//
// Always includes page 1 and the last page so the two ends stay reachable in one click,
// then a window around the current page. Collapses to a plain list when everything fits.
function pageItems(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= WINDOW_SIZE + 2) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const half = Math.floor(WINDOW_SIZE / 2);
  // Clamped so the window keeps its full width at both ends instead of shrinking as it
  // runs into the edges.
  let start = Math.max(2, page - half);
  const end = Math.min(pageCount - 1, start + WINDOW_SIZE - 1);
  start = Math.max(2, end - WINDOW_SIZE + 1);

  const items: (number | null)[] = [1];
  if (start > 2) items.push(null);
  for (let current = start; current <= end; current += 1) items.push(current);
  if (end < pageCount - 1) items.push(null);
  items.push(pageCount);

  return items;
}

const baseLinkClass =
  "inline-flex size-10 sm:size-11 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

const idleLinkClass = "bg-white text-ink shadow-card hover:bg-mint hover:text-forest";

export function Pagination({
  page,
  pageCount,
  buildHref,
  className,
}: PaginationProps) {
  // One page of results is not a pager. Rendering "1" on its own is chrome that tells the
  // customer nothing and invites a click that does nothing.
  if (pageCount <= 1) return null;

  const items = pageItems(page, pageCount);
  const hasPrevious = page > 1;
  const hasNext = page < pageCount;

  return (
    <nav
      aria-label="გვერდების ნავიგაცია"
      className={cn("mt-10 flex flex-wrap items-center justify-center gap-1.5", className)}
    >
      {/* The disabled edges render as spans rather than links: there is no page 0 to point
          at, and a link that goes nowhere is worse than an absent one for a keyboard or
          screen-reader user walking the strip. */}
      {hasPrevious ? (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          aria-label="წინა გვერდი"
          className={cn(baseLinkClass, idleLinkClass)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={cn(baseLinkClass, "text-control")}
        >
          <ChevronLeft className="size-4" />
        </span>
      )}

      {items.map((item, index) =>
        item === null ? (
          <span
            // Index is a safe key here: the strip is derived purely from page/pageCount, so
            // positions are stable for a given render and there is nothing to preserve.
            key={`gap-${index}`}
            aria-hidden="true"
            className="inline-flex h-10 w-6 items-center justify-center text-sm text-meta"
          >
            …
          </span>
        ) : item === page ? (
          <span
            key={item}
            aria-current="page"
            className={cn(baseLinkClass, "bg-forest-deep text-white shadow-card")}
          >
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-label={`გვერდი ${item}`}
            className={cn(baseLinkClass, idleLinkClass)}
          >
            {item}
          </Link>
        ),
      )}

      {hasNext ? (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          aria-label="შემდეგი გვერდი"
          className={cn(baseLinkClass, idleLinkClass)}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={cn(baseLinkClass, "text-control")}
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
