import Link from "next/link";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/storefront";

// "tile": the compact homepage row from the reference — photo, bottom gradient, centred
// white label. "large": the /categories grid, same language, with the product count.
export function CategoryCard({
  category,
  size = "tile",
  className,
}: {
  category: Category;
  size?: "tile" | "large";
  className?: string;
}) {
  const image = category.images[0];
  const isLarge = size === "large";

  return (
    <Link
      href={`/categories/${encodeURIComponent(category.slug)}`}
      className={cn(
        "group relative block overflow-hidden rounded-lg bg-forest-deep shadow-card focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest",
        isLarge ? "aspect-4/3" : "aspect-square",
        className,
      )}
    >
      {image ? (
        <Image
          src={`/api/category-images/${image.id}`}
          alt=""
          fill
          sizes={
            isLarge
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              : "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
          }
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-white/60">
          <ImageIcon className="size-9" strokeWidth={1.4} aria-hidden="true" />
        </span>
      )}
      <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(20,18,14,.78)_0%,rgba(20,18,14,.28)_45%,rgba(20,18,14,0)_70%)]" />
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 text-white",
          isLarge ? "p-5 sm:p-6" : "px-2 pb-3 text-center sm:pb-3.5",
        )}
      >
        <h3
          className={cn(
            "font-semibold text-balance",
            isLarge
              ? "text-xl tracking-[-0.01em] sm:text-2xl"
              : "text-sm leading-5 sm:text-[0.9375rem]",
          )}
        >
          {category.name}
        </h3>
        {isLarge && category.productCount > 0 ? (
          <span className="mt-1.5 block text-sm font-medium text-white/80">
            {category.productCount} პროდუქტი
          </span>
        ) : null}
      </span>
    </Link>
  );
}
