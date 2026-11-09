import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, ImageIcon } from "lucide-react";
import {
  formatPrice,
  formatViewCount,
  MIN_DISPLAYED_VIEW_COUNT,
  type ProductCardData,
} from "@/lib/storefront";

const badgeClass =
  "absolute top-2.5 left-2.5 z-10 inline-flex items-center rounded-md px-2 py-1 text-xs leading-none font-semibold text-white";

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/product/${encodeURIComponent(product.slug)}`}
      className="group flex h-full min-w-0 flex-col rounded-lg bg-white p-2.5 shadow-card transition-shadow duration-300 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest motion-reduce:transition-none"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-md bg-placeholder">
        {/* Lists are available-only today, so this only shows on a directly-linked card.
            It exists so a sold item can never render as purchasable. */}
        {!product.isPurchasable ? (
          <span className={`${badgeClass} bg-sold`}>
            {product.status === "reserved" ? "დაჯავშნილი" : "გაყიდული"}
          </span>
        ) : product.showsDiscount ? (
          /* At most one badge: the discount is the stronger claim, so it wins over "new".
             Both are already suppressed on unbuyable listings. */
          <span className={`${badgeClass} bg-forest-deep tabular-nums`}>
            -{product.discountPercent}%
          </span>
        ) : product.isNewArrival ? (
          <span className={`${badgeClass} bg-forest`}>ახალი</span>
        ) : null}
        {product.leadImageId ? (
          <Image
            src={`/api/product-images/${product.leadImageId}`}
            alt={`${product.name} — პროდუქტის ფოტო`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        ) : (
          <div className="grid size-full place-items-center text-meta">
            <ImageIcon className="size-9" strokeWidth={1.4} aria-hidden="true" />
            <span className="sr-only">ფოტო არ არის</span>
          </div>
        )}
      </div>

      {/* Same rows as ProductCardSkeleton. */}
      <div className="flex flex-1 flex-col px-1 pt-3 pb-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="max-w-full truncate text-xs font-medium text-meta">
            {product.categoryName ?? "კატალოგის გარეშე"}
          </p>
          {/* `unassessed` is suppressed on cards: the detail page explains it instead. */}
          {product.conditionGrade &&
          product.conditionGrade.code !== "unassessed" ? (
            <p className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-forest">
              <span className="size-1.5 rounded-full bg-forest" aria-hidden="true" />
              {product.conditionGrade.label_ka}
            </p>
          ) : null}
          {product.viewCount >= MIN_DISPLAYED_VIEW_COUNT ? (
            <p className="flex shrink-0 items-center gap-1 text-xs font-medium text-meta tabular-nums">
              <Eye className="size-3.5" aria-hidden="true" />
              {formatViewCount(product.viewCount)}
            </p>
          ) : null}
        </div>
        <h3 className="mt-1.5 mb-3 line-clamp-2 text-sm leading-5 font-semibold text-ink sm:text-[0.9375rem]">
          {product.name}
        </h3>

        {/* mt-auto pins the price row to the bottom, so rows align across a grid line. */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <p className="text-base font-bold text-ink tabular-nums sm:text-lg">
              {formatPrice(product.price)}
            </p>
            {/* <s>, not a class: the strike-through is meaning, so it must reach a screen
                reader too, and the label says which number is which. */}
            {product.showsDiscount && product.compareAtPrice !== null ? (
              <p className="text-xs text-meta tabular-nums">
                <span className="sr-only">ძველი ფასი: </span>
                <s>{formatPrice(product.compareAtPrice)}</s>
              </p>
            ) : null}
          </div>
          {/* Visual affordance only — the whole card is the link. */}
          <span
            aria-hidden="true"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-forest-deep px-3 text-xs font-semibold text-white transition-colors group-hover:bg-forest"
          >
            ნახვა
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </span>
        </div>
      </div>
    </Link>
  );
}
