export const siteName = "Home Mix";

export const siteDescription =
  "Home Mix — თანამედროვე და კომფორტული ავეჯი თქვენი სახლისთვის.";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  try {
    return new URL(
      configuredUrl
        ? configuredUrl.startsWith("http")
          ? configuredUrl
          : `https://${configuredUrl}`
        : "http://localhost:3000",
    );
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}
