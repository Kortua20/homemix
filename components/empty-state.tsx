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
    <div className={cn("flex min-h-52 flex-col items-center justify-center rounded-xl border bg-white px-5 py-10 text-center", tone === "error" ? "border-[#d6a9a4]" : "border-[#d8ded8]") }>
      <Icon className="size-8 text-[#748078]" strokeWidth={1.5} aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold text-[#18221d]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#5e685f]">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#1d4a38] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#173c2f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4a38]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
