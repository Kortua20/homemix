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
- Constraints: Entirely Georgian; preserve all existing routes/tabs and Supabase/R2 behavior; no fabricated claims; reduced-motion support; minimum 44px controls; no page overflow at 320px.
- Chosen direction: Cinematic room — forest-green retail framing, wide authentic room photography, quiet line controls, an editorial category rail, and live products on chalk.
- Memorable moment: The header gives way directly to a room-scale image; copy and navigation sit low and light over the darker edge while the furniture remains the dominant subject.
- Approval: User selected option B from the three generated comps and explicitly asked to keep the same pages and tabs.
- Approved comp: `.impeccable/mocks/homepage-b-cinematic.png` (`homepage-b-cinematic.json` records approval).
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
| Navigation | Slim forest utility strip, logo-left white header, the same four route tabs, search and outlined catalog action; simple mobile drawer | Semantic HTML, Radix dialog, Lucide glyphs |
| Hero | Full-bleed 570–690px room photograph, lower-left Georgian copy, outlined catalog action, deep green light falloff | Existing `/public/hero` imagery, semantic HTML, CSS gradients and `next/image` |
| Slider | Hairline progress tabs and outlined previous/next controls with swipe, pause, blur transition, and reduced-motion behavior | React state and accessible controls |
| Categories | Horizontal snap rail of tall photographic panels immediately after the hero | Live Supabase categories, existing room imagery, `next/image` |
| Product section | Chalk field with four-column image-first product grid and line-separated price/action row | Live Supabase/R2 data and `next/image` |
| Empty/error states | Clear centered messages with one restrained icon | Semantic HTML and Lucide icons |
| Footer | Deep forest closing field with centered Home Mix logo and quiet brand line | Existing logo and semantic footer |
