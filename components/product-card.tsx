import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { formatPrice, type Product } from "@/lib/storefront";

export function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images[0];

  return (
    <Link
      href={`/product/${encodeURIComponent(product.slug)}`}
      className="group min-w-0 rounded-2xl bg-white p-2.5 shadow-[0_10px_28px_rgba(59,40,27,0.06)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7f512f]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f0eded]">
        {firstImage ? (
          <Image
            src={`/api/product-images/${firstImage.id}`}
            alt={`${product.name} — პროდუქტის ფოტო`}
            fill
            sizes="(max-width: 520px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        ) : (
          <div className="grid size-full place-items-center text-[#a89082]">
            <ImageIcon className="size-9" strokeWidth={1.4} aria-hidden="true" />
            <span className="sr-only">ფოტო არ არის</span>
          </div>
        )}
      </div>
      <div className="px-2 pb-2 pt-4">
        <p className="truncate text-xs font-semibold text-[#83746b]">
          {product.category?.name ?? "კატეგორიის გარეშე"}
        </p>
        <h3 className="mt-1.5 line-clamp-2 min-h-12 text-base leading-6 font-semibold text-[#1b1c1c]">
          {product.name}
        </h3>
        <p className="mt-3 text-lg font-bold text-[#7f512f]">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
