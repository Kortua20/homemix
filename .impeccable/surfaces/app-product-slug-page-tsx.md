---
version: 1
slug: "app-product-slug-page-tsx"
primary_target: "app/product/[slug]/page.tsx"
related_targets: ["components/product-gallery.tsx","app/product/[slug]/loading.tsx","app/product/[slug]/not-found.tsx","app/product/[slug]/error.tsx"]
---

# Product detail surface

- Scope: `/product/[slug]`, implemented by `app/product/[slug]/page.tsx` and `components/product-gallery.tsx`.
- Visitor mode: Read.
- Audience: Georgian customers evaluating one real Home Mix product on mobile or desktop.
- Job: Confirm the product identity, inspect every available photograph, read its live category, price, and description, then return to the storefront.
- Primary action: Review the product; secondary action returns to the homepage product selection.
- Proof and content: The exact Supabase product record and its ordered private R2 images.
- Constraints: Georgian-first UI, Unicode-safe slugs, no cart or invented sales details, 60-second revalidation, truthful no-description and no-image fallbacks, accessible 44px controls, no horizontal page overflow at 320px.
- Chosen direction: Extend the established simple and warm storefront with a familiar two-column product layout that becomes one clear vertical flow on mobile.
- Memorable moment: A large, uncluttered product photograph leads while the real price and description remain immediately legible beside it.
- States: Route-level loading skeleton, truthful 404 for absent slugs, local retry state for data failures, and gallery fallback when no images exist.
- Unresolved decisions: None for this detail-page pass.
