import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
import { HeroSlider } from "@/components/hero-slider";
import { ProductCard } from "@/components/product-card";
import { productGridClass } from "@/components/product-card-skeleton";
import { PromoBanner, type PromoBannerProps } from "@/components/promo-banner";
import { SectionHeader } from "@/components/section-header";
import { TrustStrip } from "@/components/trust-strip";
import { getHomeCategories, getNewestProducts } from "@/lib/storefront";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Home Mix — ავეჯი თქვენი სახლისთვის" },
  description:
    "აღმოაჩინეთ Home Mix-ის თანამედროვე ავეჯი, ახალი პროდუქტები და კოლექციები თქვენი სახლისთვის.",
  alternates: { canonical: "/" },
};

// Photos live under /public/promo/ (1200×800 WebP; the banner crops them to its right side).
const promoBanners: PromoBannerProps[] = [
  {
    title: "თბილისში მიწოდება უფასოა",
    href: "/contact",
    actionLabel: "დეტალურად",
    tone: "forest",
    image: {
      src: "/promo/delivery-tbilisi.webp",
      alt: "თბილისის ძველი ქუჩა ხის აივნებით",
    },
  },
  {
    title: "მაღალი ხარისხი და კომფორტი",
    href: "/about",
    actionLabel: "ჩვენ შესახებ",
    tone: "sand",
    image: {
      src: "/promo/quality-comfort.webp",
      alt: "რბილი ბალიშები და პლედი ღია ფერის დივანზე",
    },
  },
];

export default async function HomePage() {
  const [categoriesResult, productsResult] = await Promise.allSettled([
    getHomeCategories(),
    getNewestProducts(8),
  ]);

  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const products =
    productsResult.status === "fulfilled" ? productsResult.value : [];

  return (
    <main>
      <HeroSlider />

      {/* Categories sit straight under the hero as quick navigation, without a header —
          the labelled tiles are self-explanatory, as in the reference. */}
      <section aria-label="კატალოგი" className="page-container pt-6 sm:pt-8">
        {categoriesResult.status === "rejected" ? (
          <EmptyState
            title="კატალოგი ვერ ჩაიტვირთა"
            description="გთხოვთ, ცოტა ხანში სცადოთ თავიდან."
            tone="error"
          />
        ) : categories.length === 0 ? (
          <EmptyState
            title="კატალოგი ჯერ არ დამატებულა"
            description="ახალი კატალოგი მალე გამოჩნდება."
          />
        ) : (
          // A swipe rail on phones; a plain grid from sm, because a desktop mouse cannot
          // reach cards in a horizontal rail whose scrollbar is hidden.
          // From lg, one row of up to six that always spans the container — fewer
          // categories get wider (and slightly shorter) tiles rather than a gap.
          <div
            style={
              { "--category-cols": Math.min(categories.length, 6) } as CSSProperties
            }
            className="no-scrollbar -mx-4 grid snap-x snap-mandatory auto-cols-[38%] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:snap-none sm:grid-flow-row sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-[repeat(var(--category-cols),minmax(0,1fr))]"
          >
            {categories.map((category) => (
              <div key={category.id} className="snap-start">
                <CategoryCard
                  category={category}
                  className={categories.length < 6 ? "lg:aspect-[5/3]" : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        aria-labelledby="home-products-heading"
        className="page-container section-y"
      >
        <SectionHeader
          id="home-products-heading"
          title="ახალი პროდუქტები"
          description="კატალოგში ბოლოს დამატებული ავეჯი — ნახეთ სიახლეები პირველებმა."
          href="/products"
        />

        {productsResult.status === "rejected" ? (
          <EmptyState
            title="პროდუქტები ვერ ჩაიტვირთა"
            description="გთხოვთ, ცოტა ხანში სცადოთ თავიდან."
            tone="error"
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="პროდუქტები მალე დაემატება"
            description="ჩვენ ვამზადებთ ახალ კოლექციას თქვენი სახლისთვის."
          />
        ) : (
          <div className={productGridClass}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section aria-label="შეთავაზებები" className="page-container">
        <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
          {promoBanners.map((banner) => (
            <PromoBanner key={banner.title} {...banner} />
          ))}
        </div>
      </section>

      <section className="page-container section-y">
        <TrustStrip />
      </section>
    </main>
  );
}
