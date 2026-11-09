import { NextResponse, type NextRequest } from "next/server";

// 308s the pre-transliteration URLs (/product/საწოლი, /categories/საწოლები,
// /products?category=საწოლები) to their current Latin slugs — see
// supabase/migrations/20261109000000_transliterate_slugs.sql.
//
// Here and not only in the pages: those pages stream (they have a loading.tsx), so by the
// time a page finds out its slug is old, a 200 has already been sent and
// permanentRedirect() can only emit a <meta refresh>. Crawlers and the Meta catalog should
// get a real 308, and Proxy runs before rendering starts.
//
// Only slugs that are NOT lowercase ASCII are looked up. The database CHECK makes it
// impossible for a live slug to be anything else, so every such request is a legacy URL
// (or junk) and ordinary page views never pay for a lookup. A later Latin → Latin rename in
// the admin is still caught by the pages' own fallback, as a meta refresh.

const LIVE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const REDIRECT_TABLES = {
  product: { table: "product_slug_redirects", embed: "products" },
  category: { table: "category_slug_redirects", embed: "categories" },
} as const;

type SlugKind = keyof typeof REDIRECT_TABLES;

function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value).trim().normalize("NFC");
  } catch {
    return null;
  }
}

async function findCurrentSlug(kind: SlugKind, oldSlug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return null;

  const { table, embed } = REDIRECT_TABLES[kind];
  const query = new URLSearchParams({
    select: `target:${embed}(slug)`,
    old_slug: `eq.${oldSlug}`,
  });

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) {
      console.error("Slug redirect lookup failed:", response.status);
      return null;
    }
    const rows = (await response.json()) as { target: { slug: string } | null }[];
    return rows[0]?.target?.slug ?? null;
  } catch (error) {
    // Falling through is safe: the page renders, misses, and runs its own fallback.
    console.error("Slug redirect lookup failed:", error);
    return null;
  }
}

// /products?category=<old> — the catalogue's category filter carries a slug too.
async function redirectCategoryFilter(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category")?.trim().normalize("NFC");
  if (!category || LIVE_SLUG.test(category)) return NextResponse.next();

  const currentSlug = await findCurrentSlug("category", category);
  if (!currentSlug) return NextResponse.next();

  // Clone, so every other filter survives the redirect.
  const target = request.nextUrl.clone();
  target.searchParams.set("category", currentSlug);
  return NextResponse.redirect(target, 308);
}

export async function proxy(request: NextRequest) {
  const [, route, rawSlug] = request.nextUrl.pathname.split("/");
  if (route === "products") return redirectCategoryFilter(request);

  const kind: SlugKind | null =
    route === "product" ? "product" : route === "categories" ? "category" : null;
  if (!kind || !rawSlug) return NextResponse.next();

  const slug = decodeSlug(rawSlug);
  // Malformed percent-encoding (/product/%E0%A4%A) otherwise reaches Next's param decoding
  // and surfaces as a 500. It can never name a product, so it is a plain 404.
  if (slug === null) return new NextResponse("Not Found", { status: 404 });
  if (LIVE_SLUG.test(slug)) return NextResponse.next();

  const currentSlug = await findCurrentSlug(kind, slug);
  if (!currentSlug) return NextResponse.next();

  // Clone, so the query string (category filters, page) survives the redirect.
  const target = request.nextUrl.clone();
  target.pathname = `/${route}/${encodeURIComponent(currentSlug)}`;
  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: ["/product/:slug", "/categories/:slug", "/products"],
};
