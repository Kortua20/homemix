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
- Job: See Home Mix products quickly and continue to the full catalog; use categories as a secondary way to narrow the selection.
- Primary action: Browse all products.
- Proof and content: Existing Home Mix logo, three local furniture photographs, all live Supabase categories, and the newest live Supabase products with R2 imagery.
- Constraints: Entirely Georgian; preserve the warm brown identity and all Supabase/R2 behavior; no fabricated claims; reduced-motion support; minimum 44px controls; no horizontal overflow at 320px.
- Chosen direction: A simple, familiar, warm furniture storefront. Product photography and clear catalog access lead; decoration and experimental composition recede.
- Memorable moment: A calm, full-width room photograph welcomes the visitor and moves directly into real products.
- Approval: User explicitly rejected the complex workshop-index treatment and requested a simpler, less modern, product-first homepage.
- Unresolved decisions: None for this homepage pass.

## Simplification record

| Removed complexity | Reason |
| --- | --- |
| Drafting grids, measurements, registration marks, and numbered metadata | Made the store feel complicated and overly modern |
| Products after categories | Delayed the homepage's primary customer goal |
| Dark contact-sheet product section | Added visual weight and made browsing feel specialized |
| Oversized compressed headlines | Dominated the furniture and reduced familiarity |
| Numbered category index and technical icons | Categories are secondary navigation, not the main story |
| Repeated descriptive copy | The furniture photographs and product data already provide the needed context |

## Implementation fidelity inventory

| Visible ingredient | Required composition | Medium |
| --- | --- | --- |
| Navigation | Familiar logo-left, four-link header with clear active state and simple mobile drawer | Semantic HTML, Radix dialog, Lucide menu glyph |
| Hero | One full-width room photograph, concise Georgian copy, one catalog action | Existing `/public/hero` imagery, semantic HTML and `next/image` |
| Slider | Quiet pagination and previous/next controls with swipe, pause, and reduced-motion behavior | React state and accessible controls |
| Product section | First content section after the hero; straightforward responsive product grid | Live Supabase/R2 data and `next/image` |
| Categories | Secondary compact navigation cards after products | Live Supabase data and semantic links |
| Empty/error states | Clear centered messages with one restrained icon | Semantic HTML and Lucide icons |
| Footer | Minimal centered Home Mix logo | Existing logo and semantic footer |
