import { buildMetaFeedCsv } from "@/lib/meta-feed-csv";
import { getFeedProducts } from "@/lib/storefront";

// Meta Commerce Manager catalog feed: https://www.homemix.ge/api/meta-feed.csv, fetched by
// Meta on a schedule to keep the Facebook catalog in sync with the site.
//
// Public by design — Meta's crawler sends no credentials. Reads through the storefront's
// publishable-key client, so it sees exactly what an anonymous visitor can (RLS hides
// draft/archived rows). Only GET is exported; Next.js answers other methods with 405.
//
// Route handlers are not cached by Next.js, so every origin request reads fresh data. The
// CDN may serve a copy for 15 minutes and keep serving it for up to an hour while it
// revalidates in the background — fine for a feed Meta fetches at most hourly.
export async function GET() {
  try {
    const csv = buildMetaFeedCsv(await getFeedProducts());
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Details go to the server logs only, never to the response.
    console.error("Meta feed export failed:", error);
    return new Response("Feed temporarily unavailable\n", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
