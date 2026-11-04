import type { Metadata } from "next";
import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
import { PageBanner } from "@/components/page-banner";
import { getHomeCategories } from "@/lib/storefront";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "კატალოგი",
  description:
    "დაათვალიერეთ Home Mix-ის ყველა კატეგორია და იპოვეთ სასურველი ავეჯი.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "კატალოგი | Home Mix",
    description:
      "დაათვალიერეთ Home Mix-ის ყველა კატეგორია და იპოვეთ სასურველი ავეჯი.",
    url: "/categories",
    type: "website",
  },
};

export default async function CategoriesPage() {
  const categories = await getHomeCategories();

  return (
    <main>
      <PageBanner
        title="კატალოგი"
        description="აირჩიეთ კატეგორია და დაათვალიერეთ ავეჯი."
        crumbs={[{ label: "კატალოგი" }]}
      />
      <section aria-label="კატეგორიები" className="page-container section-y">
        {categories.length === 0 ? (
          <EmptyState
            title="კატალოგი ჯერ არ არის დამატებული"
            description="ახალი კატალოგი მალე გამოჩნდება."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} size="large" />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
