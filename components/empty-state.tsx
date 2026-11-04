import { AlertCircle, Armchair } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  tone = "empty",
  action,
}: {
  title: string;
  description: string;
  tone?: "empty" | "error";
  // Optional way out, for empty states the customer can actually act on — an out-of-range
  // page, say. Most empty states have no such action and render without one.
  action?: { href: string; label: string };
}) {
  const Icon = tone === "error" ? AlertCircle : Armchair;

  return (
    <div
      className={cn(
        "flex min-h-52 flex-col items-center justify-center rounded-lg bg-white px-5 py-10 text-center shadow-card",
        tone === "error" ? "ring-1 ring-danger-line" : "",
      )}
    >
      <span
        className={cn(
          "grid size-14 place-items-center rounded-full",
          tone === "error" ? "bg-[#f6e7e5] text-danger" : "bg-mint text-forest",
        )}
      >
        <Icon className="size-7" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-forest-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
