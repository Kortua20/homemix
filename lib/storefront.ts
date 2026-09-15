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
  created_at: string;
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
  created_at,
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

function categoryQuery(supabase: SupabaseClient<Database>) {
  return supabase.from("categories").select(categorySelection);
}

type ProductRow = QueryData<ReturnType<typeof productQuery>>[number];
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

function normalizeProduct(row: ProductRow): Product {
  const category = row.category ?? null;
  const images = [...row.images];
  const status = String(row.status) as ProductStatus;
  const grade = row.conditionGrade;
  sortImages(images);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    price: Number(row.price),
    created_at: String(row.created_at),
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
    // A used item is one physical object, so `available` is the whole story. A new item
    // additionally needs stock on hand — status alone would let a zero-stock row through.
    isPurchasable:
      status === "available" &&
      (row.listing_kind === "used_unique" || Number(row.stock_quantity ?? 0) > 0),
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

export async function getNewestProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select(productSelection)
    .eq("status", LISTABLE_STATUS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error)
    throw new Error("პროდუქტების ჩატვირთვა ვერ მოხერხდა", { cause: error });
  return (data ?? []).map(normalizeProduct);
}

// Feeds generateStaticParams. Deliberately available-only: sold products keep working
// pages, but prerendering every product ever sold would grow without bound. Their pages
// render on demand instead.
export async function getProductSlugs(): Promise<string[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select("slug")
    .eq("status", LISTABLE_STATUS)
    .order("created_at", { ascending: false });
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
  const { data, error } = await publicClient()
    .from("products")
    .select(
      "slug, created_at, status, images:product_images (id, sort_order, created_at)",
    )
    .order("created_at", { ascending: false });
  if (error)
    throw new Error("Sitemap products could not be loaded", { cause: error });
  return (data ?? []).map((row) => {
    const images = [...row.images];
    sortImages(images);
    return {
      slug: String(row.slug),
      created_at: String(row.created_at),
      status: String(row.status) as ProductStatus,
      images,
    };
  });
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
}: CatalogFilters = {}): Promise<Product[]> {
  const supabase = publicClient();
  const categoryId = await getCategoryIdBySlug(supabase, categorySlug);
  if (categoryId === "") return [];

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

  if (facetIds !== null && facetIds.length === 0) return [];

  let query = supabase
    .from("products")
    .select(productSelection)
    .eq("status", LISTABLE_STATUS);

  if (facetIds !== null) query = query.in("id", facetIds);

  // Dimension ranges exclude unmeasured products by necessity — see FacetAvailability.
  if (minWidth !== undefined && Number.isFinite(minWidth))
    query = query.gte("width_cm", minWidth);
  if (maxWidth !== undefined && Number.isFinite(maxWidth))
    query = query.lte("width_cm", maxWidth);
  if (minHeight !== undefined && Number.isFinite(minHeight))
    query = query.gte("height_cm", minHeight);
  if (maxHeight !== undefined && Number.isFinite(maxHeight))
    query = query.lte("height_cm", maxHeight);

  const normalizedSearch = search.trim().slice(0, 100);
  const normalizedMinPrice = Number.isFinite(minPrice)
    ? Math.max(0, Number(minPrice))
    : 0;
  const normalizedMaxPrice =
    maxPrice !== undefined && Number.isFinite(maxPrice)
      ? Math.max(0, Number(maxPrice))
      : undefined;

  if (normalizedSearch) query = query.ilike("name", `%${normalizedSearch}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (normalizedMinPrice > 0) query = query.gte("price", normalizedMinPrice);
  if (normalizedMaxPrice !== undefined)
    query = query.lte("price", normalizedMaxPrice);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (error) {
    throw new Error("Products could not be loaded", { cause: error });
  }

  return (data ?? []).map(normalizeProduct);
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
