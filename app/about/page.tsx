import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "ჩვენ შესახებ",
  description: "გაიგეთ მეტი Home Mix-ის ავეჯის ონლაინ კატალოგის შესახებ.",
};

export default function AboutPage() {
  return (
    <main className="bg-[#fcf9f8]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
        <div className="max-w-xl">
          <h1 className="text-4xl leading-tight font-semibold tracking-[-0.03em] text-[#1b1c1c] sm:text-5xl">
            ჩვენ შესახებ
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#3f3d3a]">ტექსტი აქ</p>
          <p className="mt-4 text-base leading-7 text-[#605e5b]">და აქ</p>
          <Link
            href="/products"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#7f512f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#6d4528] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f]"
          >
            პროდუქტების ნახვა
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative min-h-[320px] overflow-hidden rounded-2xl bg-[#f0eded] sm:min-h-[430px] lg:min-h-[520px]">
          <Image
            src="/hero/living-room.webp"
            alt="ნათელი მისაღები ოთახი ნეიტრალური ავეჯით"
            fill
            sizes="(max-width: 1023px) 100vw, 55vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </main>
  );
}
