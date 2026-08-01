import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft, ImageIcon } from "lucide-react";
import { formatPrice, type Product } from "@/lib/storefront";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const firstImage = product.images[0];

  return (
    <Link
      href={`/product/${encodeURIComponent(product.slug)}`}
      className="group min-w-0 border-white/20 outline-none focus-visible:ring-2 focus-visible:ring-[#f1c69f] focus-visible:ring-offset-4 focus-visible:ring-offset-[#2d211a] min-[520px]:border-l min-[520px]:pl-5 lg:pl-6"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#46372f]">
        {firstImage ? (
          <Image
            src={`/api/product-images/${firstImage.id}`}
            alt={`${product.name} — პროდუქტის ფოტო`}
            fill
            sizes="(max-width: 520px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.035] group-hover:saturate-[1.08] motion-reduce:transition-none"
          />
        ) : (
          <div className="grid size-full place-items-center text-[#bca99d]">
            <ImageIcon className="size-10" strokeWidth={1.2} aria-hidden="true" />
            <span className="sr-only">ფოტო არ არის</span>
          </div>
        )}
        <span className="absolute left-3 top-3 border border-white/40 bg-[#2d211a]/75 px-2.5 py-1.5 text-[0.65rem] font-bold tracking-[0.12em] text-white backdrop-blur-sm">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="border-b border-white/25 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#cbb9ad]">
              {product.category?.name ?? "კატეგორიის გარეშე"}
            </p>
            <h3 className="mt-2 line-clamp-2 min-h-12 text-lg leading-6 font-semibold text-white">
              {product.name}
            </h3>
          </div>
          <ArrowUpLeft className="mt-1 size-5 shrink-0 text-[#d79b69] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xl font-bold text-[#f1c69f]">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
