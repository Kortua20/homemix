import { expect, test } from "./support/fixtures";
import { publishableKey, supabaseUrl } from "./support/local-supabase";

// What a customer sees about stock — and what they must never be able to see: the shop's
// purchase prices and actual sale prices.

test.describe("stock count", () => {
  test("a new item shows how many are left, on its page and on its card", async ({
    page,
    catalog,
  }) => {
    const chair = await catalog.createProduct({ kind: "new_stocked", stock: 4 });

    await page.goto(`/product/${chair.slug}`);
    await expect(page.getByText("მარაგშია: 4 ცალი")).toBeVisible();

    await page.goto(`/categories/${catalog.categorySlug}`);
    await expect(
      page.getByRole("link").filter({ hasText: chair.name }).getByText("მარაგშია: 4 ცალი"),
    ).toBeVisible();
  });

  test("a used item shows no count — it is always one piece", async ({ page, catalog }) => {
    const table = await catalog.createProduct({ kind: "used_unique" });

    await page.goto(`/product/${table.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: table.name })).toBeVisible();
    await expect(page.getByText(/მარაგშია/)).toHaveCount(0);
  });

  test("a sold-out item says it is sold, not '0 left'", async ({ page, catalog }) => {
    const chair = await catalog.createProduct({ kind: "new_stocked", stock: 0, status: "sold" });

    await page.goto(`/product/${chair.slug}`);
    await expect(page.getByRole("status")).toContainText("ეს ნივთი გაყიდულია.");
    await expect(page.getByText(/მარაგშია/)).toHaveCount(0);
  });
});

test.describe("internal figures stay internal", () => {
  test("a product page never contains its purchase price", async ({ page, catalog }) => {
    // A distinctive figure, so its absence from the page means something.
    const chair = await catalog.createProduct({ price: 60, purchasePrice: 4321.87 });

    await page.goto(`/product/${chair.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: chair.name })).toBeVisible();
    const html = await page.content();
    expect(html).not.toContain("4321");
    expect(html).not.toContain("4,321");
  });

  // The storefront's own key, used directly: what anyone could do with it from a browser.
  for (const path of [
    "product_finances?select=*",
    "product_sales?select=*",
    "product_accounting?select=*",
    "product_sale_ledger?select=*",
    "products?select=id,finances:product_finances(purchase_price)",
    "products?select=id,sales:product_sales(total_price)",
  ]) {
    test(`the public key is refused: GET /rest/v1/${path}`, async ({ request }) => {
      const response = await request.get(`${supabaseUrl}/rest/v1/${path}`, {
        headers: { apikey: publishableKey },
      });
      expect(response.ok()).toBe(false);
      expect((await response.json()).code).toBe("42501");
    });
  }

  test("the public key cannot record a sale", async ({ request, catalog }) => {
    const chair = await catalog.createProduct({ stock: 4 });
    const response = await request.post(`${supabaseUrl}/rest/v1/rpc/record_product_sale`, {
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      data: { p_product_id: chair.id, p_quantity: 1, p_total_price: 1, p_sold_on: "2026-01-01" },
    });
    expect((await response.json()).code).toBe("42501");
  });

  test("the public key cannot mark a used item sold", async ({ request, catalog }) => {
    const table = await catalog.createProduct({ kind: "used_unique" });
    const response = await request.post(`${supabaseUrl}/rest/v1/rpc/record_used_sale`, {
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      data: { p_product_id: table.id, p_total_price: 1, p_sold_on: "2026-01-01" },
    });
    expect((await response.json()).code).toBe("42501");
  });

  test("the storefront's normal product read still works", async ({ request }) => {
    const response = await request.get(`${supabaseUrl}/rest/v1/products?select=id,stock_quantity&limit=1`, {
      headers: { apikey: publishableKey },
    });
    expect(response.status()).toBe(200);
  });
});
