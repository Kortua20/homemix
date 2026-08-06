import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-georgian";
import "./globals.css";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const directionContract = `<!--
THESIS: Home Mix turns the homepage into a cinematic Georgian showroom, refusing both cluttered promotion walls and generic beige card grids.
OWN-WORLD: Forest green fields, chalk-white space, charcoal type, fine brass details, image-led surfaces, crisp 12–16px corners, and line-based controls.
STORY: A visitor enters a real furnished room, browses live categories and products, then continues through the unchanged catalog, about, and contact routes.
FIRST VIEWPORT: A two-tier retail header opens directly onto a wide room photograph with lower-left Georgian copy, one outlined catalog action, and quiet slider controls.
FORM: Approved composition B, Cinematic room, first presented in .impeccable/mocks/homepage-b-cinematic.png; user approval recorded 2026-08-06.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

  return (
    <html lang="ka" className="h-full scroll-smooth">
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[#f4f2ed] font-sans text-[#18221d] antialiased">
        <template dangerouslySetInnerHTML={{ __html: directionContract }} />
        <a
          href="#main-content"
          className="fixed top-3 left-3 z-100 -translate-y-24 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#173c2f] shadow-lg transition-transform focus:translate-y-0 motion-reduce:transition-none"
        >
          მთავარ შინაარსზე გადასვლა
        </a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
