"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/storefront";

const SWIPE_THRESHOLD = 50;

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [selectedId, setSelectedId] = useState(images[0]?.id ?? null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const selectedImage =
    images.find((image) => image.id === selectedId) ?? images[0];
  const selectedIndex = selectedImage
    ? images.findIndex((image) => image.id === selectedImage.id)
    : -1;

  function selectRelativeImage(direction: -1 | 1) {
    if (images.length < 2 || selectedIndex < 0) return;

    const nextIndex =
      (selectedIndex + direction + images.length) % images.length;
    setSelectedId(images[nextIndex].id);
  }

  if (!selectedImage) {
    return (
      <div className="grid aspect-4/3 place-items-center rounded-2xl bg-[#e8ebe7] text-[#748078]">
        <div className="text-center">
          <ImageIcon
            className="mx-auto size-12"
            strokeWidth={1.35}
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold">ფოტო არ არის დამატებული</p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label={`${productName} — ფოტოგალერეა`}
      className="min-w-0 max-w-full"
    >
      <div
        className="relative aspect-4/3 w-full max-w-full touch-pan-y overflow-hidden rounded-2xl bg-[#e8ebe7] select-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
        role="group"
        tabIndex={images.length > 1 ? 0 : -1}
        aria-label={`${productName} — ფოტო ${selectedIndex + 1} / ${images.length}. გაასრიალეთ მარცხნივ ან მარჯვნივ.`}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") selectRelativeImage(-1);
          if (event.key === "ArrowRight") selectRelativeImage(1);
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          if (!touchStart.current) return;

          const touch = event.changedTouches[0];
          const deltaX = touch.clientX - touchStart.current.x;
          const deltaY = touch.clientY - touchStart.current.y;
          touchStart.current = null;

          if (
            Math.abs(deltaX) < SWIPE_THRESHOLD ||
            Math.abs(deltaX) <= Math.abs(deltaY)
          )
            return;
          selectRelativeImage(deltaX < 0 ? 1 : -1);
        }}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
      >
        <Image
          key={selectedImage.id}
          src={`/api/product-images/${selectedImage.id}`}
          alt={`${productName} — პროდუქტის ფოტო`}
          fill
          preload
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div
          className="mt-2 flex w-full max-w-full overflow-x-auto overscroll-x-contain pb-2"
          role="group"
          aria-label="პროდუქტის ფოტოები"
        >
          {images.map((image, index) => {
            const isSelected = image.id === selectedImage.id;

            return (
              <button
                key={image.id}
                type="button"
                aria-label={`ფოტო ${index + 1}-ის ნახვა`}
                aria-pressed={isSelected}
                onClick={() => setSelectedId(image.id)}
                className={`relative m-2 h-18 w-24 shrink-0 overflow-hidden rounded-xl bg-[#e8ebe7] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38] sm:h-20 sm:w-28 ${
                  isSelected
                    ? "ring-2 ring-[#1d4a38] ring-offset-2 ring-offset-[#f4f2ed]"
                    : "opacity-75 hover:opacity-100"
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
