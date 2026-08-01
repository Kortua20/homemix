import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Category } from "@/lib/storefront";

export function CategoryCard({ category }: { category: Category; index: number }) {
  return (
    <Link
      href={`/products?category=${encodeURIComponent(category.slug)}`}
      className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl bg-white px-5 py-5 shadow-[0_8px_24px_rgba(59,40,27,0.05)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7f512f] sm:min-h-28 sm:px-6"
    >
      <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#1b1c1c] sm:text-2xl">
        {category.name}
      </h3>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f6f3f2] text-[#7f512f] transition-colors group-hover:bg-[#7f512f] group-hover:text-white">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
      </span>
    </Link>
  );
}
