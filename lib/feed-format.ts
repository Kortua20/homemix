import { absoluteUrl } from "@/lib/site";

// Value formatting shared by the public feeds (app/prices.csv, app/api/meta-feed.csv).
// CSV serialization itself lives in lib/csv.ts.

// By code point, so an emoji or a Georgian letter is never cut in half.
export function truncate(value: string, max: number) {
  const chars = Array.from(value);
  return chars.length > max ? chars.slice(0, max).join("") : value;
}

// Descriptions are stored and rendered as plain text (whitespace-pre-line on the product
// page), so this is defensive. Only real tags are stripped — `<` followed by a letter or
// `/` — so text like "სიგანე < 2 მ" survives.
export function stripTags(value: string) {
  return value.replace(/<\/?[a-zA-Z][^>]*>/g, " ");
}

// Plain number, dot decimal, no grouping: "1599", "295.50", "849.99". Whole numbers drop
// the decimals, as formatPrice in lib/storefront.ts does.
export function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

// Same URL shape as the product page's canonical and the sitemap.
export function productPageUrl(slug: string) {
  return absoluteUrl(`/product/${encodeURIComponent(slug)}`);
}
