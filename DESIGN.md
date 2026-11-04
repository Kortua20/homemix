---
name: Home Mix
description: A warm, familiar Georgian furniture storefront — forest green, cream, white cards, real rooms and real products.
colors:
  canvas: "#f6f3ee"
  sand: "#ede6db"
  white: "#ffffff"
  ink: "#1a2420"
  ink-muted: "#56615a"
  meta: "#646d66"
  forest: "#1d4a38"
  forest-deep: "#173c2f"
  forest-night: "#10291f"
  mint: "#e8eee9"
  line: "#e4dfd6"
  control: "#c9d1ca"
  brass: "#c39a3e"
  placeholder: "#e7e2d9"
  danger: "#a33c32"
  danger-line: "#d6a9a4"
  sold: "#443a72"
typography:
  family: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
  hero: "clamp(2.25rem, 4.6vw, 4.25rem) / 700 / -0.025em"
  page-title: "1.75rem → 2.25rem / 700 (inside PageBanner)"
  section-title: "1.5rem → 1.75rem / 700, accent bar below"
  panel-title: "1.125rem → 1.25rem / 700, accent bar left"
  card-title: "0.875rem → 0.9375rem / 600 (product); 0.875rem (category tile)"
  body: "1rem / 400 / 1.75"
  label: "0.875rem / 600"
  meta: "0.75rem / 500–600"
rounded:
  md: "0.6rem — buttons, fields, inner images, insets"
  lg: "0.75rem — cards, panels, banners"
  full: "buttons on photography/colour, icon tiles, pagination, nav controls"
shadows:
  card: "0 1px 2px rgb(26 36 32/.05), 0 8px 24px -12px rgb(26 36 32/.18)"
  card-hover: "0 2px 4px rgb(26 36 32/.06), 0 16px 32px -14px rgb(26 36 32/.28)"
  popover: "0 16px 40px rgb(12 34 25/.16)"
  drawer: "-18px 0 50px rgb(12 34 25/.18)"
layout:
  container: "80rem max, gutters 1rem / 1.5rem (640px) / 2rem (1024px) — `page-container`"
  section-rhythm: "2rem / 2.5rem / 3rem — `section-y`"
  product-grid: "2 / 3 (768px) / 4 (1024px) columns — `productGridClass`"
---

# Design System: Home Mix

> Rewritten 2026-11-04 for the full-site redesign that follows the two reference images
> supplied by the owner (a homepage and a product page). Ref 1's forest-green palette was
> chosen over ref 2's mustard gold. The earlier "Cinematic room" system (tonal separation,
> no card shadows, no pills) is retired.

## Overview

A familiar, well-lit furniture storefront. Cream canvas, white cards with a soft shadow, forest green for every action and dark surface, and real room photography in the hero, the inner-page banners and the category tiles. The layout is dense and conventional on purpose: visitors should recognise every pattern from other shops.

## Tokens

All colours, shadows and the page frame live in `app/globals.css` (`@theme` and `@utility`). Use the token names (`bg-canvas`, `text-ink`, `shadow-card`, `page-container`, `section-y`, `accent-bar`) and never raw hex values in components. The only remaining hex values are deliberate semantic tints: flaw severities, the sold/reserved status tint, the error icon tile, and the sand banner's placeholder tone.

### Colour roles

- **Forest Deep:** top bar, footer, filled buttons, the hero/banner base, and discount badges.
- **Forest:** focus outlines, accent bars, active and hover text, and the "new" badge.
- **Brass:** only the active-nav underline. It echoes the logo's gold; don't spread it.
- **Canvas:** page background. **Sand:** the beige promo banner. **White:** cards, panels and controls.
- **Mint:** hover fills and icon tiles. **Line / Control:** dividers and field borders.

## Typography

One Georgian-first sans throughout. Headings are bold (700), with slight negative tracking. Section titles carry a short forest bar below them (`accent-bar`). Titles inside white panels carry a vertical bar on the left instead (`SectionHeader variant="panel"`).

## Layout

- One container for everything (`page-container`, 80rem). The header, hero copy, sections and footer all share that edge.
- **Homepage:** hero → category tiles (straight under the hero, no header) → newest products → two promo banners → trust strip → footer.
- **Inner pages** (`/products`, `/categories`, `/about`, `/contact`, `/product/[slug]`, and categories without photos) open with `PageBanner`: a short photo band with the title on the left and the breadcrumb on the right. Content follows in white panels.
- **Category pages with photos** keep their own `HeroSlider` (existing behaviour), followed by a breadcrumb row.

## Components

- **SiteHeader:** dark top bar (phone, address, payment note, Facebook), then a white bar with the logo, nav (the catalogue item opens a category dropdown on hover/focus) and a pill search that submits to `/products?q=`. On phones it shows a search icon and a drawer that contains the search field.
- **HeroSlider:** bold white copy on a warm dark wash, an outlined pill CTA, dot pagination, and round forest arrows.
- **ProductCard:** white card, 4:3 image, at most one badge (sold/reserved › discount › new), meta line, name, price with old price, and a "ნახვა" label. That label is not a button; the whole card is the link. There is no cart or wishlist.
- **CategoryCard:** `tile` (square, centred label) for the homepage and `large` (4:3, with product count) for `/categories`.
- **PromoBanner:** surface colour fading into a right-hand photo slot, a title and an outlined pill link.
- **TrustStrip:** icon-over-label columns with dividers. Only owner-confirmed claims go here.
- **ProductRail:** a white panel with a scrollable card row and round arrows ("მსგავსი პროდუქტები").
- **ShareLinks:** plain share URLs for Facebook, Messenger, Viber, WhatsApp and Telegram. Messenger and Viber need the app installed.
- **Fields:** the label sits inside the bordered box, fields use rounded-md, and inputs are 1rem on phones so iOS does not zoom.
- **Buttons:** solid actions are rounded-md Forest Deep. Buttons on photography or coloured banners are outlined pills.

## Missing assets

Each placeholder below keeps its final size and crop, and is easy to find in the code.

| Asset | Where | How to swap |
| --- | --- | --- |
| Horizontal logo lockup (icon + "home mix" wordmark side by side), SVG | Header | `TODO(asset)` in `components/site-header.tsx` |
| Category photos | Homepage tiles, `/categories` | Uploaded per category in the admin; tiles fall back to an icon |

Placeholders render with `data-asset-placeholder="<file>"` in the DOM.

## Don'ts

- Don't add commerce UI the shop does not have: cart, wishlist, newsletter, or a returns or warranty promise.
- Don't add trust-strip claims without confirming them with the owner.
- Don't use raw hex values or one-off container widths; extend the tokens instead.
- Don't nest white cards in white panels; inside a panel, use a Canvas-tinted inset (`rounded-md bg-canvas`).
