import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

export type Category = { id: string; slug: string; name: string };
export type ProductImage = {
  id: string;
  sort_order: number;
  created_at: string;
};
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
  category: Category | null;
  images: ProductImage[];
};

export type CatalogSort = "date-desc" | "date-asc" | "price-desc" | "price-asc";

export type CatalogFilters = {
  search?: string;
  categorySlug?: string;
  sort?: CatalogSort;
};

const productSelection = `
  id,
  slug,
  name,
  description,
  price,
  created_at,
  category:categories!products_category_id_fkey (id, name, slug),
  images:product_images (id, sort_order, created_at)
`;

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Supabase-ის გარემოს ცვლადები არ არის მითითებული");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function normalizeProduct(row: Record<string, unknown>): Product {
  const categoryValue = row.category;
  const category = Array.isArray(categoryValue)
    ? (categoryValue[0] ?? null)
    : (categoryValue ?? null);
  const images = Array.isArray(row.images) ? [...row.images] : [];
  images.sort((a, b) => {
    const first = a as ProductImage;
    const second = b as ProductImage;
    return (
      first.sort_order - second.sort_order ||
      new Date(first.created_at).getTime() -
        new Date(second.created_at).getTime()
    );
  });
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    price: Number(row.price),
    created_at: String(row.created_at),
    category: category as Category | null,
    images: images as ProductImage[],
  };
}

export async function getHomeCategories(): Promise<Category[]> {
  const { data, error } = await publicClient()
    .from("categories")
    .select("id, slug, name")
    .order("name", { ascending: true });
  if (error)
    throw new Error("კატეგორიების ჩატვირთვა ვერ მოხერხდა", { cause: error });
  return (data ?? []) as Category[];
}

export async function getNewestProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select(productSelection)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error)
    throw new Error("პროდუქტების ჩატვირთვა ვერ მოხერხდა", { cause: error });
  return (data ?? []).map((row) =>
    normalizeProduct(row as Record<string, unknown>),
  );
}

export async function getCatalogProducts({
  search = "",
  categorySlug = "",
  sort = "date-desc",
}: CatalogFilters = {}): Promise<Product[]> {
  const supabase = publicClient();
  let categoryId: string | null = null;

  if (categorySlug) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    if (categoryError) {
      throw new Error("კატეგორიის ჩატვირთვა ვერ მოხერხდა", {
        cause: categoryError,
      });
    }

    if (!category) return [];
    categoryId = String(category.id);
  }

  const sortOptions: Record<
    CatalogSort,
    { column: "created_at" | "price"; ascending: boolean }
  > = {
    "date-desc": { column: "created_at", ascending: false },
    "date-asc": { column: "created_at", ascending: true },
    "price-desc": { column: "price", ascending: false },
    "price-asc": { column: "price", ascending: true },
  };
  const selectedSort = sortOptions[sort] ?? sortOptions["date-desc"];

  let query = supabase.from("products").select(productSelection);
  const normalizedSearch = search.trim().slice(0, 100);

  if (normalizedSearch) query = query.ilike("name", `%${normalizedSearch}%`);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query
    .order(selectedSort.column, { ascending: selectedSort.ascending })
    .order("id", { ascending: true });

  if (error) {
    throw new Error("პროდუქტების ჩატვირთვა ვერ მოხერხდა", { cause: error });
  }

  return (data ?? []).map((row) =>
    normalizeProduct(row as Record<string, unknown>),
  );
}

export const getProductBySlug = cache(
  async (slug: string): Promise<Product | null> => {
    const { data, error } = await publicClient()
      .from("products")
      .select(productSelection)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error("პროდუქტის ჩატვირთვა ვერ მოხერხდა", { cause: error });
    }

    return data ? normalizeProduct(data as Record<string, unknown>) : null;
  },
);

export function formatPrice(value: number) {
  const formatted = new Intl.NumberFormat("ka-GE", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ₾`;
}
