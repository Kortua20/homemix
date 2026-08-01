---
version: 1
slug: "app-products-page-tsx"
primary_target: "app/products/page.tsx"
related_targets: ["app/products/loading.tsx","components/product-card.tsx","lib/storefront.ts"]
---

# Product catalog surface

- Scope: `/products`, implemented by `app/products/page.tsx` with the shared `ProductCard` and server-side catalog query in `lib/storefront.ts`.
- Visitor mode: Operate.
- Audience: Georgian customers who want to find and compare real Home Mix products efficiently on mobile or desktop.
- Job: Search by product name, narrow by category, sort by creation date or price in either direction, and open a product detail page.
- Primary action: Apply catalog controls and select a product.
- Proof and content: Live Supabase products and categories with private R2 images rendered through the existing image endpoint.
- Constraints: URL-backed GET controls; Georgian-first labels; no speculative commerce UI; truthful count, empty, loading, and error states; accessible labels and 44px controls; no horizontal overflow at 320px.
- Chosen direction: A calm, familiar catalog with one compact control surface followed immediately by the product grid.
- Memorable moment: Search, category, and sort read as one clear sentence above the live results rather than a complicated sidebar.
- Unresolved decisions: Pagination is intentionally outside this simple first catalog pass.
