import { describe, expect, it } from "vitest";

import { getStockLabel } from "@/lib/storefront";

// What a customer is told about stock. The rule: only a new item that can actually be bought
// shows a count. See getStockLabel in lib/storefront.ts.
describe("getStockLabel", () => {
  it("shows the count for a new item that can be bought", () => {
    expect(getStockLabel({ stockQuantity: 3, isPurchasable: true })).toBe("მარაგშია: 3 ცალი");
    expect(getStockLabel({ stockQuantity: 1, isPurchasable: true })).toBe("მარაგშია: 1 ცალი");
  });

  it("shows nothing for a used item, which is always exactly one piece", () => {
    // Used items carry no stock_quantity (products_condition_matches_kind_check).
    expect(getStockLabel({ stockQuantity: null, isPurchasable: true })).toBeNull();
  });

  it("shows nothing on a sold, reserved or sold-out item, where it would contradict the notice", () => {
    expect(getStockLabel({ stockQuantity: 0, isPurchasable: false })).toBeNull();
    expect(getStockLabel({ stockQuantity: 4, isPurchasable: false })).toBeNull();
  });
});
