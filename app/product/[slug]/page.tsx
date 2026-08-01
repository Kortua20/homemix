import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProductGallery } from "@/components/product-gallery";
import { formatPrice, getProductBySlug } from "@/lib/storefront";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "პროდუქტი ვერ მოიძებნა" };
  }

  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? `${product.name} — Home Mix-ის პროდუქტი.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="bg-[#fcf9f8]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <nav aria-label="გვერდის გზა" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-[#605e5b] sm:mb-9">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg font-semibold transition-colors hover:text-[#7f512f] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f]"
          >
            მთავარი
          </Link>
          <span aria-hidden="true" className="text-[#b3aaa4]">/</span>
          <span aria-current="page" className="max-w-[15rem] truncate text-[#83746b]">{product.name}</span>
        </nav>

        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start lg:gap-14">
          <ProductGallery images={product.images} productName={product.name} />

          <section className="lg:sticky lg:top-28">
            {product.category ? (
              <p className="text-sm font-semibold text-[#83746b]">{product.category.name}</p>
            ) : null}
            <h1 className="mt-2 max-w-[18ch] text-3xl leading-tight font-semibold tracking-[-0.03em] text-[#1b1c1c] text-balance sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-5 text-2xl font-bold text-[#7f512f] sm:text-3xl">
              {formatPrice(product.price)}
            </p>

            <div className="mt-8 border-t border-[#e4e2e1] pt-7">
              <h2 className="text-lg font-semibold text-[#1b1c1c]">პროდუქტის შესახებ</h2>
              <p className="mt-3 max-w-[65ch] whitespace-pre-line text-base leading-8 text-[#605e5b]">
                {product.description?.trim() || "აღწერა ჯერ არ არის დამატებული."}
              </p>
            </div>

            <Link
              href="/"
              className="group mt-9 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#7f512f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#6d4528] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f]"
            >
              პროდუქტებზე დაბრუნება
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
