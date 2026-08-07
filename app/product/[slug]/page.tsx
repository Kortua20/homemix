import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProductGallery } from "@/components/product-gallery";
import {
  formatPrice,
  getProductBySlug,
  getProductSlugs,
  normalizeSlug,
} from "@/lib/storefront";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "პროდუქტი ვერ მოიძებნა",
      robots: { index: false, follow: false },
    };
  }

  const description =
    product.description?.trim().slice(0, 160) ||
    `${product.name} — Home Mix-ის ავეჯის კატალოგიდან.`;
  const image = product.images[0]
    ? `/api/product-images/${product.images[0].id}`
    : "/logo.png";

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${encodeURIComponent(product.slug)}` },
    openGraph: {
      type: "website",
      title: `${product.name} | ${siteName}`,
      description,
      url: `/product/${encodeURIComponent(product.slug)}`,
      images: [{ url: image, alt: `${product.name} — პროდუქტის ფოტო` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${siteName}`,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const productUrl = absoluteUrl(
    `/product/${encodeURIComponent(product.slug)}`,
  );
  const productImages = product.images.map((image) =>
    absoluteUrl(`/api/product-images/${image.id}`),
  );
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.trim() || undefined,
    image: productImages.length ? productImages : undefined,
    sku: product.id,
    category: product.category?.name,
    url: productUrl,
    brand: { "@type": "Brand", name: siteName },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "GEL",
      price: product.price,
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "მთავარი",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "პროდუქტები",
        item: absoluteUrl("/products"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <main className="bg-[#f4f2ed]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <nav
          aria-label="გვერდის გზა"
          className="mb-7 flex flex-wrap items-center gap-2 text-sm text-[#5e685f] sm:mb-9"
        >
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center rounded-lg font-semibold transition-colors hover:text-[#1d4a38] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
          >
            მთავარი
          </Link>
          <span aria-hidden="true" className="text-[#b3aaa4]">
            /
          </span>
          <span
            aria-current="page"
            className="max-w-60 truncate text-[#667168]"
          >
            {product.name}
          </span>
        </nav>

        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start lg:gap-14">
          <ProductGallery images={product.images} productName={product.name} />

          <section className="lg:sticky lg:top-28">
            {product.category ? (
              <p className="text-sm font-semibold text-[#667168]">
                {product.category.name}
              </p>
            ) : null}
            <h1 className="mt-2 max-w-[18ch] text-3xl leading-tight font-semibold tracking-[-0.03em] text-[#18221d] text-balance sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-5 text-2xl font-bold text-[#1d4a38] sm:text-3xl">
              {formatPrice(product.price)}
            </p>

            <div className="mt-8 border-t border-[#d8ded8] pt-7">
              <h2 className="text-lg font-semibold text-[#18221d]">
                პროდუქტის შესახებ
              </h2>
              <p className="mt-3 max-w-[65ch] whitespace-pre-line text-base leading-8 text-[#5e685f]">
                {product.description?.trim() ||
                  "აღწერა ჯერ არ არის დამატებული."}
              </p>
            </div>

            <Link
              href="/"
              className="group mt-9 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#1d4a38] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#15382a] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
            >
              პროდუქტებზე დაბრუნება
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
