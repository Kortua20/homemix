import { toCsv } from "@/lib/csv";
import {
  formatAmount,
  productPageUrl,
  stripTags,
  truncate,
} from "@/lib/feed-format";
import type { FeedProduct } from "@/lib/storefront";

// Product knowledge file for the Meta Business Agent (app/prices.csv). A Google Sheet pulls
// it with IMPORTDATA and the agent reads the sheet as plain text — no images, no links
// followed — so everything it should be able to answer has to be in these cells.
//
// Pure formatting. The buyable/discount decisions were made by getFeedProducts via the
// storefront's deriveMerchandising, so the agent never quotes a price or saving the product
// page does not show.
//
// Headers are bilingual so the agent and anyone opening the sheet can read them. Enumerated
// values carry an English gloss for the agent; free text (names, descriptions, attribute
// labels) stays in the site's Georgian wording, because the agent repeats it to customers.
//
// Every cell is a single line: IMPORTDATA and the agent both read line breaks inside a
// quoted field as a new row. Prices stay plain numbers so the sheet parses them as numbers.

const CSV_HEADER = [
  "Product / პროდუქტი",
  "Category / კატეგორია",
  "Price (GEL) / ფასი (₾)",
  "Old price (GEL) / ძველი ფასი (₾)",
  "Discount / ფასდაკლება",
  "Condition / მდგომარეობა",
  "Availability / მარაგი",
  "Dimensions / ზომები",
  "Material / მასალა",
  "Color / ფერი",
  "Description / აღწერა",
  "Link / ბმული",
];

const DESCRIPTION_MAX = 500;
const CONDITION_SUMMARY_MAX = 300;

// Store-wide facts for the agent, as one trailing row. Both are stated on the site itself:
// the homepage delivery banner (app/page.tsx) and the footer payment block
// (components/footer.tsx). Update this when either of those changes.
const INFO_PRODUCT = "ინფორმაცია / Info";
const INFO_DESCRIPTION =
  "უფასო მიწოდება თბილისში. განვადება საქართველოს ბანკით.";

const georgianCollator = new Intl.Collator("ka");

// Collapses every run of whitespace, line breaks included, to one space.
function oneLine(value: string) {
  return stripTags(value).replace(/\s+/g, " ").trim();
}

// Cuts at the last space before `max` so a word is never split; a single overlong word
// (no space in the back half) is cut mid-word rather than losing most of the text.
function truncateAtWord(value: string, max: number) {
  if (Array.from(value).length <= max) return value;
  const head = truncate(value, max);
  const lastSpace = head.lastIndexOf(" ");
  const cut = lastSpace > head.length / 2 ? head.slice(0, lastSpace) : head;
  return `${cut.replace(/[\s.,;:–—-]+$/, "")}…`;
}

// "-14% (1400 → 1200 ₾)". Only when the product page shows the saving (showsDiscount:
// ≥5% and buyable), so the agent never mentions a discount the customer cannot see.
function discountedFrom(item: FeedProduct) {
  return item.showsDiscount && item.compareAtPrice !== null
    ? item.compareAtPrice
    : null;
}

function discountLabel(item: FeedProduct, oldPrice: number | null) {
  if (oldPrice === null) return "";
  return `-${item.discountPercent}% (${formatAmount(oldPrice)} → ${formatAmount(item.price)} ₾)`;
}

function condition(item: FeedProduct) {
  if (item.listingKind === "new_stocked") return "ახალი (new)";

  let text = "მეორადი (used)";
  // `unassessed` is the absence of a rating, not a grade; ProductCard hides it too.
  const grade = item.conditionGrade;
  if (grade && grade.code !== "unassessed") text += `, შეფასება: ${grade.label_ka}`;

  // What the product page shows under the grade — wear, repairs, flaws in words.
  const summary = oneLine(item.conditionSummary ?? "");
  if (summary) text += `. ${truncateAtWord(summary, CONDITION_SUMMARY_MAX)}`;

  return text;
}

// A reserved item is not buyable, so it is out of stock here — same rule as the site.
function availability(item: FeedProduct) {
  return item.isPurchasable
    ? "მარაგშია (in stock)"
    : "არ არის მარაგში (out of stock)";
}

// 180 rather than 180.0, but 74.5 keeps its half — same rounding as the product page.
function formatMeasure(value: number) {
  return String(Math.round(value * 10) / 10);
}

// Labels and units match components/product-dimensions-table.tsx. Unmeasured fields are
// omitted, never printed as 0 — same rule as the product page.
function dimensions({ dimensions: d }: FeedProduct) {
  const measured = (
    [
      ["სიგანე", d.width_cm, "სმ"],
      ["სიგრძე", d.length_cm, "სმ"],
      ["სიღრმე", d.depth_cm, "სმ"],
      ["სიმაღლე", d.height_cm, "სმ"],
      ["ჯდომის სიმაღლე", d.seat_height_cm, "სმ"],
      ["წონა", d.weight_kg, "კგ"],
    ] as const
  )
    .filter(([, value]) => value !== null)
    .map(([label, value, unit]) => `${label} ${formatMeasure(value!)} ${unit}`);

  const note = oneLine(d.note ?? "");
  return [measured.join(", "), note].filter(Boolean).join("; ");
}

function toRow(item: FeedProduct) {
  const oldPrice = discountedFrom(item);
  return [
    // Names pass through unchanged apart from line breaks, so the agent quotes them exactly
    // as the site does; commas and quotes are handled by CSV quoting.
    item.name.replace(/\s*[\r\n]+\s*/g, " ").trim(),
    item.categoryName ?? "",
    formatAmount(item.price),
    oldPrice === null ? "" : formatAmount(oldPrice),
    discountLabel(item, oldPrice),
    condition(item),
    availability(item),
    dimensions(item),
    item.materials.join(", "),
    item.colours.join(", "),
    truncateAtWord(oneLine(item.description ?? ""), DESCRIPTION_MAX),
    productPageUrl(item.slug),
  ];
}

function infoRow() {
  const row: string[] = CSV_HEADER.map(() => "");
  row[0] = INFO_PRODUCT;
  row[CSV_HEADER.indexOf("Description / აღწერა")] = INFO_DESCRIPTION;
  return row;
}

// By category (Georgian collation; uncategorised last), then price ascending. Name and id
// break ties so listings sharing a name keep a stable order between sheet refreshes.
function compareCategory(a: string | null, b: string | null) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return georgianCollator.compare(a, b);
}

function compareItems(a: FeedProduct, b: FeedProduct) {
  return (
    compareCategory(a.categoryName, b.categoryName) ||
    a.price - b.price ||
    georgianCollator.compare(a.name, b.name) ||
    a.id.localeCompare(b.id)
  );
}

export function buildPriceListCsv(items: FeedProduct[]) {
  const sorted = [...items].sort(compareItems);
  return toCsv([CSV_HEADER, ...sorted.map(toRow), infoRow()]);
}
