import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Facebook, Mail, MapPin, Phone } from "lucide-react";
import { BrandIcon } from "@/components/brand-icons";
import { contactDetails, socialLinks } from "@/lib/contact-details";

const footerLinks = [
  { label: "მთავარი", href: "/" },
  { label: "პროდუქტები", href: "/products" },
  { label: "კატალოგი", href: "/categories" },
  { label: "ჩვენ შესახებ", href: "/about" },
  { label: "კონტაქტი", href: "/contact" },
] as const;

const footerLinkClass =
  "group inline-flex min-h-10 items-center gap-3 text-sm text-white/80 transition-colors hover:text-white focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const iconTileClass =
  "grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white";

const socialButtonClass =
  "grid size-11 place-items-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function Footer() {
  return (
    <footer className="mt-auto bg-forest-deep text-white">
      <div className="page-container pt-12 pb-7 sm:pt-14 lg:pt-16">
        <div className="grid gap-10 border-b border-white/15 pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1.1fr_0.7fr] lg:gap-10 lg:pb-12">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="Home Mix — მთავარი გვერდი"
              className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <Image
                src="/logo.png"
                alt="Home Mix"
                width={500}
                height={500}
                className="size-20 object-contain brightness-0 invert"
              />
            </Link>
            <p className="mt-4 text-lg font-bold">კომფორტი, რომელიც გიყვარს</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-white/75">
              გვეწვიეთ Home Mix - ში, აქ დაგხვდებათ საუკეთესო ფასები და არჩევანი
              თქვენი სახლის სილამაზისთვის
            </p>
          </div>

          <nav aria-label="ქვედა ნავიგაცია">
            <h2 className="text-sm font-bold text-white">ნავიგაცია</h2>
            <ul className="mt-4 space-y-0.5">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold text-white">დაგვიკავშირდით</h2>
            {/* flex-col, not space-y: the rows are inline-flex links, which would otherwise
                sit side by side whenever two short ones fit on one line. */}
            <div className="mt-4 flex flex-col items-start gap-3">
              {contactDetails.phone.href ? (
                <a href={contactDetails.phone.href} className={footerLinkClass}>
                  <span className={iconTileClass}>
                    <Phone className="size-4" aria-hidden="true" />
                  </span>
                  {contactDetails.phone.label}
                </a>
              ) : (
                <p className="flex items-center gap-3 text-sm text-white/80">
                  <span className={iconTileClass}>
                    <Phone className="size-4" aria-hidden="true" />
                  </span>
                  {contactDetails.phone.label}
                </p>
              )}
              {socialLinks.whatsapp ? (
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className={footerLinkClass}
                >
                  <span className={iconTileClass}>
                    <BrandIcon glyph="whatsapp" className="size-4.5" />
                  </span>
                  WhatsApp
                  <ArrowUpRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </a>
              ) : null}
              {socialLinks.messenger ? (
                <a
                  href={socialLinks.messenger}
                  target="_blank"
                  rel="noreferrer"
                  className={footerLinkClass}
                >
                  <span className={iconTileClass}>
                    <BrandIcon glyph="messenger" className="size-4.5" />
                  </span>
                  Messenger
                  <ArrowUpRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </a>
              ) : null}
              <a
                href={contactDetails.mapUrl}
                target="_blank"
                rel="noreferrer"
                className={footerLinkClass}
              >
                <span className={iconTileClass}>
                  <MapPin className="size-4" aria-hidden="true" />
                </span>
                <span>{contactDetails.address}</span>
                <ArrowUpRight
                  className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </a>
              <Link href="/contact" className={footerLinkClass}>
                <span className={iconTileClass}>
                  <Mail className="size-4" aria-hidden="true" />
                </span>
                საკონტაქტო ფორმა
                <ArrowUpRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">გამოგვყევით</h2>
            <div className="mt-4 flex gap-2" aria-label="სოციალური ქსელები">
              {socialLinks.facebook ? (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className={socialButtonClass}
                >
                  <Facebook className="size-4.5" aria-hidden="true" />
                </a>
              ) : null}
              {socialLinks.whatsapp ? (
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className={socialButtonClass}
                >
                  <BrandIcon glyph="whatsapp" className="size-5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <section
          aria-labelledby="footer-payment-options"
          className="flex flex-col gap-5 border-b border-white/15 py-7 md:flex-row md:items-center md:justify-between md:gap-10"
        >
          <div className="max-w-xl">
            <h2
              id="footer-payment-options"
              className="text-sm font-bold text-white"
            >
              გადახდის შესაძლებლობები
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/75">
              ჩვენს მაღაზიაში შეგიძლიათ ისარგებლოთ საქართველოს ბანკის
              განვადებით და ნაწილ-ნაწილ გადახდით.
            </p>
          </div>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <li className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white">
                <Image
                  src="/payments/bog.png"
                  alt="საქართველოს ბანკი"
                  width={96}
                  height={96}
                  className="size-7 object-contain"
                />
              </span>
              განვადება
            </li>
            <li>
              <Image
                src="/payments/natsil-natsil-white.png"
                alt="ნაწილ-ნაწილ"
                width={738}
                height={288}
                className="h-9 w-auto"
              />
            </li>
          </ul>
        </section>

        <p className="pt-6 text-xs text-white/65">
          © {new Date().getFullYear()} Home Mix. ყველა უფლება დაცულია.
        </p>
      </div>
    </footer>
  );
}
