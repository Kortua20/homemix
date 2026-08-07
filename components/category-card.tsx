import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import type { Category } from "@/lib/storefront";

export function CategoryCard({
  category,
  showProductCount = false,
}: {
  category: Category;
  showProductCount?: boolean;
}) {
  const image = category.images[0];

  return (
    <Link
      href={`/categories/${encodeURIComponent(category.slug)}`}
      className="group relative block min-h-95 overflow-hidden rounded-xl bg-[#173c2f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d4a38] sm:min-h-107.5 lg:min-h-117.5"
    >
      {image ? (
        <Image
          src={`/api/category-images/${image.id}`}
          alt=""
          fill
          sizes="(max-width: 639px) 78vw, (max-width: 1023px) 45vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-white/70">
          <ImageIcon className="size-10" strokeWidth={1.4} aria-hidden="true" />
        </span>
      )}
      <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,24,16,.82)_0%,rgba(7,24,16,.12)_62%)]" />
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-6">
        <span className="min-w-0">
          <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {category.name}
          </h3>
          {showProductCount && category.productCount > 0 ? (
            <span className="mt-2 block text-sm font-semibold text-white/78">
              {category.productCount} პროდუქტი
            </span>
          ) : null}
        </span>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/55 transition-colors group-hover:bg-white group-hover:text-[#173c2f]">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
