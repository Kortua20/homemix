# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Home Mix serves Georgian customers who are browsing furniture for their homes. They need to discover relevant categories, compare real products, and understand each product comfortably on both mobile and desktop.

## Product Purpose

The public website presents Home Mix furniture in Georgian and helps customers move quickly from inspiration to real categories and product details. Success means visitors can confidently discover the current catalog without encountering stale, fabricated, or administrative information.

## Positioning

Home Mix combines a warm, considered furniture-shopping experience with a catalog that stays directly aligned with the products and categories maintained in the existing Home Mix administration portal.

## Operating Context

Customers browse a public storefront while Home Mix staff maintain categories, products, and product imagery in a separate administration portal. The storefront reads those live records from Supabase and serves private Cloudflare R2 product imagery through a read-only server endpoint.

## Capabilities and Constraints

- The customer experience is entirely in Georgian and must support Georgian Unicode slugs.
- The public routes are the homepage, product catalog, product detail, about, and contact pages.
- The homepage presents a static furniture-image story followed by all live categories and the newest live products.
- Product and category content comes from Supabase; product images come from a private Cloudflare R2 bucket through server-only credentials.
- The storefront has no cart, checkout, customer accounts, favorites, reviews, inventory controls, or administration features.
- Product data and missing/error states must remain truthful; no mock products, fabricated business claims, or invented contact details.
- Mobile quality is the highest priority, with no horizontal overflow and usable controls at narrow widths.

## Brand Commitments

- Brand name: Home Mix.
- `/public/logo.png` is the established brand mark and must remain the header, footer, favicon, and Apple touch icon.
- The experience should feel warm, minimal, thoughtful, and made for everyday living.
- The homepage should feel distinctive and editorial rather than generic, templated, or visibly AI-generated.
- The established warm neutral and brown identity remains binding.

## Evidence on Hand

- Real categories, products, and product-image metadata are available through the configured Supabase project.
- Real product files are stored in the configured private Cloudflare R2 bucket.
- Three static furniture photographs are available in `/public/hero`.
- The current public implementation provides working content, interaction, loading/error behavior, and accessibility evidence, but is an anti-reference for the replacement visual world.
- No testimonials, awards, founding dates, staff counts, addresses, contact details, or other external proof have been provided and none may be fabricated.

## Product Principles

1. Lead customers from inspiration to the real catalog without friction.
2. Let authentic furniture imagery and live product data carry the experience.
3. Keep every claim, product state, and contact detail honest.
4. Make Georgian mobile browsing first-class, not a compressed desktop afterthought.
5. Preserve the operational separation between the public storefront and administration portal.

## Accessibility & Inclusion

The website must provide keyboard-accessible navigation and slider controls, visible focus states, semantic landmarks and headings, descriptive Georgian labels, reduced-motion support, meaningful product-image alternatives, and touch targets of at least 44 by 44 pixels.
