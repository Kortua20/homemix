---
name: Home Mix
description: A warm, familiar Georgian furniture storefront led by real rooms and real products.
colors:
  canvas: "#f4f2ed"
  stone: "#ece8e1"
  white: "#ffffff"
  ink: "#18221d"
  forest: "#1d4a38"
  forest-deep: "#173c2f"
  quiet-ink: "#5e685f"
  meta: "#667168"
  mint-tint: "#e9eee9"
  control-border: "#b9c6bd"
  hairline: "#d8ded8"
  image-placeholder: "#e8ebe7"
  skeleton: "#e6e2de"
  destructive: "#a33c32"
  destructive-border: "#d6a9a4"
typography:
  hero:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "clamp(2.25rem, 4.2vw, 4rem)"
    fontWeight: 600
    letterSpacing: "-0.035em"
  page-title:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "2.25rem / 3rem from 640px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  section-title:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "1.875rem / 2.25rem from 640px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  card-title:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "1rem (product) / 1.25–1.5rem (category)"
    fontWeight: 600
  body:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
  meta:
    fontFamily: "Noto Sans Georgian Variable, Manrope Variable, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
rounded:
  lg: "0.75rem"
  xl: "1.05rem"
  2xl: "1.35rem"
spacing:
  page-gutter-mobile: "1rem"
  page-gutter-tablet: "1.5rem"
  page-gutter-desktop: "2.5rem"
  home-section: "4rem / 5rem / 6rem"
  page-section: "3rem / 4rem / 5rem"
  section-header-to-content: "2rem / 2.5rem"
  grid-gap: "1rem / 1.25rem / 1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.forest-deep}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.forest}"
  button-on-photo:
    border: "1px white/70"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
    height: "3rem"
  heading-accent:
    backgroundColor: "{colors.forest}"
    size: "3rem × 0.25rem, fully rounded"
  field:
    backgroundColor: "{colors.white}"
    border: "{colors.control-border}"
    rounded: "{rounded.xl}"
  panel:
    backgroundColor: "{colors.stone}"
    border: "{colors.hairline}"
    rounded: "{rounded.2xl}"
---

# Design System: Home Mix

> Updated 2026-11-03 to match the shipped forest-green direction ("Cinematic room", approved
> 2026-08-06 — see `.impeccable/surfaces/app-page-tsx.md`). The earlier walnut palette in this
> file was never built and has been removed.

## Overview

**Creative North Star: "The Welcoming Living Room"**

Home Mix feels like entering a comfortable, well-kept home: warm, calm, and immediately understandable. Natural furniture photography carries the atmosphere. A warm canvas, a stone secondary surface, white cards and controls, and a single forest-green accent keep the interface familiar and let real products remain the point.

The system is polished through proportion, spacing, legible Georgian typography, and quiet interaction states rather than decorative concepts. It favors straightforward storefront patterns and moderate density.

**Key Characteristics:**

- Warm canvas with forest-green actions and accents
- Natural room and product photography as the main visual voice
- Separation by tone (canvas / stone / white), not by borders or shadows
- Familiar cards, navigation, and controls with soft corners
- Restrained motion and clearly visible keyboard focus

## Colors

### Accent

- **Forest:** The accent for focus outlines, the heading accent bar, active states, and hover text.
- **Forest Deep:** Filled primary buttons, the hero and category-card base, and the footer field.

### Surfaces

- **Canvas:** The page background everywhere.
- **Stone:** The secondary surface — a homepage section band, the catalogue filter panel, the contact form panel. One step darker than Canvas.
- **White:** Contained controls (fields, filter chips) and content cards. Never a full-width section.
- **Mint Tint:** Hover and active fills for chips and quiet controls.

### Text

- **Ink:** Headings, names, values.
- **Quiet Ink:** Descriptions and supporting copy.
- **Meta:** Product categories, field labels, placeholders (placeholders at 70% opacity so they never read as entered values).

### Lines

- **Control Border:** Fields and chips.
- **Hairline:** Panel outlines and dividers.

### Named Rules

**The One Accent Rule.** Forest is the only chromatic accent for ordinary actions and emphasis. Discount red and status colours on product badges are semantic, not decorative.

**The Surface Rule.** Large surfaces are Canvas or Stone. White is reserved for things you touch or read as a unit — fields, chips, cards. Controls inside a Stone panel are white, so they are always the brightest layer.

## Typography

One Georgian-first humanist sans (Noto Sans Georgian Variable) for everything; hierarchy comes from size, weight, and spacing.

### Hierarchy

| Level | Use | Size |
| --- | --- | --- |
| Hero | Headline over photography | clamp(2.25rem, 4.2vw, 4rem) |
| Page title (H1) | Top of inner pages | 2.25rem → 3rem |
| Section title (H2) | Homepage sections | 1.875rem → 2.25rem |
| Sub-section title (H2) | Sections under a page title (e.g. results on `/products`) | 1.5rem → 1.875rem |
| Card title | Product name 1rem; category name 1.25 → 1.5rem | |
| Body | Descriptions, 0.875 → 1rem, relaxed leading | |
| Label | Buttons, nav, links: 0.875rem semibold | |
| Meta | Card metadata, field labels: 0.75rem semibold | |

### Heading accent

Page titles and section titles that sit on a page surface carry a short forest bar beneath them (48 × 4px, rounded, an `after:` pseudo-element — no extra markup). Gap: 1rem under page titles, 0.75rem under section titles.

Headings framed by something else do **not** get the bar: titles inside cards or panels, subheadings after a divider, the product name, error/404 headings, and footer headings.

Never underline headings: underlines mean "link" here (see navigation), and Georgian descenders break text underlines.

## Layout

- **Containers:** homepage, header, and footer use a 96rem container; inner pages use 80rem.
- **Gutters:** 1rem → 1.5rem at 640px → 2.5rem at 1024px.
- **Section rhythm:** homepage sections 4rem / 5rem / 6rem; inner pages 3rem / 4rem / 5rem.
- **Section header → content:** 2rem → 2.5rem.
- **Grid gaps:** 1rem / 1.25rem / 1.5rem columns across breakpoints; product rows add 2.5rem vertical gap for their text block.

### Homepage sequence

Hero (dark photograph) → categories (Stone band) → newest products (Canvas) → footer (Forest Deep). Categories come first as **compact** navigation (288 / 320 / 384px cards), so products still arrive quickly; they swipe on touch widths and become a plain 4-column grid from 1024px, because a desktop mouse cannot reach cards in a horizontal rail with a hidden scrollbar.

Every homepage section uses the same header: title + accent bar, optional description, and a "ყველას ნახვა" link on the right at every width (it wraps under the title on narrow screens). A full-width Hairline closes the header, tying the link to its title and marking where the section content starts. The products section closes with the primary "ყველა პროდუქტის ნახვა" button.

## Elevation & Depth

Flat. Separation comes from tone. Shadows exist only on temporary overlays:

- **Drawer:** `-18px 0 50px rgba(12,34,25,0.18)` — mobile navigation panel.
- **Popover:** `0 16px 40px rgba(12,34,25,0.16)` — filter dropdowns.

Photography gains readable depth through dark gradients, never floating text panels.

## Shapes

Softly rectangular, never pill-shaped (count badges excepted). Panels use the 2xl radius; controls, buttons, and image frames use xl.

## Components

All interactive controls are at least 44px and have an explicit 2px focus outline (white on photography).

### Buttons

- **Primary:** Forest Deep fill, white semibold label, 48px tall, optional trailing arrow that nudges right on hover. Hover lightens to Forest.
- **On photography:** 1px white/70 outline, white label; inverts to white fill on hover.
- **Text link with arrow:** "ყველას ნახვა" pattern for section-level navigation.

### Fields

The label sits **inside** the white bordered box, small and muted at the top-left; the value sits below it. The box carries hover (Forest border) and focus (`focus-within` ring) for whatever it wraps, and the whole box is the click target. Textareas keep the label in flow so it never covers typed text. Text in fields should be 1rem so iOS does not zoom on focus; the contact form follows this, the catalogue filter (0.875rem) does not yet.

### Panels

Stone fill, Hairline border, 2xl radius, white controls inside. Used for the catalogue filter and the contact form.

### Navigation

Logo left, route links centre, search and outlined catalogue action right. Active and hover links use Forest text and a 1px underline that grows from the left.

### Hero Slider

Full-bleed room photograph, dark gradient from the lower left, short white copy and one outlined action (rendered only when a slide has both `href` and `actionLabel`). Hairline pagination and outlined previous/next controls sit near the lower edge; autoplay pauses off-screen, in hidden tabs, and under reduced motion.

### Product Card

The 4:3 image leads; no card shell, border, or shadow — the rows are told apart by type and colour alone:

1. **Meta:** category in Meta grey; condition in Forest with a small Forest dot (a state indicator, so it never reads as a second category).
2. **Name:** Ink, semibold, at most two lines; no reserved height, so a one-line name sits 12px above the divider.
3. **Price row:** below a Hairline divider, pinned to the card bottom so dividers still align across a grid row. Price is the strongest text (Forest Deep, bold, tabular), the old price sits beside it struck through in Meta, and a Forest arrow on the right nudges up-right on hover.

At most one image badge (discount beats "new"). Hover scales the image and nudges the arrow. `ProductCardSkeleton` mirrors these rows.

### Category Card

A photographic panel with a dark bottom gradient, the category name, and a 44px outlined arrow tile that inverts on hover.

## Do's and Don'ts

### Do

- **Do** let room and product photography carry the first impression.
- **Do** separate sections and groups by tone before reaching for borders or shadows.
- **Do** keep controls white and brighter than the surface they sit on.
- **Do** reuse the section header and heading accent instead of inventing per-section styling.
- **Do** preserve 44px controls, visible focus outlines, and reduced-motion behaviour.

### Don't

- **Don't** add drafting grids, measurements, numbered metadata, or technical-looking devices.
- **Don't** add a second accent colour or decorative colour fields.
- **Don't** put full-width white sections on the page; white is for contained elements.
- **Don't** add resting shadows to cards.
- **Don't** let categories grow into the main homepage story ahead of real products.
- **Don't** add speculative commerce UI or fabricated proof.
