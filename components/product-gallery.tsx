"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import type { ProductImage } from "@/lib/storefront";

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [selectedId, setSelectedId] = useState(images[0]?.id ?? null);
  const selectedImage = images.find((image) => image.id === selectedId) ?? images[0];

  if (!selectedImage) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-[#e8ebe7] text-[#748078]">
        <div className="text-center">
          <ImageIcon className="mx-auto size-12" strokeWidth={1.35} aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold">ფოტო არ არის დამატებული</p>
        </div>
      </div>
    );
  }

  return (
    <section aria-label={`${productName} — ფოტოგალერეა`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#e8ebe7]">
        <Image
          key={selectedImage.id}
          src={`/api/product-images/${selectedImage.id}`}
          alt={`${productName} — პროდუქტის ფოტო`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2" role="group" aria-label="პროდუქტის ფოტოები">
          {images.map((image, index) => {
            const isSelected = image.id === selectedImage.id;

            return (
              <button
                key={image.id}
                type="button"
                aria-label={`ფოტო ${index + 1}-ის ნახვა`}
                aria-pressed={isSelected}
                onClick={() => setSelectedId(image.id)}
                className={`relative h-18 w-24 shrink-0 overflow-hidden rounded-xl bg-[#e8ebe7] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38] sm:h-20 sm:w-28 ${
                  isSelected ? "ring-2 ring-[#1d4a38] ring-offset-2 ring-offset-[#f4f2ed]" : "opacity-75 hover:opacity-100"
                }`}
              >
                <Image
                  src={`/api/product-images/${image.id}`}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
