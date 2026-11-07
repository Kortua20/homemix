import { buildPriceListCsv } from "@/lib/price-list-csv";
import { getPriceListItems } from "@/lib/storefront";

// Public, read-only price list for Google Sheets (=IMPORTDATA("https://homemix.ge/prices.csv")),
// which a Meta Business Agent reads to answer price questions.
//
// Reads through the storefront's publishable-key client, so it sees exactly what an
// anonymous visitor can: RLS hides draft/archived rows. Only GET is exported; Next.js
// answers other methods with 405.
//
// Not cached by Next.js (route handlers are dynamic by default). s-maxage lets Vercel's CDN
// serve repeat requests for 5 minutes, so polling this URL does not hit the database each
// time; max-age=300 alone would only cache in the client.
export async function GET() {
  try {
    const csv = buildPriceListCsv(await getPriceListItems());
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Details go to the server logs only, never to the response.
    console.error("Price list export failed:", error);
    return new Response("Internal Server Error\n", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
