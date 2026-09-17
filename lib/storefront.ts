import "server-only";
import {
  createClient,
  type QueryData,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { cache } from "react";
import type { Database } from "@/lib/database.types";

export type CategoryImage = {
  id: string;
  sort_order: number;
  created_at: string;
};
export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  images: CategoryImage[];
  productCount: number;
};
export type ProductImage = {
  id: string;
  sort_order: number;
  created_at: string;
};
export type ProductStatus =
  | "draft"
  | "available"
  | "reserved"
  | "sold"
  | "archived";
export type ListingKind = "used_unique" | "new_stocked";

export type ConditionGrade = {
  code: string;
  sort_order: number;
  label_ka: string;
  label_en: string;
  description_ka: string;
};

export type ConditionAspectRating = {
  aspect_code: string;
  label_ka: string;
  description_ka: string;
  sort_order: number;
  grade: ConditionGrade | null;
  note: string | null;
};

// `image_id` is null for flaws with no meaningful photo — an odour, a slight wobble.
// The UI shows those as text-only rather than hiding them.
export type ProductFlaw = {
  id: string;
  image_id: string | null;
  flaw_type: string;
  severity: string;
  location_ka: string | null;
  note_ka: string;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  // The "was" price, or null when the item is not discounted. `price` is always what the
  // customer pays, so this is strictly greater when present (enforced by the CHECK).
  compareAtPrice: number | null;
  // Derived, never stored: storing it would be a third field that can disagree with the
  // two it comes from. Null exactly when compareAtPrice is.
  discountPercent: number | null;
  // Whether the comparison is safe to advertise. A sold or reserved item keeps its page as
  // social proof, but a struck-through price on something nobody can buy is a claim about
  // an offer that no longer exists.
  showsDiscount: boolean;
  created_at: string;
  // When the listing first became available — not created_at. See the column comment in
  // schemas/03_products.sql: a used item sits in `draft` while it is documented.
  publishedAt: string | null;
  isNewArrival: boolean;
  status: ProductStatus;
  listingKind: ListingKind;
  conditionGrade: ConditionGrade | null;
  conditionSummary: string | null;
  stockQuantity: number | null;
  isPurchasable: boolean;
  conditionAspects: ConditionAspectRating[];
  flaws: ProductFlaw[];
  dimensions: ProductDimensions;
  materials: ProductAttribute[];
  colours: ProductAttribute[];
  styles: ProductAttribute[];
  category: Category | null;
  images: ProductImage[];
};

// Materials, colours and styles. `hex` is present only on colours — a colour facet
// rendered as a list of words is a poor way to choose a colour.
export type ProductAttribute = {
  code: string;
  label_ka: string;
  sort_order: number;
  hex?: string;
};

// Null means "not measured", which is distinct from zero. The UI omits null rows rather
// than showing a dash, so an unmeasured piece does not look like a measured one.
export type ProductDimensions = {
  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;
  seat_height_cm: number | null;
  weight_kg: number | null;
  note: string | null;
};

// What a grid card renders, and nothing more. A card is not a small Product: it is a
// different, much cheaper shape that happens to share field names.
//
// The full Product drags eight embedded tables (images, flaws, condition aspects,
// materials, colours, styles, category, category images) through the RSC payload so a grid
// can print a name, a price and one photo. On a page of 24 that is thousands of joined rows
// serialized and discarded. ProductCardData is the subset the card actually reads.
export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number | null;
  showsDiscount: boolean;
  isNewArrival: boolean;
  status: ProductStatus;
  isPurchasable: boolean;
  // Label only — the card prints conditionGrade.label_ka and never the description.
  conditionGrade: { code: string; label_ka: string } | null;
  // Name only, for the eyebrow line above the title.
  categoryName: string | null;
  // The lead image alone. The card renders images[0] and ignores the rest, so the query
  // orders by (sort_order, created_at) and takes one instead of fetching the gallery.
  leadImageId: string | null;
};

// A page of results plus the total matching count.
//
// `total` is the count of everything matching the filters, NOT items.length — the two were
// the same only while the query was unbounded. The results line and the page count both
// read this.
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export type CatalogFilters = {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  materials?: string[];
  colours?: string[];
  styles?: string[];
  // 1-based. Clamped by toPageRange rather than validated here, so a junk param degrades to
  // page 1 instead of throwing.
  page?: number;
};

// Which facets are worth showing, and the vocabulary to show in each.
//
// Range and facet filters on nullable columns silently exclude every row that has no value
// — SQL cannot decide whether an unmeasured table "fits 40-200cm". On a catalogue where
// most products are untagged that means touching any filter empties the page. So each
// control is gated on how much of the available catalogue actually carries that data, and
// simply does not render until it would return something useful.
//
// The effect is that the filter bar grows by itself as products get tagged, rather than
// shipping a set of controls that are traps until the data catches up.
export type FacetAvailability = {
  totalAvailable: number;
  withDimensions: number;
  materials: ProductAttribute[];
  colours: ProductAttribute[];
  styles: ProductAttribute[];
  showDimensions: boolean;
  showMaterials: boolean;
  showColours: boolean;
  showStyles: boolean;
};

// A facet needs at least this share of the available catalogue behind it before it earns a
// control. Below it, filtering hides more than it reveals.
const FACET_COVERAGE_THRESHOLD = 0.3;
// ...and a catalogue this small is browsed, not filtered.
const FACET_MIN_PRODUCTS = 8;

// Statuses a storefront *list* may show. `sold` and `reserved` keep their detail pages
// (see supabase/SCHEMA_ROADMAP.md) but must never appear in browse or search results.
// `draft` and `archived` are additionally blocked by RLS, so this is defence in depth
// rather than the only guard.
const LISTABLE_STATUS: ProductStatus = "available";

// How long after publication a listing still counts as a new arrival.
//
// 21 days rather than 7: this catalogue gains a handful of items a month, so a one-week
// window would leave the badge absent most of the time and make its appearance read as a
// glitch rather than as information.
const NEW_ARRIVAL_DAYS = 21;
const NEW_ARRIVAL_MS = NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;

// Grid is 4 across at lg, 2 at min-[520px]. 24 divides by both, so the last row of a full
// page is never a ragged one or two cards at any breakpoint.
export const CATALOG_PAGE_SIZE = 24;

// How many product pages to prerender at build time. See getProductSlugs.
const PRERENDER_SLUG_LIMIT = 500;

// Sitemaps are capped at 50k URLs by the protocol; this is the per-request page size used
// to walk the table, not a limit on the sitemap itself.
const SITEMAP_PAGE_SIZE = 1000;

// PostgREST caps rows per request at `db-max-rows` (1000 on Supabase by default) and
// truncates silently — no error, just fewer products. Every unbounded list query below is
// written against that ceiling rather than trusting the catalogue to stay small.

// A discount small enough that announcing it looks worse than staying quiet — and rounding
// makes a 1% cut read as "-1%", which invites the question of why it was worth a badge.
const MIN_DISCOUNT_PERCENT = 5;

// MUST stay a plain string literal. Supabase's QueryData derives the row type from the
// literal passed to .select(), so building this with a function collapses every row to
// GenericStringError and normalizeProduct silently loses its typing — the exact "cast it
// away at the call site" failure this file was written to avoid.
//
// The attribute embeds are plain (no !inner) because an unfiltered catalogue must still
// return products that carry no materials, colours or styles. Facet filtering is handled
// by getProductIdsMatchingFacets below rather than by rewriting this constant.
const productSelection = `
  id,
  slug,
  name,
  description,
  price,
  compare_at_price,
  created_at,
  published_at,
  status,
  listing_kind,
  condition_summary,
  stock_quantity,
  width_cm,
  depth_cm,
  height_cm,
  seat_height_cm,
  weight_kg,
  dimension_note,
  conditionGrade:condition_grades!products_condition_grade_fkey (code, sort_order, label_ka, label_en, description_ka),
  conditionAspects:product_condition_aspects (
    aspect_code,
    note,
    aspect:condition_aspects (code, label_ka, description_ka, sort_order),
    grade:condition_grades (code, sort_order, label_ka, label_en, description_ka)
  ),
  flaws:product_flaws (id, image_id, flaw_type, severity, location_ka, note_ka, sort_order),
  materials:product_materials (material:materials (code, label_ka, sort_order)),
  colours:product_colours (colour:colours (code, label_ka, sort_order, hex)),
  styles:product_styles (style:styles (code, label_ka, sort_order)),
  category:categories!products_category_id_fkey (id, name, slug, description, images:category_images (id, sort_order, created_at)),
  images:product_images (id, sort_order, created_at)
`;

// The card query. Same literal-string rule as productSelection above — QueryData derives
// the row type from what is passed to .select(), so this cannot be built by a function.
//
// `images` still comes back as an array because PostgREST has no "limit one embedded row"
// that also keeps the ordering deterministic; the array is collapsed to its first element
// in normalizeProductCard. It is the one embed left, and it is three columns wide.
const productCardSelection = `
  id,
  slug,
  name,
  price,
  compare_at_price,
  published_at,
  status,
  listing_kind,
  stock_quantity,
  conditionGrade:condition_grades!products_condition_grade_fkey (code, label_ka),
  category:categories!products_category_id_fkey (name),
  images:product_images (id, sort_order, created_at)
`;

// Facet filtering as a separate id lookup, so productSelection can stay a literal.
//
// Each facet is its own !inner query and the results are intersected in JS: PostgREST ANDs
// filters across different embedded tables, but expressing "oak AND grey AND scandinavian"
// in one query means three !inner joins that also constrain what comes back in the
// embedded arrays. Two small queries keep the returned rows complete.
//
// Returns null when no facet is active, meaning "do not constrain by id".
async function getProductIdsMatchingFacets(
  supabase: ReturnType<typeof publicClient>,
  materials: string[],
  colours: string[],
  styles: string[],
): Promise<string[] | null> {
  if (materials.length === 0 && colours.length === 0 && styles.length === 0) {
    return null;
  }

  // Written out per table rather than looped over a descriptor list: the typed client
  // requires a literal table name, and abstracting over it collapses the row type to an
  // error union. Three near-identical blocks that type-check beat one loop that does not.
  const groups: Set<string>[] = [];

  if (materials.length > 0) {
    const { data, error } = await supabase
      .from("product_materials")
      .select("product_id")
      .in("material_code", materials);
    if (error)
      throw new Error("Catalog facets could not be loaded", { cause: error });
    groups.push(new Set((data ?? []).map((row) => String(row.product_id))));
  }

  if (colours.length > 0) {
    const { data, error } = await supabase
      .from("product_colours")
      .select("product_id")
      .in("colour_code", colours);
    if (error)
      throw new Error("Catalog facets could not be loaded", { cause: error });
    groups.push(new Set((data ?? []).map((row) => String(row.product_id))));
  }

  if (styles.length > 0) {
    const { data, error } = await supabase
      .from("product_styles")
      .select("product_id")
      .in("style_code", styles);
    if (error)
      throw new Error("Catalog facets could not be loaded", { cause: error });
    groups.push(new Set((data ?? []).map((row) => String(row.product_id))));
  }

  // AND across groups, OR within a group: "oak or walnut, in grey" is what people expect
  // from facets. reduce with no seed is safe here because groups is non-empty by the
  // guard above.
  return [
    ...groups.reduce((acc, set) => new Set([...acc].filter((id) => set.has(id)))),
  ];
}

// `products(count)` counts every related row regardless of status, so a category whose
// stock has all sold would still advertise its original count. The !inner hint plus the
// status filter below restricts the aggregate to listable products.
const categorySelection = `
  id,
  slug,
  name,
  description,
  images:category_images (id, sort_order, created_at),
  products!inner(count)
`;

// Categories are also fetched where the count is irrelevant (embedded inside a product, or
// for slug lists). !inner would drop empty categories there, so those paths use this.
const categorySelectionWithoutCount = `
  id,
  slug,
  name,
  description,
  images:category_images (id, sort_order, created_at)
`;

// Row types are derived from the queries themselves rather than hand-written, so a
// schema change surfaces here as a type error instead of being cast away at each call
// site. See supabase/README.md for how the generated types are refreshed.
function productQuery(supabase: SupabaseClient<Database>) {
  return supabase.from("products").select(productSelection);
}

function productCardQuery(supabase: SupabaseClient<Database>) {
  return supabase.from("products").select(productCardSelection);
}

function categoryQuery(supabase: SupabaseClient<Database>) {
  return supabase.from("categories").select(categorySelection);
}

type ProductRow = QueryData<ReturnType<typeof productQuery>>[number];
type ProductCardRow = QueryData<ReturnType<typeof productCardQuery>>[number];
type CategoryRow = QueryData<ReturnType<typeof categoryQuery>>[number];

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Supabase-ის გარემოს ცვლადები არ არის მითითებული");
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// A `page` query param is whatever the user typed, so it is clamped rather than trusted:
// "abc", "0", "-3" and "1e9" all have to resolve to a real page. Returns the 1-based page
// alongside the inclusive .range() bounds Supabase wants.
//
// Clamping only at the bottom, not the top: the total is not known until the query runs,
// so an over-large page returns zero rows and the page component decides what that means.
export function toPageRange(page: number, perPage = CATALOG_PAGE_SIZE) {
  const safePage =
    Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const from = (safePage - 1) * perPage;
  return { page: safePage, from, to: from + perPage - 1 };
}

// Parses a raw `?page=` value. Kept next to toPageRange so the two rules stay together.
export function parsePageParam(value: string | undefined) {
  const parsed = Number((value ?? "").trim());
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

export function normalizeSlug(value: string) {
  try {
    return decodeURIComponent(value).trim().normalize("NFC");
  } catch {
    return value.trim().normalize("NFC");
  }
}

function sortImages<T extends { sort_order: number; created_at: string }>(
  images: T[],
) {
  images.sort((a, b) => {
    return (
      a.sort_order - b.sort_order ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });
}

function normalizeCategory(row: CategoryRow): Category {
  const images = [...row.images];
  const productCount = Number(row.products[0]?.count ?? 0);
  sortImages(images);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    images,
    productCount,
  };
}

// Null unless the comparison is real and worth showing. Guards against a compare-at price
// that is not above the selling price even though the CHECK forbids it — this function also
// runs against rows written before that constraint existed, and a negative "discount" would
// render as a saving.
function getDiscountPercent(price: number, compareAtPrice: number | null) {
  if (compareAtPrice === null) return null;
  if (!Number.isFinite(compareAtPrice) || compareAtPrice <= price) return null;

  const percent = Math.round((1 - price / compareAtPrice) * 100);
  return percent >= MIN_DISCOUNT_PERCENT ? percent : null;
}

// The merchandising rules, in one place because two code paths now render badges.
//
// Card and detail page must agree on what counts as buyable, discounted or new — a grid
// that shows "-20%" next to a detail page that does not is worse than either rule alone.
// Both normalizers call this rather than restating the conditions.
function deriveMerchandising(row: {
  price: number | string;
  compare_at_price: number | string | null;
  status: string;
  listing_kind: string;
  stock_quantity: number | string | null;
  published_at: string | null;
}) {
  const price = Number(row.price);
  const compareAtPrice =
    row.compare_at_price === null ? null : Number(row.compare_at_price);
  const discountPercent = getDiscountPercent(price, compareAtPrice);
  // A used item is one physical object, so `available` is the whole story. A new item
  // additionally needs stock on hand — status alone would let a zero-stock row through.
  const isPurchasable =
    row.status === "available" &&
    (row.listing_kind === "used_unique" || Number(row.stock_quantity ?? 0) > 0);
  const publishedAt = row.published_at ? String(row.published_at) : null;
  const publishedTime = publishedAt ? new Date(publishedAt).getTime() : NaN;

  return {
    price,
    compareAtPrice,
    discountPercent,
    isPurchasable,
    publishedAt,
    // Suppressed on anything that cannot be bought. A sold listing keeps its page, but
    // "was 820, now 640" on it advertises an offer that has expired — and the sold notice
    // sitting next to a saving reads as a taunt rather than as social proof.
    showsDiscount: discountPercent !== null && isPurchasable,
    // Only a buyable listing can be a new arrival: a reserved or sold item is not something
    // that just arrived for the customer, whatever its timestamp says.
    isNewArrival:
      isPurchasable &&
      Number.isFinite(publishedTime) &&
      Date.now() - publishedTime <= NEW_ARRIVAL_MS,
  };
}

function normalizeProductCard(row: ProductCardRow): ProductCardData {
  const merchandising = deriveMerchandising(row);
  // Sorted with the same rule as the full product rather than trusting PostgREST's order,
  // so the card's photo is always the one the gallery leads with.
  const images = [...row.images];
  sortImages(images);
  const grade = row.conditionGrade;

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    price: merchandising.price,
    compareAtPrice: merchandising.compareAtPrice,
    discountPercent: merchandising.discountPercent,
    showsDiscount: merchandising.showsDiscount,
    isNewArrival: merchandising.isNewArrival,
    status: String(row.status) as ProductStatus,
    isPurchasable: merchandising.isPurchasable,
    conditionGrade: grade
      ? { code: String(grade.code), label_ka: String(grade.label_ka) }
      : null,
    categoryName: row.category ? String(row.category.name) : null,
    leadImageId: images[0] ? String(images[0].id) : null,
  };
}

function normalizeProduct(row: ProductRow): Product {
  const category = row.category ?? null;
  const images = [...row.images];
  const status = String(row.status) as ProductStatus;
  const grade = row.conditionGrade;
  sortImages(images);

  const {
    price,
    compareAtPrice,
    discountPercent,
    isPurchasable,
    publishedAt,
    showsDiscount,
    isNewArrival,
  } = deriveMerchandising(row);

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    price,
    compareAtPrice,
    discountPercent,
    showsDiscount,
    created_at: String(row.created_at),
    publishedAt,
    isNewArrival,
    status,
    listingKind: String(row.listing_kind) as ListingKind,
    conditionGrade: grade
      ? {
          code: String(grade.code),
          sort_order: Number(grade.sort_order),
          label_ka: String(grade.label_ka),
          label_en: String(grade.label_en),
          description_ka: String(grade.description_ka),
        }
      : null,
    conditionSummary: row.condition_summary
      ? String(row.condition_summary)
      : null,
    stockQuantity:
      row.stock_quantity === null ? null : Number(row.stock_quantity),
    isPurchasable,
    conditionAspects: (row.conditionAspects ?? [])
      .map((rating) => ({
        aspect_code: String(rating.aspect_code),
        label_ka: rating.aspect ? String(rating.aspect.label_ka) : String(rating.aspect_code),
        description_ka: rating.aspect ? String(rating.aspect.description_ka) : "",
        sort_order: rating.aspect ? Number(rating.aspect.sort_order) : 0,
        grade: rating.grade
          ? {
              code: String(rating.grade.code),
              sort_order: Number(rating.grade.sort_order),
              label_ka: String(rating.grade.label_ka),
              label_en: String(rating.grade.label_en),
              description_ka: String(rating.grade.description_ka),
            }
          : null,
        note: rating.note ? String(rating.note) : null,
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
    flaws: (row.flaws ?? [])
      .map((flaw) => ({
        id: String(flaw.id),
        image_id: flaw.image_id ? String(flaw.image_id) : null,
        flaw_type: String(flaw.flaw_type),
        severity: String(flaw.severity),
        location_ka: flaw.location_ka ? String(flaw.location_ka) : null,
        note_ka: String(flaw.note_ka),
        sort_order: Number(flaw.sort_order),
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
    // Each join row wraps a single lookup object. Rows whose lookup failed to resolve are
    // dropped rather than rendered as blanks.
    materials: (row.materials ?? [])
      .map((entry) => entry.material)
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .map((m) => ({
        code: String(m.code),
        label_ka: String(m.label_ka),
        sort_order: Number(m.sort_order),
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
    colours: (row.colours ?? [])
      .map((entry) => entry.colour)
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => ({
        code: String(c.code),
        label_ka: String(c.label_ka),
        sort_order: Number(c.sort_order),
        hex: String(c.hex),
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
    styles: (row.styles ?? [])
      .map((entry) => entry.style)
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => ({
        code: String(s.code),
        label_ka: String(s.label_ka),
        sort_order: Number(s.sort_order),
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
    // Guarded per field: Number(null) is 0, which would turn "not measured" into a
    // measurement of zero.
    dimensions: {
      width_cm: row.width_cm === null ? null : Number(row.width_cm),
      depth_cm: row.depth_cm === null ? null : Number(row.depth_cm),
      height_cm: row.height_cm === null ? null : Number(row.height_cm),
      seat_height_cm:
        row.seat_height_cm === null ? null : Number(row.seat_height_cm),
      weight_kg: row.weight_kg === null ? null : Number(row.weight_kg),
      note: row.dimension_note ? String(row.dimension_note) : null,
    },
    // The embedded category carries no products(count) aggregate, so it normalizes to a
    // productCount of 0. Callers that need the real count fetch the category directly.
    category: category ? normalizeCategory({ ...category, products: [] }) : null,
    images,
  };
}

export async function getHomeCategories(): Promise<Category[]> {
  const { data, error } = await publicClient()
    .from("categories")
    .select(categorySelection)
    .eq("products.status", LISTABLE_STATUS)
    .order("name", { ascending: true });
  if (error)
    throw new Error("კატალოგის ჩატვირთვა ვერ მოხერხდა", { cause: error });
  return (data ?? []).map(normalizeCategory);
}

export async function getCategorySlugs(): Promise<string[]> {
  const { data, error } = await publicClient()
    .from("categories")
    .select("slug")
    .order("name", { ascending: true });
  if (error)
    throw new Error("Category slugs could not be loaded", { cause: error });
  return (data ?? []).map((row) => String(row.slug));
}

export async function getNewestProducts(
  limit = 8,
): Promise<ProductCardData[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select(productCardSelection)
    .eq("status", LISTABLE_STATUS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);
  if (error)
    throw new Error("პროდუქტების ჩატვირთვა ვერ მოხერხდა", { cause: error });
  return (data ?? []).map(normalizeProductCard);
}

// Feeds generateStaticParams. Deliberately available-only: sold products keep working
// pages, but prerendering every product ever sold would grow without bound. Their pages
// render on demand instead.
//
// Explicitly capped: past this many products, prerendering them all costs more build time
// than it saves, and the newest are the ones that get traffic. Products beyond the cap
// still render on demand — this only decides what is built ahead of time. The cap also
// keeps the request under PostgREST's silent 1000-row ceiling.
export async function getProductSlugs(): Promise<string[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select("slug")
    .eq("status", LISTABLE_STATUS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(0, PRERENDER_SLUG_LIMIT - 1);
  if (error)
    throw new Error("Product slugs could not be loaded", { cause: error });
  return (data ?? []).map((row) => String(row.slug));
}

// Sitemap feed. Unlike every other list query this does NOT filter to `available`: sold
// listings keep their pages and should stay indexed. `draft` and `archived` are excluded
// by RLS rather than here.
//
// Carries the first image so sitemap entries keep their <image:image> tag. Only the
// lead image is needed, but sort_order/created_at come along because the ordering rule
// lives in sortImages rather than in the query.
export async function getSitemapProducts(): Promise<
  {
    slug: string;
    created_at: string;
    status: ProductStatus;
    images: ProductImage[];
  }[]
> {
  const supabase = publicClient();
  const rows: {
    slug: string;
    created_at: string;
    status: ProductStatus;
    images: ProductImage[];
  }[] = [];

  // Walks the table in pages instead of asking for everything at once. A single unbounded
  // request is capped at db-max-rows and truncated *silently*, which would drop the oldest
  // products out of the sitemap with no error to notice. The loop stops on the first short
  // page, so a small catalogue still costs exactly one request.
  for (let offset = 0; ; offset += SITEMAP_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("products")
      .select(
        "slug, created_at, status, images:product_images (id, sort_order, created_at)",
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + SITEMAP_PAGE_SIZE - 1);

    if (error)
      throw new Error("Sitemap products could not be loaded", { cause: error });

    const batch = data ?? [];
    for (const row of batch) {
      const images = [...row.images];
      sortImages(images);
      rows.push({
        slug: String(row.slug),
        created_at: String(row.created_at),
        status: String(row.status) as ProductStatus,
        images,
      });
    }

    if (batch.length < SITEMAP_PAGE_SIZE) break;
  }

  return rows;
}

async function getCategoryIdBySlug(
  supabase: ReturnType<typeof publicClient>,
  categorySlug: string,
) {
  const normalizedCategorySlug = normalizeSlug(categorySlug);
  if (!normalizedCategorySlug) return null;

  const { data: category, error } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", normalizedCategorySlug)
    .maybeSingle();

  if (error) {
    throw new Error("Catalog category could not be loaded", { cause: error });
  }

  return category ? String(category.id) : "";
}

export async function getMaxProductPrice(categorySlug = "") {
  const supabase = publicClient();
  const categoryId = await getCategoryIdBySlug(supabase, categorySlug);
  if (categoryId === "") return 0;

  let query = supabase
    .from("products")
    .select("price")
    .eq("status", LISTABLE_STATUS)
    .order("price", { ascending: false })
    .limit(1);

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error("Max product price could not be loaded", { cause: error });
  }

  return data ? Number(data.price) : 0;
}

// Reports which facets have enough data behind them to be worth rendering. Runs three
// small count queries plus the vocabularies; cheap enough to do per page load.
export async function getFacetAvailability(
  categorySlug = "",
): Promise<FacetAvailability> {
  const supabase = publicClient();
  const categoryId = await getCategoryIdBySlug(supabase, categorySlug);

  const empty: FacetAvailability = {
    totalAvailable: 0,
    withDimensions: 0,
    materials: [],
    colours: [],
    styles: [],
    showDimensions: false,
    showMaterials: false,
    showColours: false,
    showStyles: false,
  };

  if (categoryId === "") return empty;

  let totalQuery = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", LISTABLE_STATUS);
  let dimsQuery = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", LISTABLE_STATUS)
    .not("width_cm", "is", null);

  if (categoryId) {
    totalQuery = totalQuery.eq("category_id", categoryId);
    dimsQuery = dimsQuery.eq("category_id", categoryId);
  }

  const [
    totalResult,
    dimsResult,
    materialRows,
    colourRows,
    styleRows,
    taggedMaterials,
    taggedColours,
    taggedStyles,
  ] = await Promise.all([
    totalQuery,
    dimsQuery,
    supabase.from("materials").select("code, label_ka, sort_order").order("sort_order"),
    supabase
      .from("colours")
      .select("code, label_ka, sort_order, hex")
      .order("sort_order"),
    supabase.from("styles").select("code, label_ka, sort_order").order("sort_order"),
    // How many products actually carry each attribute. The vocabulary being populated says
    // nothing about coverage — seeding 17 materials while tagging zero products would
    // otherwise render a facet that empties the catalogue on first click.
    supabase
      .from("product_materials")
      .select("product_id", { count: "exact", head: true }),
    supabase
      .from("product_colours")
      .select("product_id", { count: "exact", head: true }),
    supabase
      .from("product_styles")
      .select("product_id", { count: "exact", head: true }),
  ]);

  const totalAvailable = totalResult.count ?? 0;
  const withDimensions = dimsResult.count ?? 0;

  // A catalogue this small is browsed, not filtered.
  const bigEnough = totalAvailable >= FACET_MIN_PRODUCTS;

  // Join-row counts are an upper bound on tagged products (one product may carry several
  // materials), which is the safe direction: it can only under-estimate coverage and hide
  // a facet that might have been shown, never show one that empties the page.
  const covered = (count: number | null) =>
    bigEnough &&
    totalAvailable > 0 &&
    (count ?? 0) / totalAvailable >= FACET_COVERAGE_THRESHOLD;

  return {
    totalAvailable,
    withDimensions,
    materials: (materialRows.data ?? []).map((row) => ({
      code: String(row.code),
      label_ka: String(row.label_ka),
      sort_order: Number(row.sort_order),
    })),
    colours: (colourRows.data ?? []).map((row) => ({
      code: String(row.code),
      label_ka: String(row.label_ka),
      sort_order: Number(row.sort_order),
      hex: String(row.hex),
    })),
    styles: (styleRows.data ?? []).map((row) => ({
      code: String(row.code),
      label_ka: String(row.label_ka),
      sort_order: Number(row.sort_order),
    })),
    showDimensions:
      bigEnough &&
      totalAvailable > 0 &&
      withDimensions / totalAvailable >= FACET_COVERAGE_THRESHOLD,
    showMaterials:
      covered(taggedMaterials.count) && (materialRows.data ?? []).length > 0,
    showColours:
      covered(taggedColours.count) && (colourRows.data ?? []).length > 0,
    showStyles: covered(taggedStyles.count) && (styleRows.data ?? []).length > 0,
  };
}

export async function getCatalogProducts({
  search = "",
  categorySlug = "",
  minPrice = 0,
  maxPrice,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  materials = [],
  colours = [],
  styles = [],
  page = 1,
}: CatalogFilters = {}): Promise<PaginatedResult<ProductCardData>> {
  const { page: safePage, from, to } = toPageRange(page);
  const empty: PaginatedResult<ProductCardData> = {
    items: [],
    total: 0,
    page: safePage,
    perPage: CATALOG_PAGE_SIZE,
    pageCount: 0,
  };

  const supabase = publicClient();
  const categoryId = await getCategoryIdBySlug(supabase, categorySlug);
  if (categoryId === "") return empty;

  // Facets resolve to a set of ids first, so productSelection can stay a string literal
  // and keep its inferred row type. An empty result here means "nothing matches", which is
  // different from null ("no facet active") and must short-circuit rather than fall
  // through to an unfiltered query.
  const facetIds = await getProductIdsMatchingFacets(
    supabase,
    materials,
    colours,
    styles,
  );

  if (facetIds !== null && facetIds.length === 0) return empty;

  // Every filter except the facet ids, applied to whichever query is passed in. Generic over
  // the builder type so the same rules serve both the page fetch and the count below — the
  // two disagreeing about what "matching" means is exactly how a pager ends up advertising
  // pages that turn out to be empty.
  const applyFilters = <T extends {
    gte: (c: string, v: number) => T;
    lte: (c: string, v: number) => T;
    ilike: (c: string, v: string) => T;
    eq: (c: string, v: string) => T;
    in: (c: string, v: string[]) => T;
  }>(builder: T): T => {
    let next = builder;
    if (facetIds !== null) next = next.in("id", facetIds);

    // Dimension ranges exclude unmeasured products by necessity — see FacetAvailability.
    if (minWidth !== undefined && Number.isFinite(minWidth))
      next = next.gte("width_cm", minWidth);
    if (maxWidth !== undefined && Number.isFinite(maxWidth))
      next = next.lte("width_cm", maxWidth);
    if (minHeight !== undefined && Number.isFinite(minHeight))
      next = next.gte("height_cm", minHeight);
    if (maxHeight !== undefined && Number.isFinite(maxHeight))
      next = next.lte("height_cm", maxHeight);

    const normalizedSearch = search.trim().slice(0, 100);
    const normalizedMinPrice = Number.isFinite(minPrice)
      ? Math.max(0, Number(minPrice))
      : 0;
    const normalizedMaxPrice =
      maxPrice !== undefined && Number.isFinite(maxPrice)
        ? Math.max(0, Number(maxPrice))
        : undefined;

    if (normalizedSearch) next = next.ilike("name", `%${normalizedSearch}%`);
    if (categoryId) next = next.eq("category_id", categoryId);
    if (normalizedMinPrice > 0) next = next.gte("price", normalizedMinPrice);
    if (normalizedMaxPrice !== undefined)
      next = next.lte("price", normalizedMaxPrice);

    return next;
  };

  // `count: "exact"` rather than "planned"/"estimated": the results line states a number to
  // the customer and the pager derives its last page from it, so an estimate that drifts
  // would produce pages that do not exist. Exact counts are a sequential scan on the
  // filtered set, which the partial indexes keep cheap at this catalogue's size.
  //
  // The (created_at desc, id asc) pair is a stable total order, which is what makes offset
  // paging correct: ordering by created_at alone leaves rows sharing a timestamp free to
  // swap between requests, which duplicates one row onto page 2 and drops another entirely.
  const { data, error, count } = await applyFilters(
    supabase
      .from("products")
      .select(productCardSelection, { count: "exact" })
      .eq("status", LISTABLE_STATUS),
  )
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    // PGRST103 ("Requested range not satisfiable") is what PostgREST returns when a counted
    // query's offset lands past the end of the result set — i.e. a `?page=` beyond the last
    // page. That is a normal thing for someone to do, not a failure: a bookmarked page 9
    // after stock shrank, or a hand-edited URL. Reporting "could not load" for what is
    // really just an empty page would be wrong, so it resolves to zero items instead.
    //
    // Verified against PostgREST rather than assumed: the error only fires when a count is
    // requested AND the range is past the end; the same range without a count returns an
    // empty array. The count is null on this response, so it is re-fetched head-only to
    // tell "empty page, results behind it" apart from "nothing matches at all".
    if (error.code !== "PGRST103") {
      throw new Error("Products could not be loaded", { cause: error });
    }

    const { count: fallbackCount, error: countError } = await applyFilters(
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", LISTABLE_STATUS),
    );

    // A failure here only costs the "go back to page 1" wording, so it degrades to the
    // plain empty state rather than propagating.
    return { ...empty, total: countError ? 0 : (fallbackCount ?? 0) };
  }

  const total = count ?? 0;

  return {
    items: (data ?? []).map(normalizeProductCard),
    total,
    page: safePage,
    perPage: CATALOG_PAGE_SIZE,
    pageCount: Math.ceil(total / CATALOG_PAGE_SIZE),
  };
}

// NO status filter, deliberately: a sold or reserved item keeps its page. RLS still hides
// `draft` and `archived`, which surface here as a null and therefore a 404.
export const getProductBySlug = cache(
  async (slug: string): Promise<Product | null> => {
    const normalizedSlug = normalizeSlug(slug);
    const { data, error } = await publicClient()
      .from("products")
      .select(productSelection)
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (error) {
      throw new Error("პროდუქტის ჩატვირთვა ვერ მოხერხდა", { cause: error });
    }

    return data ? normalizeProduct(data) : null;
  },
);

// Uses the count-free selection: !inner would 404 a category whose products are all sold,
// and the category page must still render (its product grid shows the empty state).
export const getCategoryBySlug = cache(
  async (slug: string): Promise<Category | null> => {
    const normalizedSlug = normalizeSlug(slug);
    const { data, error } = await publicClient()
      .from("categories")
      .select(categorySelectionWithoutCount)
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (error) {
      throw new Error("Category could not be loaded", { cause: error });
    }

    // categorySelectionWithoutCount carries no aggregate, so productCount normalizes to 0.
    // The category page renders its own product grid and never reads this field.
    return data ? normalizeCategory({ ...data, products: [] }) : null;
  },
);

export function formatPrice(value: number) {
  const formatted = new Intl.NumberFormat("ka-GE", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ₾`;
}
