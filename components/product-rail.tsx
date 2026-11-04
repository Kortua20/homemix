"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useRef, type ReactNode } from "react";
import { SectionHeader } from "@/components/section-header";

const arrowClass =
  "grid size-10 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:border-forest hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

// A titled horizontal row of cards with previous/next arrows (the reference's "similar
// products" panel). The cards are server-rendered children; this only owns the scrolling.
// The rail stays swipeable and keyboard-scrollable without the arrows.
export function ProductRail({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const count = Children.count(children);

  function scrollByPage(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    rail.scrollBy({
      left: direction * rail.clientWidth * 0.9,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return (
    <section
      aria-label={title}
      className="rounded-lg bg-white p-4 shadow-card sm:p-6"
    >
      <SectionHeader
        title={title}
        variant="panel"
        className="mb-4 items-center sm:mb-5"
        actions={
          count > 2 ? (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="წინა პროდუქტები"
                onClick={() => scrollByPage(-1)}
                className={arrowClass}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="შემდეგი პროდუქტები"
                onClick={() => scrollByPage(1)}
                className={arrowClass}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null
        }
      />
      {/* contain-paint: without it the off-screen cards still widened the page on phones
          (horizontal page scroll), even though the rail itself scrolls. */}
      <div
        ref={railRef}
        className="no-scrollbar contain-paint -mx-1 grid snap-x snap-mandatory auto-cols-[calc((100%-0.75rem)/2)] grid-flow-col gap-3 overflow-x-auto px-1 py-1 sm:auto-cols-[calc((100%-2rem)/3)] sm:gap-4 lg:auto-cols-[calc((100%-3.75rem)/4)] lg:gap-5"
      >
        {Children.map(children, (child) => (
          <div className="snap-start">{child}</div>
        ))}
      </div>
    </section>
  );
}
