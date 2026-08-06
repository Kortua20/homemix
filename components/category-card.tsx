import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/storefront";

const categoryImages = [
  "/hero/living-room.webp",
  "/hero/dining-room.webp",
  "/hero/bedroom.webp",
] as const;

export function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const image = categoryImages[index % categoryImages.length];

  return (
    <Link
      href={`/products?category=${encodeURIComponent(category.slug)}`}
      className="group relative block min-h-95 overflow-hidden rounded-xl bg-[#173c2f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d4a38] sm:min-h-107.5 lg:min-h-117.5"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 639px) 78vw, (max-width: 1023px) 45vw, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none"
      />
      <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,24,16,.82)_0%,rgba(7,24,16,.12)_62%)]" />
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-6">
        <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {category.name}
        </h3>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/55 transition-colors group-hover:bg-white group-hover:text-[#173c2f]">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
