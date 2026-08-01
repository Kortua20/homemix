---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/hero-slider.tsx","components/category-card.tsx","components/product-card.tsx","components/site-header.tsx","components/footer.tsx"]
---

# Homepage surface

- Scope: `/` homepage implemented by `app/page.tsx` and its shared storefront components.
- Visitor mode: Persuade.
- Audience: Georgian customers browsing real furniture for their homes, primarily on mobile.
- Job: Understand Home Mix immediately, discover live furniture categories, and continue to the full catalog.
- Primary action: Browse all products.
- Proof and content: Existing Home Mix logo, three local furniture photographs, all live Supabase categories, and the newest live Supabase products with R2 imagery.
- Constraints: Entirely Georgian; preserve the warm brown identity and all Supabase/R2 behavior; no fabricated claims; reduced-motion support; minimum 44px controls; no horizontal overflow at 320px.
- Chosen direction: Furniture-maker's workshop index. Joinery drawings, registration marks, numbered category rows, edge-cropped room photography, and product contact sheets replace the incumbent rounded-card template.
- Memorable moment: An oversized Georgian promise and pinned living-room photograph share one measured drafting sheet, followed by categories that read like a maker's index.
- Approved composition: `.impeccable/mocks/home-workshop-index.png` (user delegated the choice; selected for clarity and distinctiveness).
- Unresolved decisions: None for this homepage pass.

## Implementation fidelity inventory

| Visible ingredient | Required composition | Medium |
| --- | --- | --- |
| Navigation | Compact brand rail with four Georgian routes and a square mobile menu control | Semantic HTML, Radix dialog, Lucide menu glyph |
| Hero headline | Oversized, left-weighted Georgian headline interlocked with the image edge | Semantic HTML/CSS |
| Hero room | Tall natural furniture photograph, pinned into the drafting sheet and cropped assertively | Existing `/public/hero/living-room.webp` via `next/image` |
| Drafting grammar | Thin rules, dimension arrows, registration crosses, blue annotations and paper grain | CSS and small authored SVG/CSS geometry |
| Primary action | Walnut rectangular catalog action integrated into the drawing title block | Semantic link/CSS |
| Hero sequence | Three real static rooms retain accessible previous/next and pagination behavior | Existing images and React state; restyled controls |
| Category index | Numbered horizontal rows with typographic category names and furniture line glyphs | Live Supabase data, semantic links, Lucide icons |
| Product section | Editorial contact sheet with varied image scale and restrained specifications | Live Supabase/R2 data and `next/image` |
| Empty/error states | Integrated ruled notice blocks, not floating cards | Existing truthful state content, semantic HTML/CSS |
| Footer | Minimal logo close inside the same drafting-rule system | Existing logo, semantic footer |
