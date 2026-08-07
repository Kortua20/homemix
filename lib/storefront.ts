import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

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

export type CatalogFilters = {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
};

const productSelection = `
  id,
  slug,
  name,
  description,
  price,
  created_at,
  category:categories!products_category_id_fkey (id, name, slug, description, images:category_images (id, sort_order, created_at)),
  images:product_images (id, sort_order, created_at)
`;

const categorySelection = `
  id,
  slug,
  name,
  description,
  images:category_images (id, sort_order, created_at),
  products(count)
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

function normalizeCategory(row: Record<string, unknown>): Category {
  const images = Array.isArray(row.images)
    ? ([...row.images] as CategoryImage[])
    : [];
  const products = Array.isArray(row.products) ? row.products : [];
  const productCount = Number(
    (products[0] as { count?: number } | undefined)?.count ?? 0,
  );
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

function normalizeProduct(row: Record<string, unknown>): Product {
  const categoryValue = row.category;
  const category = Array.isArray(categoryValue)
    ? (categoryValue[0] ?? null)
    : (categoryValue ?? null);
  const images = Array.isArray(row.images)
    ? ([...row.images] as ProductImage[])
    : [];
  sortImages(images);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    price: Number(row.price),
    created_at: String(row.created_at),
    category: category
      ? normalizeCategory(category as Record<string, unknown>)
      : null,
    images,
  };
}

export async function getHomeCategories(): Promise<Category[]> {
  const { data, error } = await publicClient()
    .from("categories")
    .select(categorySelection)
    .order("name", { ascending: true });
  if (error)
    throw new Error("კატალოგის ჩატვირთვა ვერ მოხერხდა", { cause: error });
  return (data ?? []).map((row) =>
    normalizeCategory(row as Record<string, unknown>),
  );
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
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error)
    throw new Error("პროდუქტების ჩატვირთვა ვერ მოხერხდა", { cause: error });
  return (data ?? []).map((row) =>
    normalizeProduct(row as Record<string, unknown>),
  );
}

export async function getProductSlugs(): Promise<string[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select("slug")
    .order("created_at", { ascending: false });
  if (error)
    throw new Error("Product slugs could not be loaded", { cause: error });
  return (data ?? []).map((row) => String(row.slug));
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
    .order("price", { ascending: false })
    .limit(1);

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error("Max product price could not be loaded", { cause: error });
  }

  return data ? Number(data.price) : 0;
}

export async function getCatalogProducts({
  search = "",
  categorySlug = "",
  minPrice = 0,
  maxPrice,
}: CatalogFilters = {}): Promise<Product[]> {
  const supabase = publicClient();
  const categoryId = await getCategoryIdBySlug(supabase, categorySlug);
  if (categoryId === "") return [];

  let query = supabase.from("products").select(productSelection);
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

  return (data ?? []).map((row) =>
    normalizeProduct(row as Record<string, unknown>),
  );
}

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

    return data ? normalizeProduct(data as Record<string, unknown>) : null;
  },
);

export const getCategoryBySlug = cache(
  async (slug: string): Promise<Category | null> => {
    const normalizedSlug = normalizeSlug(slug);
    const { data, error } = await publicClient()
      .from("categories")
      .select(categorySelection)
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (error) {
      throw new Error("Category could not be loaded", { cause: error });
    }

    return data ? normalizeCategory(data as Record<string, unknown>) : null;
  },
);

export function formatPrice(value: number) {
  const formatted = new Intl.NumberFormat("ka-GE", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ₾`;
}
