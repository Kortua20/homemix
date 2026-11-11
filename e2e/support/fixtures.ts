import { randomBytes } from "node:crypto";

import { test as base, expect } from "@playwright/test";

import { createAdminClient } from "./local-supabase";

// Per-test catalog data with unique slugs, removed afterwards (sales first: product_sales
// restricts deleting a product that has sales). Tests never depend on or touch seed rows.

type ProductOptions = {
  kind?: "new_stocked" | "used_unique";
  stock?: number;
  status?: string;
  price?: number;
  purchasePrice?: number;
};

type Catalog = {
  categorySlug: string;
  createProduct: (options?: ProductOptions) => Promise<{ id: string; slug: string; name: string }>;
};

export const test = base.extend<{ catalog: Catalog }>({
  // `provide` is Playwright's `use` callback, renamed so it is not mistaken for React's use().
  catalog: async ({}, provide) => {
    const admin = createAdminClient();
    const runId = randomBytes(4).toString("hex");
    const categorySlug = `e2e-${runId}`;
    const productIds: string[] = [];
    let counter = 0;

    const { data: category, error: categoryError } = await admin
      .from("categories")
      .insert({ slug: categorySlug, name: `E2E ${runId}`, description: "" })
      .select("id")
      .single();
    if (categoryError) throw categoryError;

    const { data: grade } = await admin
      .from("condition_grades")
      .select("code")
      .order("sort_order")
      .limit(1)
      .single();

    await provide({
      categorySlug,
      createProduct: async ({ kind = "new_stocked", stock = 4, status = "available", price = 60, purchasePrice } = {}) => {
        counter += 1;
        const slug = `e2e-${runId}-${counter}`;
        const name = `E2E პროდუქტი ${runId}-${counter}`;

        const { data, error } = await admin
          .from("products")
          .insert({
            slug,
            name,
            price,
            category_id: category!.id,
            listing_kind: kind,
            status,
            stock_quantity: kind === "new_stocked" ? stock : null,
            condition_grade: kind === "used_unique" ? grade?.code ?? null : null,
            published_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (error) throw error;
        productIds.push(data.id);

        if (purchasePrice !== undefined) {
          const { error: financeError } = await admin
            .from("product_finances")
            .insert({ product_id: data.id, purchase_price: purchasePrice });
          if (financeError) throw financeError;
        }

        return { id: data.id, slug, name };
      },
    });

    if (productIds.length > 0) {
      await admin.from("product_sales").delete().in("product_id", productIds);
      await admin.from("products").delete().in("id", productIds);
    }
    await admin.from("categories").delete().eq("id", category!.id);
  },
});

export { expect };
