import { toCsv } from "@/lib/csv";
import { productPageUrl, stripTags, truncate } from "@/lib/feed-format";
import { absoluteUrl, siteName } from "@/lib/site";
import type { FeedProduct } from "@/lib/storefront";

// Meta Commerce Manager catalog data feed (app/api/meta-feed.csv). Field names and value
// vocabularies are Meta's: https://www.facebook.com/business/help/120325381656392
//
// Pure formatting. What is buyable or discounted was decided by getFeedProducts via the
// storefront's deriveMerchandising, so the catalog matches the product page — Meta flags
// items whose price or availability disagrees with the landing page.

const FEED_HEADER = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "sale_price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "product_type",
];

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 9999;
const ADDITIONAL_IMAGES_MAX = 10;

// Line breaks are kept, as the site shows them; Meta accepts them in a quoted field.
function plainText(value: string) {
  return stripTags(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatPrice(value: number) {
  return `${value.toFixed(2)} GEL`;
}

function productImageUrl(imageId: string) {
  return absoluteUrl(`/api/product-images/${imageId}`);
}

function toFeedRow(item: FeedProduct, leadImageId: string) {
  const title = truncate(item.name.trim(), TITLE_MAX);
  const description =
    truncate(plainText(item.description ?? ""), DESCRIPTION_MAX) || title;

  // A sale price only when the product page shows one (showsDiscount: ≥5% and buyable).
  // A smaller or non-buyable "discount" renders as a single price on the site, so it must
  // be a single price here too.
  const onSale = item.showsDiscount && item.compareAtPrice !== null;

  return [
    item.id,
    title,
    description,
    item.isPurchasable ? "in stock" : "out of stock",
    item.listingKind === "new_stocked" ? "new" : "used",
    formatPrice(onSale ? item.compareAtPrice! : item.price),
    onSale ? formatPrice(item.price) : "",
    productPageUrl(item.slug),
    productImageUrl(leadImageId),
    item.imageIds
      .slice(1, 1 + ADDITIONAL_IMAGES_MAX)
      .map(productImageUrl)
      .join(","),
    siteName,
    item.categoryName ?? "",
  ];
}

export function buildMetaFeedCsv(items: FeedProduct[]) {
  // Meta rejects items without an image, so they are left out rather than sent to fail.
  const rows = items.flatMap((item) => {
    const leadImageId = item.imageIds[0];
    return leadImageId ? [toFeedRow(item, leadImageId)] : [];
  });
  return toCsv([FEED_HEADER, ...rows]);
}
