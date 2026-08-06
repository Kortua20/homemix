import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Facebook, Instagram, Mail, Phone } from "lucide-react";
import { contactDetails, socialLinks } from "@/lib/contact-details";

const footerLinks = [
  { label: "მთავარი", href: "/" },
  { label: "პროდუქტები", href: "/products" },
  { label: "ჩვენ შესახებ", href: "/about" },
  { label: "კონტაქტი", href: "/contact" },
] as const;

export function Footer() {
  return (
    <footer
      className="bg-primary text-white"
      style={{ backgroundColor: "#173c2f" }}
    >
      <div className="mx-auto w-full max-w-384 px-4 pt-14 pb-7 sm:px-6 sm:pt-16 lg:px-10 lg:pt-20">
        <div className="grid gap-12 border-b border-white/25 pb-12 sm:grid-cols-2 lg:grid-cols-[1.45fr_0.8fr_1fr_0.7fr] lg:gap-10 lg:pb-16">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="Home Mix — მთავარი გვერდი"
              className="inline-flex rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <Image
                src="/logo.png"
                alt="Home Mix"
                width={500}
                height={500}
                className="size-24 object-contain brightness-0 invert"
              />
            </Link>
            <p className="mt-4 text-xl font-semibold tracking-[-0.02em]">
              ავეჯი თქვენი სახლისთვის
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#e0ebe4]">
              აღმოაჩინეთ თანამედროვე ავეჯი და მშვიდი, კომფორტული სივრცის შექმნის
              იდეები.
            </p>
          </div>

          <nav aria-label="ქვედა ნავიგაცია">
            <h2 className="text-sm font-semibold text-white">ნავიგაცია</h2>
            <ul className="mt-5 space-y-1">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-10 items-center text-sm text-[#e0ebe4] transition-colors hover:text-white focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-white">დაგვიკავშირდით</h2>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3 text-sm text-[#e0ebe4]">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/12 text-white">
                  <Phone className="size-4" aria-hidden="true" />
                </span>
                {contactDetails.phone.href ? (
                  <a href={contactDetails.phone.href} className="hover:text-white hover:underline">
                    {contactDetails.phone.label}
                  </a>
                ) : (
                  <span>{contactDetails.phone.label}</span>
                )}
              </div>
              <Link
                href="/contact"
                className="group flex min-h-10 items-center gap-3 text-sm text-[#e0ebe4] transition-colors hover:text-white focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/12 text-white">
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
            <h2 className="text-sm font-semibold text-white">გამოგვყევით</h2>
            <div className="mt-5 flex gap-2" aria-label="სოციალური ქსელები">
              {socialLinks.facebook ? (
                <a href={socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-11 place-items-center rounded-xl border border-white/35 text-white hover:bg-white hover:text-[#173c2f]">
                  <Facebook className="size-4.5" aria-hidden="true" />
                </a>
              ) : (
                <span className="grid size-11 place-items-center rounded-xl border border-white/35 text-white" title="Facebook-ის ბმული მალე დაემატება" aria-label="Facebook-ის ბმული მალე დაემატება" role="img">
                  <Facebook className="size-4.5" aria-hidden="true" />
                </span>
              )}
              {socialLinks.instagram ? (
                <a href={socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-11 place-items-center rounded-xl border border-white/35 text-white hover:bg-white hover:text-[#173c2f]">
                  <Instagram className="size-4.5" aria-hidden="true" />
                </a>
              ) : (
                <span className="grid size-11 place-items-center rounded-xl border border-white/35 text-white" title="Instagram-ის ბმული მალე დაემატება" aria-label="Instagram-ის ბმული მალე დაემატება" role="img">
                  <Instagram className="size-4.5" aria-hidden="true" />
                </span>
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-[#bed0c5]">
              ბმულები მოგვიანებით დაემატება
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-6 text-xs text-[#bed0c5] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Home Mix. ყველა უფლება დაცულია.</p>
        </div>
      </div>
    </footer>
  );
}
