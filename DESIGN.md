---
name: Home Mix
description: A warm, familiar Georgian furniture storefront led by real rooms and real products.
colors:
  warm-canvas: "#fcf9f8"
  ink: "#1b1c1c"
  walnut: "#7f512f"
  walnut-deep: "#6d4528"
  white: "#ffffff"
  soft-linen: "#f6f3f2"
  warm-mist: "#e6e2de"
  clay-border: "#d6c3b8"
  quiet-ink: "#605e5b"
  soft-brown: "#83746b"
  image-placeholder: "#f0eded"
  destructive: "#a33c32"
typography:
  display:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "clamp(2.35rem, 5.2vw, 4.75rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  lg: "0.75rem"
  xl: "1.05rem"
  2xl: "1.35rem"
spacing:
  card-inset: "0.625rem"
  control-x: "1.5rem"
  page-gutter-mobile: "1rem"
  page-gutter-tablet: "1.5rem"
  page-gutter-desktop: "2rem"
  section-mobile: "4rem"
  section-tablet: "5rem"
  section-desktop: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.walnut}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: "0.75rem 1.5rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.walnut-deep}"
    textColor: "{colors.white}"
  button-icon:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    size: "2.75rem"
  card-product:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.card-inset}"
  card-category:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "1.25rem"
  nav-link:
    textColor: "{colors.quiet-ink}"
    typography: "{typography.label}"
    height: "2.75rem"
  nav-link-active:
    textColor: "{colors.walnut}"
    typography: "{typography.label}"
    height: "2.75rem"
---

# Design System: Home Mix

## Overview

**Creative North Star: "The Welcoming Living Room"**

Home Mix feels like entering a comfortable, well-kept home: warm, calm, and immediately understandable. Natural furniture photography carries the atmosphere, while a restrained off-white, white, and walnut palette keeps the interface familiar and lets real products remain the point.

The system is polished through proportion, spacing, legible Georgian typography, and quiet interaction states rather than decorative concepts. It favors straightforward storefront patterns and moderate density; experimental grids, technical annotations, oversized display treatments, and visually complicated compositions are outside this world.

**Key Characteristics:**

- Warm neutral canvas with walnut-brown actions
- Natural room and product photography as the main visual voice
- Real products presented before category navigation
- Familiar cards, navigation, and controls with soft corners
- Restrained motion and clearly visible keyboard focus

## Colors

The palette moves through warm off-whites and pale upholstery neutrals, anchored by dark ink and a single walnut-brown action color.

### Primary

- **Walnut:** The brand and action color for primary buttons, prices, active navigation, arrows, and focus outlines.
- **Deep Walnut:** The darker hover state for filled actions and emphasized text links.

### Neutral

- **Warm Canvas:** The persistent page and drawer background, keeping large surfaces softer than pure white.
- **White:** The clean surface for product cards, category cards, the footer, and compact controls.
- **Ink:** The default high-contrast text color for headings, names, and control glyphs.
- **Quiet Ink:** Supporting copy and inactive navigation labels.
- **Soft Brown:** Low-emphasis metadata such as product categories and the footer label.
- **Soft Linen:** A secondary section surface and quiet control background.
- **Warm Mist:** A subdued loading or transitional surface.
- **Clay Border:** The warmer structural border for compact controls and understated link decoration.
- **Image Placeholder:** A neutral fallback behind product imagery.
- **Destructive:** Reserved for genuine error semantics rather than general emphasis.

### Named Rules

**The One Walnut Rule.** Walnut is the only chromatic accent for ordinary actions and emphasis; the rest of the interface stays neutral so furniture imagery remains dominant.

**The Warm Canvas Rule.** Large page surfaces use Warm Canvas or Soft Linen, while pure white is reserved for contained cards and controls.

## Typography

**Display Font:** Noto Sans Georgian Variable (with Manrope Variable and sans-serif fallback)  
**Body Font:** Noto Sans Georgian Variable (with Manrope Variable and sans-serif fallback)

**Character:** A single humanist sans stack gives Georgian and Latin text the same calm, practical voice. Weight and scale provide hierarchy; there is no decorative display face.

### Hierarchy

- **Display** (semibold, fluid 2.35rem–4.75rem, 1.08): Concise hero headlines over photography, capped at roughly 13 characters per line.
- **Headline** (semibold, 1.875rem–2.25rem, 1.25): Major section headings with slight negative tracking.
- **Title** (semibold, 1.25rem, 1.5): Category-card titles and prominent contained headings.
- **Body** (regular, 1rem, 1.75): Supporting copy, usually kept to a compact measure of about 32–36rem.
- **Label** (semibold, 0.875rem, 1.25): Navigation and actions; product metadata steps down to 0.75rem.

### Named Rules

**The One Voice Rule.** Use the Georgian-first sans stack everywhere and create hierarchy with size, weight, and spacing rather than introducing a contrasting display typeface.

**The Furniture Leads Rule.** Headlines are concise and controlled; typography never competes with room or product imagery for attention.

## Layout

Primary content sits in a centered 80rem container; the hero may expand to 90rem. Page gutters progress from 1rem on mobile to 1.5rem at 640px and 2rem at 1024px. Homepage sections use a steady vertical rhythm of 4rem, 5rem, and 6rem across the same responsive range.

The homepage sequence is fixed by intent: immersive room photography, newest products, then category navigation. Product cards form one column by default, two from 520px, and four from 1024px; categories move from one to two columns at 640px and three at 1024px. The header changes from a 68px mobile bar to an 80px desktop bar, with desktop navigation appearing at 768px.

**The Product-First Rule.** On discovery surfaces, show real products before category navigation unless the task has a stronger product reason to change the sequence.

## Elevation & Depth

The system is flat by default and uses tonal layering for most separation. Cards receive only warm, low-opacity ambient shadows; stronger elevation is reserved for the temporary mobile navigation drawer. Photography gains readable depth through dark transparent gradients rather than floating text panels.

### Shadow Vocabulary

- **Product lift** (`0 10px 28px rgba(59,40,27,0.06)`): A soft resting shadow beneath product cards.
- **Category lift** (`0 8px 24px rgba(59,40,27,0.05)`): A slightly quieter resting shadow beneath category links.
- **Drawer elevation** (`-18px 0 50px rgba(36,25,19,0.16)`): A directional shadow used only by the open mobile navigation panel.

### Named Rules

**The Quiet Depth Rule.** Resting cards use warm ambient shadows below 0.07 opacity; pronounced elevation belongs only to temporary overlays.

## Shapes

The form language is softly rectangular rather than pill-shaped. Large image frames and cards use the 2xl radius; buttons, image insets, and square icon controls use the xl radius. The consistent nested relationship—soft card outside, slightly tighter image or control inside—creates polish without ornamental geometry.

Thin warm borders are reserved for controls, section dividers, empty states, and the sticky header. Hero and product imagery are clipped cleanly to their containers.

## Components

Components feel familiar, quiet, and comfortably touchable. Interactive controls maintain a minimum dimension of 44px and use explicit focus outlines.

### Buttons

- **Shape:** Soft rectangle using the xl radius, typically 48px tall with 24px horizontal padding.
- **Primary:** Walnut background, white semibold label, and a small directional arrow where navigation benefits from it.
- **Hover / Focus:** Darken to Deep Walnut on hover; use a 2px visible outline with separation from the control. On photography, the focus outline switches to white.
- **Icon:** Square 44px controls use white or translucent dark surfaces, thin borders, and centered 16–20px icons.

### Cards / Containers

- **Corner Style:** Soft 2xl outer corners with xl image or icon insets.
- **Background:** White cards on Warm Canvas or Soft Linen sections.
- **Shadow Strategy:** Warm, ambient, and low-opacity; product cards stay still while category cards may rise by 2px on hover.
- **Border:** Usually none on content cards; borders define structural and empty-state containers.
- **Internal Padding:** Product cards use a compact 10px shell plus an inset text block; category cards use 20–24px.

### Navigation

- **Desktop:** Logo and wordmark on the left, four semibold links on the right. The active and hover states use Walnut text and a 2px underline.
- **Mobile:** A 44px bordered menu control opens a right-side Warm Canvas drawer. Links are full-width, at least 56px tall, and separated by quiet dividers.

### Hero Slider

A single clipped room photograph fills a 540–600px frame. A dark warm gradient supports short white copy and one primary catalog action. Pagination and previous/next controls remain near the lower edge, pause during direct interaction, and remove transitions when reduced motion is requested.

### Product Card

The 4:3 product image leads. Category metadata is small and quiet, the product name is limited to two lines, and the Walnut price closes the card with the strongest text weight. Hover motion is limited to a 1.025 image scale.

### Category Card

Category navigation is compact and secondary: a title paired with one 44px arrow tile. The tile inverts from Soft Linen and Walnut to Walnut and white on hover while the card rises only 2px.

## Do's and Don'ts

### Do:

- **Do** let real room and product photography carry the first impression.
- **Do** keep products ahead of categories on storefront discovery pages.
- **Do** use Warm Canvas for the page and white for contained product or navigation surfaces.
- **Do** preserve 44px minimum controls, visible focus outlines, and reduced-motion behavior.
- **Do** use straightforward responsive grids and the established 1rem / 1.5rem / 2rem page gutters.

### Don't:

- **Don't** add drafting grids, measurements, registration marks, numbered metadata, or technical-looking navigation devices.
- **Don't** introduce dark catalog sections or decorative color fields that overpower product photography.
- **Don't** use oversized compressed headlines, ornamental display type, or copy-heavy layouts.
- **Don't** turn categories into the primary homepage story ahead of real products.
- **Don't** add speculative commerce UI or fabricated proof to make the storefront feel fuller.
