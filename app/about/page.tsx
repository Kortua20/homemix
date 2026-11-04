import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageBanner } from "@/components/page-banner";
import { TrustStrip } from "@/components/trust-strip";

export const metadata: Metadata = {
  title: "ჩვენ შესახებ",
  description: "გაიგეთ მეტი Home Mix-ის ავეჯის ონლაინ კატალოგის შესახებ.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "ჩვენ შესახებ | Home Mix",
    description: "გაიგეთ მეტი Home Mix-ის ავეჯის ონლაინ კატალოგის შესახებ.",
    url: "/about",
    images: [
      {
        url: "/hero/living-room.webp",
        alt: "Home Mix-ის თანამედროვე ინტერიერი",
      },
    ],
  },
};

export default function AboutPage() {
  return (
    <main>
      <PageBanner
        title="ჩვენ შესახებ"
        crumbs={[{ label: "ჩვენ შესახებ" }]}
        image="/hero/dining-room.webp"
      />
      <div className="page-container section-y">
        <div className="grid items-center gap-8 rounded-lg bg-white p-4 shadow-card sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:p-8">
          <div className="max-w-xl lg:pl-2">
            <h2 className="accent-bar text-2xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-[1.75rem]">
              Home Mix
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink">
              Home Mix არის მეორადი ავეჯის მაღაზია თბილისში — დივნები,
              მაგიდები, საწოლები და საოჯახო ავეჯი.
            </p>
            <p className="mt-4 text-base leading-7 text-ink-muted">
              დაათვალიერეთ კატალოგი და შეარჩიეთ სასურველი. მიტანა თბილისში
              უფასოა.
            </p>
            <Link
              href="/products"
              className="group mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-forest-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
            >
              პროდუქტების ნახვა
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="relative aspect-4/3 overflow-hidden rounded-md bg-placeholder">
            <Image
              src="/hero/living-room.webp"
              alt="ნათელი მისაღები ოთახი ნეიტრალური ავეჯით"
              fill
              sizes="(max-width: 1023px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <TrustStrip />
        </div>
      </div>
    </main>
  );
}
