import type { PriceListItem } from "@/lib/storefront";

// Formatting for the public price feed (app/prices.csv): column values, CSV escaping and
// order. Pure — the buyable/discount decisions are already made by getPriceListItems via
// the storefront's deriveMerchandising, and are only rendered here.
//
// Headers are bilingual so anyone opening the sheet can read them. Cell values are
// Georgian only, in the site's own wording (product card, product page, dimensions table),
// because the Meta agent repeats them to customers: a value that already matches the site
// needs no translation, and one phrasing per fact leaves the agent nothing to choose
// between. Prices stay plain numbers so the sheet parses them as numbers.

const CSV_HEADER = [
  "Product / პროდუქტი",
  "Price (GEL) / ფასი (₾)",
  "Availability / მარაგი",
  "Notes / შენიშვნა",
];

const nameCollator = new Intl.Collator("ka");

// Plain number, dot decimal, no grouping: "1599", "295.50". Same whole-number rule as
// formatPrice in lib/storefront.ts, without the locale formatting or currency sign.
function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

// "Made to order" is deliberately absent: the schema has no field that expresses it.
function availability(item: PriceListItem) {
  return item.isPurchasable ? "მარაგშია" : "არ არის მარაგში";
}

// Labels and unit match components/product-dimensions-table.tsx.
function sizeNote({ dimensions }: PriceListItem) {
  const axes: [string, number | null][] = [
    ["სიგანე", dimensions.width_cm],
    ["სიგრძე", dimensions.length_cm],
    ["სიღრმე", dimensions.depth_cm],
    ["სიმაღლე", dimensions.height_cm],
  ];
  // Unmeasured axes are omitted, never printed as 0 — same rule as the product page.
  const measured = axes
    .filter((axis): axis is [string, number] => axis[1] !== null)
    .map(([label, value]) => `${label} ${value}`);
  return measured.length > 0 ? `ზომები: ${measured.join(" × ")} სმ` : null;
}

function conditionNote(item: PriceListItem) {
  if (item.listingKind === "new_stocked") return "ახალი";
  // `unassessed` is the absence of a rating, not a grade; ProductCard hides it too.
  const grade = item.conditionGrade;
  return grade && grade.code !== "unassessed"
    ? `მეორადი, მდგომარეობა: ${grade.label_ka}`
    : "მეორადი";
}

function notes(item: PriceListItem) {
  const parts: string[] = [];

  if (item.status === "reserved") parts.push("დაჯავშნილი");

  // showsDiscount is the storefront's own rule (≥5% and buyable), so the feed never
  // mentions a saving the product page does not show.
  if (item.showsDiscount && item.compareAtPrice !== null) {
    parts.push(
      `ძველი ფასი: ${formatAmount(item.compareAtPrice)} ₾ (-${item.discountPercent}%)`,
    );
  }

  parts.push(conditionNote(item));

  const size = sizeNote(item);
  if (size) parts.push(size);

  const dimensionNote = item.dimensions.note?.trim();
  if (dimensionNote) parts.push(dimensionNote);

  // Notes are our own formatting, so whitespace (including newlines from the free-text
  // dimension note) is collapsed to keep each sheet cell on one line. Product names are
  // NOT touched — they pass through exactly and rely on CSV quoting instead.
  return parts.join("; ").replace(/\s+/g, " ");
}

// RFC 4180: quote a field containing a comma, quote, CR or LF; double embedded quotes.
function escapeCsvField(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsvLine(fields: string[]) {
  return fields.map(escapeCsvField).join(",");
}

export function buildPriceListCsv(items: PriceListItem[]) {
  // Georgian collation by name; id breaks ties so listings sharing a name keep a stable
  // order between refreshes of the sheet.
  const sorted = [...items].sort(
    (a, b) => nameCollator.compare(a.name, b.name) || a.id.localeCompare(b.id),
  );

  const lines = [
    toCsvLine(CSV_HEADER),
    ...sorted.map((item) =>
      toCsvLine([
        item.name,
        formatAmount(item.price),
        availability(item),
        notes(item),
      ]),
    ),
  ];
  return lines.join("\r\n") + "\r\n";
}
