import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PromoBannerProps = {
  title: string;
  href: string;
  actionLabel: string;
  tone: "forest" | "sand";
  // Omitted until the real photo exists: the banner then renders a placeholder slot with
  // the same size and crop, so dropping the file in changes nothing else.
  image?: { src: string; alt: string };
  // Names the missing asset in the DOM (data-asset-placeholder) so it is easy to find.
  placeholderName?: string;
};

const tones = {
  forest: {
    surface: "bg-forest-deep text-white",
    wash: "bg-[linear-gradient(90deg,var(--color-forest-deep)_0%,var(--color-forest-deep)_28%,rgb(23_60_47/0.6)_46%,rgb(23_60_47/0)_68%)]",
    placeholder: "bg-forest text-white/35",
    button:
      "border-white/80 text-white hover:bg-white hover:text-forest-deep focus-visible:outline-white",
  },
  sand: {
    surface: "bg-sand text-ink",
    wash: "bg-[linear-gradient(90deg,var(--color-sand)_0%,var(--color-sand)_28%,rgb(237_230_219/0.6)_46%,rgb(237_230_219/0)_68%)]",
    placeholder: "bg-[#e2d8c8] text-ink/25",
    button:
      "border-ink/70 text-ink hover:bg-ink hover:text-white focus-visible:outline-forest",
  },
} as const;

export function PromoBanner({
  title,
  href,
  actionLabel,
  tone,
  image,
  placeholderName,
}: PromoBannerProps) {
  const style = tones[tone];

  return (
    <article
      className={cn(
        "relative isolate flex min-h-48 overflow-hidden rounded-lg shadow-card sm:min-h-52",
        style.surface,
      )}
    >
      {/* Photo slot: the right ~72%. The mask fades the photo's own left edge to
          transparent, so it melts into the surface instead of starting on a hard line;
          the wash on top only keeps the title readable. */}
      <div className="absolute inset-y-0 right-0 -z-10 w-[72%] mask-[linear-gradient(90deg,transparent_0%,#000_55%)]">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 768px) 62vw, 30vw"
            className="object-cover"
          />
        ) : (
          <div
            data-asset-placeholder={placeholderName}
            className={cn("grid size-full place-items-center pl-[30%]", style.placeholder)}
          >
            <ImageIcon className="size-10" strokeWidth={1.25} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className={cn("absolute inset-0 -z-10", style.wash)} />

      <div className="flex max-w-[62%] flex-col justify-center p-6 sm:p-7">
        <h2 className="text-xl leading-snug font-bold tracking-[-0.015em] text-balance sm:text-2xl">
          {title}
        </h2>
        <Link
          href={href}
          className={cn(
            "group mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-3",
            style.button,
          )}
        >
          {actionLabel}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}
