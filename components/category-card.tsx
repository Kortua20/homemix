import Link from "next/link";
import { ArrowLeft, BedDouble, LampFloor, Sofa } from "lucide-react";
import type { Category } from "@/lib/storefront";

const icons = [Sofa, LampFloor, BedDouble];

export function CategoryCard({ category, index }: { category: Category; index: number }) {
  const Icon = icons[index % icons.length];

  return (
    <Link
      href={`/products?category=${encodeURIComponent(category.slug)}`}
      className="group grid min-h-28 grid-cols-[3.25rem_1fr_auto] items-center gap-4 border-t border-[#2f2925]/30 py-5 transition-colors hover:bg-[#6f4329] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#3a5577] sm:min-h-36 sm:grid-cols-[5rem_1fr_8rem] sm:gap-8 sm:py-7"
    >
      <span className="text-sm font-semibold tracking-[0.12em] text-[#3a5577] transition-colors group-hover:text-[#d7e5f5] sm:text-base">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="flex min-w-0 items-center gap-5 sm:gap-8">
        <Icon className="hidden size-10 shrink-0 text-[#806a5b] transition-colors group-hover:text-[#f1c69f] sm:block" strokeWidth={1.15} aria-hidden="true" />
        <span className="min-w-0 text-[clamp(1.65rem,4vw,3.6rem)] leading-none font-semibold tracking-[-0.03em] text-[#241b16] transition-colors group-hover:text-white">
          {category.name}
        </span>
      </span>
      <span className="grid size-11 place-items-center border border-[#2f2925]/35 text-[#6f4329] transition-colors group-hover:border-white/50 group-hover:text-white sm:justify-self-end">
        <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
      </span>
    </Link>
  );
}
