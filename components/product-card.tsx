import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import { formatPrice, type Product } from "@/lib/storefront";

export function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images[0];

  return (
    <Link
      href={`/product/${encodeURIComponent(product.slug)}`}
      className="group block min-w-0 focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d4a38]"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-[#e8ebe7]">
        {/* Lists are available-only today, so this only shows on a directly-linked card.
            It exists so a sold item can never render as purchasable. */}
        {!product.isPurchasable ? (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-[#443a72] px-2.5 py-1 text-xs font-semibold text-white">
            {product.status === "reserved" ? "დაჯავშნილი" : "გაყიდული"}
          </span>
        ) : null}
        {firstImage ? (
          <Image
            src={`/api/product-images/${firstImage.id}`}
            alt={`${product.name} — პროდუქტის ფოტო`}
            fill
            sizes="(max-width: 520px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none"
          />
        ) : (
          <div className="grid size-full place-items-center text-[#748078]">
            <ImageIcon
              className="size-9"
              strokeWidth={1.4}
              aria-hidden="true"
            />
            <span className="sr-only">ფოტო არ არის</span>
          </div>
        )}
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <p className="truncate text-xs font-semibold text-[#667168]">
              {product.category?.name ?? "კატალოგის გარეშე"}
            </p>
            {/* `unassessed` is suppressed here: a grid where every card reads "assessment
                in progress" is noise, and on a card there is no room for the explanation
                that makes it meaningful. The detail page states it plainly instead. */}
            {product.conditionGrade &&
            product.conditionGrade.code !== "unassessed" ? (
              <p className="truncate text-xs font-medium text-[#1d4a38]">
                {product.conditionGrade.label_ka}
              </p>
            ) : null}
            <h3 className="mt-1.5 line-clamp-2 min-h-12 text-base leading-6 font-semibold text-[#18221d]">
              {product.name}
            </h3>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <ArrowUpRight className="size-4" aria-hidden="true" />
            <p className="text-lg font-bold text-[#173c2f]">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-4"></div>
      </div>
    </Link>
  );
}
