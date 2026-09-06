import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TEMPORARY: Vercel image-optimization quota is exhausted, so /_next/image
    // returns 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) for every image.
    // Bypassing the optimizer serves images straight from
    // /api/{product,category}-images/*, which already send
    // Cache-Control: public, max-age=86400, s-maxage=604800.
    //
    // Tradeoff: no WebP/AVIF conversion and no responsive resizing — each
    // request downloads the full-size R2 original, and every request now hits
    // the serverless image routes instead of the optimizer cache.
    //
    // Remove once images are served over the R2 + Cloudflare CDN path.
    unoptimized: true,
  },
};

export default nextConfig;
