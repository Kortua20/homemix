import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getHomeCategories, getSitemapProducts } from "@/lib/storefront";

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
    // getSitemapProducts, not getCatalogProducts: the catalog query is available-only, and
    // sold listings keep their pages and should stay indexed. They are ranked below
    // available ones below rather than dropped.
    const [categories, products] = await Promise.all([
      getHomeCategories(),
      getSitemapProducts(),
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
      ...products.map((product) => {
        const isAvailable = product.status === "available";
        return {
          url: absoluteUrl(`/product/${encodeURIComponent(product.slug)}`),
          lastModified: new Date(product.created_at),
          // A sold listing will not change again; an available one might.
          changeFrequency: isAvailable
            ? ("weekly" as const)
            : ("monthly" as const),
          priority: isAvailable ? 0.8 : 0.3,
          images: product.images[0]
            ? [absoluteUrl(`/api/product-images/${product.images[0].id}`)]
            : undefined,
        };
      }),
    ];
  } catch {
    return staticPages;
  }
}
