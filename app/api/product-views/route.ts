import { createHmac } from "node:crypto";

// Records one product page view. Called by components/product-view-beacon.tsx after the
// page mounts — the product page is static and opened from the prefetch cache on in-site
// navigation, so no server-side page request exists to count. See
// supabase/schemas/08_product_views.sql for the de-duplication rules.
//
// Always answers 204 for a well-formed request, counted or not: a caller learns nothing
// about whether it was filtered as a bot, de-duplicated or capped.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Crawlers that execute JavaScript (Googlebot does) and HTTP clients. Not exhaustive and
// never will be — it removes the honest automated traffic; the per-IP cap in the database
// bounds the rest.
const AUTOMATED_USER_AGENT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pagespeed|curl|wget|python|httpclient|okhttp|axios|node-fetch|go-http|java\//i;

const MAX_BODY_BYTES = 256;

function noContent() {
  return new Response(null, { status: 204 });
}

// Vercel sets x-real-ip / x-forwarded-for itself. Falls back to a constant so local dev
// still counts; every request without an IP then shares one per-IP quota.
function readClientIp(request: Request) {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Browsers always send Origin on POST and a page cannot forge it, so this stops another
// site from spending its own visitors' browsers on inflating our counts. A script can
// forge it, which is what the bot filter and the per-IP cap are for.
function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

// Keyed on the server secret and the UTC date, so the stored hashes cannot be reversed to
// an IP without the secret and cannot link one visitor across days.
function hashVisitorPart(secret: string, kind: string, ...parts: string[]) {
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret)
    .update([kind, day, ...parts].join("|"))
    .digest("hex");
}

function readProductId(text: string) {
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value !== "object" || value === null) return null;
    const productId = (value as { productId?: unknown }).productId;
    return typeof productId === "string" && UUID_PATTERN.test(productId)
      ? productId
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const text = await request.text();
  const productId =
    text.length <= MAX_BODY_BYTES ? readProductId(text) : null;
  if (!productId) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent")?.trim() ?? "";
  if (!userAgent || AUTOMATED_USER_AGENT.test(userAgent)) {
    return noContent();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.PRODUCT_VIEW_SECRET;
  if (!supabaseUrl || !publishableKey || !secret) {
    console.error("Product views are not configured: missing environment variables");
    return noContent();
  }

  const ip = readClientIp(request);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/record_product_view`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_product_id: productId,
        p_visitor_hash: hashVisitorPart(secret, "visitor", ip, userAgent),
        p_ip_hash: hashVisitorPart(secret, "ip", ip),
        p_secret: secret,
      }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(
        "Product view RPC failed:",
        response.status,
        responseText.slice(0, 300),
      );
    }
  } catch (error) {
    console.error("Product view RPC failed:", error);
  }

  return noContent();
}
