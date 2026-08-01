import "server-only";
import { createClient } from "@supabase/supabase-js";

export type Category = { id: string; slug: string; name: string };
export type ProductImage = { id: string; sort_order: number; created_at: string };
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
  if (!url || !key) throw new Error("Supabase-ის გარემოს ცვლადები არ არის მითითებული");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function normalizeProduct(row: Record<string, unknown>): Product {
  const categoryValue = row.category;
  const category = Array.isArray(categoryValue) ? categoryValue[0] ?? null : categoryValue ?? null;
  const images = Array.isArray(row.images) ? [...row.images] : [];
  images.sort((a, b) => {
    const first = a as ProductImage;
    const second = b as ProductImage;
    return first.sort_order - second.sort_order || new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
  });
  return {
    id: String(row.id), slug: String(row.slug), name: String(row.name),
    description: row.description ? String(row.description) : null,
    price: Number(row.price), created_at: String(row.created_at),
    category: category as Category | null, images: images as ProductImage[],
  };
}

export async function getHomeCategories(): Promise<Category[]> {
  const { data, error } = await publicClient().from("categories").select("id, slug, name").order("name", { ascending: true });
  if (error) throw new Error("კატეგორიების ჩატვირთვა ვერ მოხერხდა", { cause: error });
  return (data ?? []) as Category[];
}

export async function getNewestProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await publicClient().from("products").select(productSelection).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error("პროდუქტების ჩატვირთვა ვერ მოხერხდა", { cause: error });
  return (data ?? []).map((row) => normalizeProduct(row as Record<string, unknown>));
}

export function formatPrice(value: number) {
  const formatted = new Intl.NumberFormat("ka-GE", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
  return `${formatted} ₾`;
}
