import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// One header for every section. Sections differ by content, never by heading styling.
//
// - "page":  a section on the page surface; the title carries the short accent bar below.
// - "panel": a title inside a white panel; the bar sits to the left instead.
export function SectionHeader({
  title,
  description,
  href,
  linkLabel = "ყველას ნახვა",
  actions,
  variant = "page",
  id,
  className,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  actions?: ReactNode;
  variant?: "page" | "panel";
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-x-5 gap-y-3 sm:mb-7",
        className,
      )}
    >
      {/* basis-64: on phones the link wraps under the title instead of squeezing it. */}
      <div className="min-w-0 flex-1 basis-64">
        <h2
          id={id}
          className={cn(
            "font-bold tracking-[-0.02em] text-ink",
            variant === "page"
              ? "accent-bar text-2xl leading-tight sm:text-[1.75rem]"
              : "flex items-center gap-3 text-lg leading-snug sm:text-xl before:block before:h-6 before:w-1 before:rounded-full before:bg-forest",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {href || actions ? (
        <div className="flex shrink-0 items-center gap-3">
          {href ? (
            <Link
              href={href}
              className="group flex min-h-11 items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
            >
              {linkLabel}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          ) : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
