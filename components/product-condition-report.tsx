"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { ProductGallery } from "@/components/product-gallery";
import type { ProductFlaw, ProductImage } from "@/lib/storefront";
import {
  flawSeverityLabel,
  flawSeverityStyle,
  flawTypeLabel,
} from "@/lib/flaw-labels";

// Owns the selection shared between the gallery and the flaw list, so clicking a flaw
// brings its close-up into view. The product page is a server component and cannot hold
// this state itself.
//
// Pairing the two is the whole point of the flaw system: a flaw listed only as text reads
// as a disclaimer and gets skimmed, while one that jumps to its own photo reads as proof.
export function ProductConditionReport({
  images,
  productName,
  flaws,
}: {
  images: ProductImage[];
  productName: string;
  flaws: ProductFlaw[];
}) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    images[0]?.id ?? null,
  );

  // A flaw can only be jumped to if its photo is actually present.
  const imageIds = new Set(images.map((image) => image.id));
  const anchoredFlaws = flaws.filter(
    (flaw) => flaw.image_id && imageIds.has(flaw.image_id),
  );

  return (
    <div className="min-w-0">
      <ProductGallery
        images={images}
        productName={productName}
        selectedImageId={selectedImageId}
        onSelectedImageChange={setSelectedImageId}
      />

      {flaws.length > 0 ? (
        <section
          aria-labelledby="product-flaws-heading"
          className="mt-8 rounded-2xl border border-[#d8ded8] bg-white p-5"
        >
          <h2
            id="product-flaws-heading"
            className="text-lg font-semibold text-[#18221d]"
          >
            ნაკლოვანებები ({flaws.length})
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-[#5e685f]">
            ყველა ნაკლი ღიად არის ჩამოთვლილი. ფოტოს ნიშნით მონიშნულზე დაჭერით
            იხილავთ შესაბამის ფოტოს.
          </p>

          <ul className="mt-4 grid gap-3">
            {flaws.map((flaw) => {
              const hasPhoto = Boolean(
                flaw.image_id && imageIds.has(flaw.image_id),
              );
              const isSelected =
                hasPhoto && flaw.image_id === selectedImageId;

              const content = (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#18221d]">
                      {flawTypeLabel(flaw.flaw_type)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${flawSeverityStyle(flaw.severity)}`}
                    >
                      {flawSeverityLabel(flaw.severity)}
                    </span>
                    {flaw.location_ka ? (
                      <span className="text-xs text-[#667168]">
                        {flaw.location_ka}
                      </span>
                    ) : null}
                    {hasPhoto ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d4a38]">
                        <Camera aria-hidden="true" className="size-3.5" />
                        ფოტო
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-[#5e685f]">
                    {flaw.note_ka}
                  </p>
                </>
              );

              // Only flaws with a photo are interactive; the rest are plain list items
              // rather than buttons that do nothing when pressed.
              return (
                <li key={flaw.id}>
                  {hasPhoto ? (
                    <button
                      type="button"
                      onClick={() => setSelectedImageId(flaw.image_id)}
                      aria-pressed={isSelected}
                      className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4a38] ${
                        isSelected
                          ? "border-[#1d4a38] bg-[#eef3ee]"
                          : "border-[#e4e8e4] bg-[#f8faf8] hover:border-[#b9c6bd]"
                      }`}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-[#e4e8e4] bg-[#f8faf8] p-3">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {anchoredFlaws.length === 0 ? (
            <p className="mt-4 text-xs leading-5 text-[#667168]">
              ამ ნაკლოვანებებს ჯერ ფოტო არ აქვს მიბმული.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
