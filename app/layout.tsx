import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/noto-sans-georgian";
import "./globals.css";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "Home Mix — ავეჯი თქვენი სახლისთვის",
    template: "%s | Home Mix",
  },
  description:
    "Home Mix — კომფორტული და დახვეწილი ავეჯი ყოველდღიური ცხოვრებისთვის.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const directionContract = `<!--
THESIS: Home Mix is a simple, welcoming furniture store that puts real products and easy catalog browsing ahead of visual concepts.
OWN-WORLD: Warm off-white space, clear Georgian typography, natural furniture photography, restrained brown actions, and softly finished product surfaces.
STORY: A visitor moves from a comfortable home into live products, searches or filters the catalog, chooses a useful sort order, and opens one truthful product record.
FIRST VIEWPORT: The homepage leads with one calm room photograph; the catalog leads with its name, one compact search-category-sort row, and live results immediately below.
FORM: The catalog is a precise established-world extension of the user-directed distillation that followed the client's rejection of concept seed 218b761a as too complex and modern; no new concept roll was required.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

  return (
    <html lang="ka" className="h-full scroll-smooth">
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[#fcf9f8] font-sans text-[#1b1c1c] antialiased">
        <template dangerouslySetInnerHTML={{ __html: directionContract }} />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
