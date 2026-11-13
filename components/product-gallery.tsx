"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, ImageIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ProductImage } from "@/lib/storefront";

const SWIPE_THRESHOLD = 50;

// The viewer is only needed once someone opens a photo, so its code is fetched then — and
// warmed on hover / focus of the photo, so the first open does not wait on the network.
const loadLightbox = () => import("@/components/image-lightbox");
const ImageLightbox = dynamic(
  () => loadLightbox().then((module) => module.ImageLightbox),
  { ssr: false },
);

function productImageUrl(imageId: string) {
  return `/api/product-images/${imageId}`;
}

const arrowClass =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-card transition-colors hover:bg-white hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

export function ProductGallery({
  images,
  productName,
  // Optional controlled selection. The flaw list sets this so clicking a flaw brings its
  // close-up into view; left undefined, the gallery owns its own selection as before.
  selectedImageId,
  onSelectedImageChange,
}: {
  images: ProductImage[];
  productName: string;
  selectedImageId?: string | null;
  onSelectedImageChange?: (imageId: string) => void;
}) {
  const [uncontrolledId, setUncontrolledId] = useState(images[0]?.id ?? null);
  const isControlled = selectedImageId !== undefined;
  const selectedId = isControlled ? selectedImageId : uncontrolledId;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  // Memoised for correctness, not speed: the lightbox treats a new slides array as new
  // content and resets its position, which would cut short the slide animation each time
  // a swipe in the viewer re-renders this gallery.
  const lightboxImages = useMemo(
    () =>
      images.map((image, index) => ({
        src: productImageUrl(image.id),
        alt: `${productName} — ფოტო ${index + 1}`,
      })),
    [images, productName],
  );
  const selectedImage =
    images.find((image) => image.id === selectedId) ?? images[0];

  function selectImage(imageId: string) {
    if (!isControlled) setUncontrolledId(imageId);
    onSelectedImageChange?.(imageId);
  }
  const selectedIndex = selectedImage
    ? images.findIndex((image) => image.id === selectedImage.id)
    : -1;

  function selectRelativeImage(direction: -1 | 1) {
    if (images.length < 2 || selectedIndex < 0) return;

    const nextIndex =
      (selectedIndex + direction + images.length) % images.length;
    selectImage(images[nextIndex].id);
  }


  if (!selectedImage) {
    return (
      <div className="grid aspect-4/3 place-items-center rounded-lg bg-placeholder text-meta">
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
      {/* The arrow keys are handled here and reach it by bubbling from the open-photo
          button, which is the one tab stop for the photo itself. */}
      <div
        className="relative aspect-4/3 w-full max-w-full touch-pan-y overflow-hidden rounded-lg bg-placeholder select-none"
        role="group"
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
          src={productImageUrl(selectedImage.id)}
          alt={`${productName} — პროდუქტის ფოტო`}
          fill
          preload
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover"
        />
        {/* Covers the photo rather than wrapping it, so the arrows stay sibling buttons
            instead of buttons nested in a button. A swipe never becomes a click: the
            browser drops the click once the touch has moved. The outline is inset because
            the frame's overflow-hidden would clip an outset one. */}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label="ფოტოს გადიდება"
          onClick={() => setIsLightboxOpen(true)}
          onPointerEnter={() => void loadLightbox()}
          onFocus={() => void loadLightbox()}
          className="group absolute inset-0 cursor-zoom-in rounded-lg focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-forest"
        >
          {/* Visible on touch screens too, where there is no zoom cursor to hint at it. */}
          <span
            aria-hidden="true"
            className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-white/95 text-ink shadow-card transition-colors group-hover:text-forest"
          >
            <Expand className="size-4.5" />
          </span>
        </button>
        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="წინა ფოტო"
              onClick={() => selectRelativeImage(-1)}
              className={`${arrowClass} left-3`}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="შემდეგი ფოტო"
              onClick={() => selectRelativeImage(1)}
              className={`${arrowClass} right-3`}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div
          className="no-scrollbar -mx-1.5 mt-1.5 flex w-[calc(100%+0.75rem)] overflow-x-auto overscroll-x-contain"
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
                onClick={() => selectImage(image.id)}
                className={`relative m-1.5 aspect-4/3 w-[calc(25%-0.75rem)] min-w-20 shrink-0 overflow-hidden rounded-md bg-placeholder focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest ${
                  isSelected
                    ? "ring-2 ring-forest ring-offset-2 ring-offset-white"
                    : "opacity-70 transition-opacity hover:opacity-100"
                }`}
              >
                <Image
                  src={productImageUrl(image.id)}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Bound to the gallery's own selection both ways: it opens on the photo being shown,
          and whatever photo it is closed on stays selected underneath — which keeps the
          flaw list's highlight in step too. Rendered only while open, which is also what
          defers loading its code; the viewer plays its own fade-out before calling
          onClose. */}
      {isLightboxOpen ? (
        <ImageLightbox
          onClose={() => setIsLightboxOpen(false)}
          index={selectedIndex}
          onIndexChange={(index) => {
            const image = images[index];
            if (image && image.id !== selectedImage.id) selectImage(image.id);
          }}
          images={lightboxImages}
        />
      ) : null}
    </section>
  );
}
