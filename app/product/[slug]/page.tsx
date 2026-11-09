import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Eye, MessageCircle, Phone } from "lucide-react";
import { ConditionAspectTable } from "@/components/condition-aspect-table";
import { PageBanner } from "@/components/page-banner";
import { ProductCard } from "@/components/product-card";
import { ProductConditionReport } from "@/components/product-condition-report";
import { ProductAttributes } from "@/components/product-attributes";
import { ProductDimensionsTable } from "@/components/product-dimensions-table";
import { ProductRail } from "@/components/product-rail";
import { ProductViewBeacon } from "@/components/product-view-beacon";
import { BrandIcon } from "@/components/brand-icons";
import { ShareLinks } from "@/components/share-links";
import { contactDetails, socialLinks } from "@/lib/contact-details";
import {
  formatPrice,
  formatViewCount,
  MIN_DISPLAYED_VIEW_COUNT,
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
  normalizeSlug,
} from "@/lib/storefront";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 60;

const primaryActionClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-forest-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest";

// Streams in after the product: a slow or failed lookup must never hold up or break the
// page itself, so errors render nothing rather than an error state.
async function RelatedProducts({
  categoryId,
  productId,
}: {
  categoryId: string;
  productId: string;
}) {
  const products = await getRelatedProducts(categoryId, productId, 8).catch(
    () => [],
  );
  if (products.length === 0) return null;

  return (
    <div className="mt-6 sm:mt-8">
      <ProductRail title="მსგავსი პროდუქტები">
        {products.map((related) => (
          <ProductCard key={related.id} product={related} />
        ))}
      </ProductRail>
    </div>
  );
}

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

  // Not a rung on the quality ladder — the absence of a rating. Rendered muted rather than
  // as a grade, and kept out of the card summary entirely.
  const isUnassessed = product.conditionGrade?.code === "unassessed";
  const productUrl = absoluteUrl(
    `/product/${encodeURIComponent(product.slug)}`,
  );
  const productImages = product.images.map((image) =>
    absoluteUrl(`/api/product-images/${image.id}`),
  );
  // schema.org availability must reflect the real state: advertising a sold item as
  // in-stock is a structured-data violation and costs rich-result eligibility.
  const availability = product.isPurchasable
    ? "https://schema.org/InStock"
    : product.status === "reserved"
      ? "https://schema.org/BackOrder"
      : "https://schema.org/SoldOut";
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
    // itemCondition is what tells search engines this is second-hand.
    itemCondition:
      product.listingKind === "used_unique"
        ? "https://schema.org/UsedCondition"
        : "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "GEL",
      price: product.price,
      availability,
      // The "was" price, as a StrikethroughPrice-typed UnitPriceSpecification. Verified
      // against Google's merchant-listing reference rather than guessed, because two things
      // here are easy to get wrong:
      //
      // 1. The active price stays in `offers.price`. Google's precedence rule — "if you use
      //    both offers.price and offers.priceSpecification to encode an ACTIVE price,
      //    priceSpecification is ignored" — applies to an active price only. A spec typed
      //    StrikethroughPrice is not an active price, so the two coexist as intended.
      // 2. It is emitted only when showsDiscount holds, which is false on sold and reserved
      //    listings. Claiming a sale price on a SoldOut offer is the same class of
      //    structured-data violation as claiming InStock for a sold item.
      ...(product.showsDiscount && product.compareAtPrice !== null
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              priceType: "https://schema.org/StrikethroughPrice",
              price: product.compareAtPrice,
              priceCurrency: "GEL",
            },
          }
        : {}),
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

  const bannerImage = product.category?.images[0];

  return (
    <main>
      <ProductViewBeacon productId={product.id} />
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
      <PageBanner
        title={product.category?.name ?? "პროდუქტები"}
        crumbs={[
          { label: "პროდუქტები", href: "/products" },
          ...(product.category
            ? [
                {
                  label: product.category.name,
                  href: `/categories/${encodeURIComponent(product.category.slug)}`,
                },
              ]
            : []),
          { label: product.name },
        ]}
        image={
          bannerImage
            ? `/api/category-images/${bannerImage.id}`
            : undefined
        }
      />

      <div className="page-container py-6 sm:py-8">
        <div className="grid gap-8 rounded-lg bg-white p-4 shadow-card sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-12 lg:p-8">
          <ProductConditionReport
            images={product.images}
            productName={product.name}
            flaws={product.flaws}
          />

          <section className="min-w-0 lg:sticky lg:top-36">
            <div className="flex flex-wrap items-center gap-2.5">
              {product.category ? (
                <p className="text-sm font-medium text-meta">
                  {product.category.name}
                </p>
              ) : null}
              {product.listingKind === "used_unique" ? (
                <span className="inline-flex items-center rounded-md bg-mint px-2 py-1 text-xs leading-none font-semibold text-forest">
                  მეორადი
                </span>
              ) : null}
              {product.isNewArrival ? (
                <span className="inline-flex items-center rounded-md bg-forest px-2 py-1 text-xs leading-none font-semibold text-white">
                  ახალი შემოსული
                </span>
              ) : null}
              {/* From the cached render, so it can trail the live total by up to the
                  page's revalidate window. */}
              {product.viewCount >= MIN_DISPLAYED_VIEW_COUNT ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-meta tabular-nums">
                  <Eye className="size-4" aria-hidden="true" />
                  {formatViewCount(product.viewCount)}
                </p>
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl leading-tight font-bold tracking-[-0.02em] text-ink text-balance sm:text-3xl">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <p className="text-3xl font-bold text-ink tabular-nums">
                {formatPrice(product.price)}
              </p>
              {/* showsDiscount is already false on a sold or reserved item, so the "was"
                  price disappears with the offer rather than outliving it. */}
              {product.showsDiscount && product.compareAtPrice !== null ? (
                <>
                  <p className="text-lg text-meta tabular-nums">
                    <span className="sr-only">ძველი ფასი: </span>
                    <s>{formatPrice(product.compareAtPrice)}</s>
                  </p>
                  <span className="inline-flex items-center self-center rounded-md bg-forest-deep px-2 py-1 text-xs leading-none font-semibold text-white tabular-nums">
                    -{product.discountPercent}%
                  </span>
                </>
              ) : null}
            </div>
            <span
              aria-hidden="true"
              className="mt-3 block h-0.75 w-11 rounded-full bg-forest"
            />

            {!product.isPurchasable ? (
              <p
                role="status"
                className="mt-5 inline-flex items-center rounded-md bg-[#e8e6f3] px-4 py-3 text-sm font-semibold text-sold"
              >
                {product.status === "reserved"
                  ? "ეს ნივთი დაჯავშნილია."
                  : "ეს ნივთი გაყიდულია."}
              </p>
            ) : null}

            {/* No cart: a purchase happens by phone or in the shop, so the primary action
                is the call. A sold or reserved item points to available alternatives. */}
            <div className="mt-6 grid gap-3">
              {!product.isPurchasable ? (
                <Link
                  href={
                    product.category
                      ? `/categories/${encodeURIComponent(product.category.slug)}`
                      : "/products"
                  }
                  className={primaryActionClass}
                >
                  მსგავსი ხელმისაწვდომი ნივთები
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : contactDetails.phone.href ? (
                <a href={contactDetails.phone.href} className={primaryActionClass}>
                  <Phone className="size-4" aria-hidden="true" />
                  დარეკვა: {contactDetails.phone.label}
                </a>
              ) : null}
              {/* Pre-filled with the product, so the shop knows which item is asked about
                  without a back-and-forth. */}
              {product.isPurchasable && socialLinks.whatsapp ? (
                <a
                  href={`${socialLinks.whatsapp}?text=${encodeURIComponent(
                    `გამარჯობა, მაინტერესებს: ${product.name}\n${productUrl}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#25d366] px-6 text-sm font-semibold text-[#0b3d20] transition-colors hover:bg-[#1fbe5a] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
                >
                  <BrandIcon glyph="whatsapp" className="size-5" />
                  მოგვწერეთ WhatsApp-ში
                </a>
              ) : null}
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-ink/70 px-6 text-sm font-semibold text-ink transition-colors hover:border-forest hover:bg-mint hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                კონსულტანტთან დაკავშირება
              </Link>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <ShareLinks url={productUrl} title={product.name} />
            </div>

            {/* The condition block is the reason this schema exists: it comes before the
                general description so the real state of a used item is not buried.

                `unassessed` is styled deliberately differently — muted, not the confident
                green used for a real grade. It means "we have not checked this yet", and
                dressing it up like a rating would undo the honesty the grade exists for. */}
            {product.conditionGrade ? (
              <div
                className={`mt-6 rounded-md p-4 sm:p-5 ${
                  isUnassessed
                    ? "border border-dashed border-[#c9c4ba] bg-white"
                    : "bg-canvas"
                }`}
              >
                <h2 className="text-base font-bold text-ink sm:text-lg">
                  მდგომარეობა
                </h2>
                <p
                  className={`mt-3 text-base font-semibold ${
                    isUnassessed ? "text-[#6b6659]" : "text-forest"
                  }`}
                >
                  {product.conditionGrade.label_ka}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  {product.conditionGrade.description_ka}
                </p>
                {product.conditionSummary ? (
                  <p className="mt-4 max-w-[65ch] whitespace-pre-line border-t border-line pt-4 text-base leading-7 text-ink-muted">
                    {product.conditionSummary}
                  </p>
                ) : null}
              </div>
            ) : null}

            <ConditionAspectTable ratings={product.conditionAspects} />

            <ProductDimensionsTable dimensions={product.dimensions} />

            <ProductAttributes
              materials={product.materials}
              colours={product.colours}
              styles={product.styles}
            />

            <div className="mt-6">
              <h2 className="text-base font-bold text-ink sm:text-lg">
                პროდუქტის შესახებ
              </h2>
              <p className="mt-2 max-w-[65ch] whitespace-pre-line text-base leading-7 text-ink-muted">
                {product.description?.trim() ||
                  "აღწერა ჯერ არ არის დამატებული."}
              </p>
            </div>
          </section>
        </div>

        {product.category ? (
          <Suspense fallback={null}>
            <RelatedProducts
              categoryId={product.category.id}
              productId={product.id}
            />
          </Suspense>
        ) : null}
      </div>
    </main>
  );
}
