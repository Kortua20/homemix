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
THESIS: Home Mix turns furniture browsing into a maker's workshop index and refuses the generic rounded-card showroom.
OWN-WORLD: Warm drafting paper, walnut fields, graphite rules, faded blueprint blue, square controls, measured seams, and natural furniture photography.
STORY: A Georgian visitor meets a clear promise, browses real rooms and categories, then enters the live product catalog.
FIRST VIEWPORT: Oversized Georgian copy interlocks with a tall pinned room photograph; the walnut catalog action sits inside the drawing title block.
FORM: Workshop Index, grounded direction 5, seed 218b761a.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

  return (
    <html lang="ka" className="h-full scroll-smooth">
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[#f4efe7] font-sans text-[#251b16] antialiased">
        <template dangerouslySetInnerHTML={{ __html: directionContract }} />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
