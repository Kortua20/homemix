import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-georgian";
import "./globals.css";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";
import { getHomeCategories } from "@/lib/storefront";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Home Mix — ავეჯი თქვენი სახლისთვის",
    template: "%s | Home Mix",
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "furniture",
  keywords: ["ავეჯი", "ავეჯის მაღაზია", "სახლის ავეჯი", "Home Mix"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ka_GE",
    siteName,
    title: "Home Mix — ავეჯი თქვენი სახლისთვის",
    description: siteDescription,
    url: "/",
    images: [
      {
        url: "/hero/living-room.webp",
        alt: "Home Mix-ის ავეჯი თანამედროვე ინტერიერში",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home Mix — ავეჯი თქვენი სახლისთვის",
    description: siteDescription,
    images: ["/hero/living-room.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Feeds the header's catalogue dropdown. Cached in storefront.ts, and a failure only
  // costs the dropdown — never the page — so the header falls back to the plain link.
  const categories = await getHomeCategories().catch(() => []);
  const navCategories = categories.map(({ id, name, slug }) => ({
    id,
    name,
    slug,
  }));

  return (
    <html lang="ka" className="h-full">
      <body className="flex min-h-full flex-col overflow-x-hidden bg-canvas font-sans text-ink antialiased">
        <a
          href="#main-content"
          className="fixed top-3 left-3 z-100 -translate-y-24 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-forest-deep shadow-lg transition-transform focus:translate-y-0 motion-reduce:transition-none"
        >
          მთავარ შინაარსზე გადასვლა
        </a>
        <SiteHeader categories={navCategories} />
        <div id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
