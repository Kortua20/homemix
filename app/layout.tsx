import type { Metadata } from "next";
import "@fontsource-variable/manrope";
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
  return (
    <html lang="ka" className="h-full scroll-smooth">
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[#fcf9f8] font-sans text-[#1b1c1c] antialiased">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
