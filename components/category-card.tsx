import Link from "next/link";
import { ArrowLeft, BedDouble, LampFloor, Sofa } from "lucide-react";
import type { Category } from "@/lib/storefront";

const icons = [Sofa, LampFloor, BedDouble];

export function CategoryCard({ category, index }: { category: Category; index: number }) {
  const Icon = icons[index % icons.length];

  return (
    <Link
      href={`/products?category=${encodeURIComponent(category.slug)}`}
      className="group flex min-h-44 items-end justify-between overflow-hidden rounded-3xl border border-[#e4e2e1] bg-white p-6 shadow-[0_10px_20px_rgba(0,0,0,0.035)] transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7f512f] sm:min-h-52 sm:p-8"
    >
      <div>
        <div className="mb-8 grid size-12 place-items-center rounded-2xl bg-[#f0eded] text-[#a89082] sm:size-14">
          <Icon className="size-6 sm:size-7" strokeWidth={1.6} aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold tracking-[-0.025em] text-[#1b1c1c] sm:text-2xl">{category.name}</h3>
      </div>
      <span className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-[#f6f3f2] text-[#7f512f] transition-colors group-hover:bg-[#7f512f] group-hover:text-white">
        <ArrowLeft className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
