import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getCatalogProducts, getHomeCategories } from "@/lib/storefront";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [categories, products] = await Promise.all([
      getHomeCategories(),
      getCatalogProducts(),
    ]);
    return [
      ...staticPages,
      ...categories.map((category) => ({
        url: absoluteUrl(`/categories/${encodeURIComponent(category.slug)}`),
        changeFrequency: "weekly" as const,
        priority: 0.75,
        images: category.images[0]
          ? [absoluteUrl(`/api/category-images/${category.images[0].id}`)]
          : undefined,
      })),
      ...products.map((product) => ({
        url: absoluteUrl(`/product/${encodeURIComponent(product.slug)}`),
        lastModified: new Date(product.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: product.images[0]
          ? [absoluteUrl(`/api/product-images/${product.images[0].id}`)]
          : undefined,
      })),
    ];
  } catch {
    return staticPages;
  }
}
