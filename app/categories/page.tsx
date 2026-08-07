import type { Metadata } from "next";
import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
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
    <main className="bg-[#f4f2ed]">
      <section className="mx-auto w-full max-w-384 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <h1 className="text-4xl leading-tight font-semibold tracking-[-0.03em] text-[#18221d] sm:text-5xl">
            კატალოგი
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#5e685f]">
            რამე ტექსრი აქ
          </p>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            title="კატალოგი ჯერ არ არის დამატებული"
            description="ახალი კატალოგი მალე გამოჩნდება."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                showProductCount
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
