"use client";

import { useEffect } from "react";

// Tells the server this product page was opened. Renders nothing.
//
// An effect rather than server code because the product page is static: on in-site
// navigation it is opened from the prefetch cache with no request to the server, so the
// browser is the only place a view is observable. The browser reports the event only —
// counting and de-duplication happen in app/api/product-views/route.ts.
//
// Firing twice (React Strict Mode in dev, a remount) is harmless: the database counts a
// visitor at most once per 30 minutes per product.
export function ProductViewBeacon({ productId }: { productId: string }) {
  useEffect(() => {
    const body = JSON.stringify({ productId });

    if (
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(
        "/api/product-views",
        new Blob([body], { type: "application/json" }),
      )
    ) {
      return;
    }

    fetch("/api/product-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // A lost view is not worth surfacing to the visitor.
    });
  }, [productId]);

  return null;
}
