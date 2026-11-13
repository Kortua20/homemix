import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCard } from "@/components/product-card";
import type { ProductCardData } from "@/lib/storefront";

const card = (overrides: Partial<ProductCardData> = {}): ProductCardData => ({
  id: "p1",
  slug: "chair",
  name: "სკამი",
  price: 60,
  compareAtPrice: null,
  discountPercent: null,
  showsDiscount: false,
  isNewArrival: false,
  status: "available",
  isPurchasable: true,
  conditionGrade: null,
  categoryName: "სკამები",
  leadImageId: null,
  viewCount: 0,
  stockQuantity: 3,
  ...overrides,
});

describe("ProductCard stock count", () => {
  it("tells the customer how many of a new item are left", () => {
    render(<ProductCard product={card()} />);
    expect(screen.getByText("მარაგშია: 3 ცალი")).toBeInTheDocument();
  });

  it("shows no count on a used item", () => {
    render(
      <ProductCard
        product={card({ stockQuantity: null, conditionGrade: { code: "good", label_ka: "კარგი" } })}
      />,
    );
    expect(screen.queryByText(/მარაგშია/)).not.toBeInTheDocument();
  });

  it("shows the sold badge, not a count, once an item cannot be bought", () => {
    render(<ProductCard product={card({ status: "sold", isPurchasable: false, stockQuantity: 0 })} />);
    expect(screen.queryByText(/მარაგშია/)).not.toBeInTheDocument();
    expect(screen.getByText("გაყიდული")).toBeInTheDocument();
  });

  it("never shows internal figures — the card data has no field for them", () => {
    render(<ProductCard product={card()} />);
    expect(screen.queryByText(/შესყიდვ/)).not.toBeInTheDocument();
  });
});
