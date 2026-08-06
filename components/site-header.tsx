"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Menu,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { contactDetails, socialLinks } from "@/lib/contact-details";

const navigation = [
  { label: "მთავარი", href: "/" },
  { label: "პროდუქტები", href: "/products" },
  { label: "ჩვენ შესახებ", href: "/about" },
  { label: "კონტაქტი", href: "/contact" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="bg-[#173c2f] text-white">
        <div className="mx-auto flex h-9 w-full max-w-384 items-center justify-between px-4 sm:px-6 lg:px-10">
          {contactDetails.phone.href ? (
            <a
              href={contactDetails.phone.href}
              className="flex items-center gap-2 text-xs font-semibold focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-sm"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              {contactDetails.phone.label}
            </a>
          ) : (
            <span className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
              <Phone className="size-3.5" aria-hidden="true" />
              {contactDetails.phone.label}
            </span>
          )}
          <span className="flex items-center gap-4 text-white/90">
            {socialLinks.facebook ? (
              <a href={socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                <Facebook className="size-4" aria-hidden="true" />
              </a>
            ) : (
              <span role="img" aria-label="Facebook-ის ბმული მალე დაემატება" title="Facebook">
                <Facebook className="size-4" aria-hidden="true" />
              </span>
            )}
            {socialLinks.instagram ? (
              <a href={socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram className="size-4" aria-hidden="true" />
              </a>
            ) : (
              <span role="img" aria-label="Instagram-ის ბმული მალე დაემატება" title="Instagram">
                <Instagram className="size-4" aria-hidden="true" />
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="mx-auto flex h-18 w-full max-w-384 items-center justify-between px-4 sm:h-20.5 sm:px-6 lg:px-10">
        <Link
          href="/"
          aria-label="Home Mix — მთავარი გვერდი"
          className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
        >
          <Image
            src="/logo.png"
            alt="Home Mix"
            width={500}
            height={500}
            preload
            className="size-20 object-contain"
          />
        </Link>

        <nav
          aria-label="მთავარი ნავიგაცია"
          className="hidden items-center gap-6 lg:flex xl:gap-8"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 items-center px-1 text-sm font-semibold transition-colors after:absolute after:inset-x-1 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-[#1d4a38] after:transition-transform hover:text-[#1d4a38] hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]",
                isActive(pathname, item.href)
                  ? "text-[#1d4a38] after:scale-x-100"
                  : "text-[#4f5d54]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex lg:ml-0">
          <Link
            href="/products"
            aria-label="პროდუქტების ძიება"
            className="grid size-11 place-items-center rounded-xl text-[#173c2f] transition-colors hover:bg-[#e9eee9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4a38]"
          >
            <Search className="size-5" aria-hidden="true" />
          </Link>
          <Link
            href="/products"
            className="group hidden min-h-11 items-center gap-2 rounded-xl border border-[#173c2f] px-5 text-sm font-semibold text-[#173c2f] transition-colors hover:bg-[#173c2f] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38] md:inline-flex"
          >
            კატალოგის ნახვა
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Link>
        </div>

        <SheetPrimitive.Root open={open} onOpenChange={setOpen}>
          <SheetPrimitive.Trigger asChild>
            <button
              type="button"
              aria-label="მენიუს გახსნა"
              className="ml-2 grid size-11 place-items-center rounded-xl border border-[#b9c6bd] bg-white text-[#18221d] transition-colors hover:bg-[#e9eee9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4a38] lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </SheetPrimitive.Trigger>
          <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/35 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
            <SheetPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(90vw,380px)] flex-col bg-[#f4f2ed] p-5 shadow-[-18px_0_50px_rgba(12,34,25,0.18)] duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
              <SheetPrimitive.Title className="sr-only">
                მთავარი მენიუ
              </SheetPrimitive.Title>
              <SheetPrimitive.Description className="sr-only">
                Home Mix-ის გვერდებზე გადასასვლელი ბმულები
              </SheetPrimitive.Description>
              <div className="flex items-center justify-between border-b border-[#d8ded8] pb-5">
                <div className=""></div>
                <SheetPrimitive.Close asChild>
                  <button
                    type="button"
                    aria-label="მენიუს დახურვა"
                    className="grid size-11 place-items-center rounded-xl border border-[#b9c6bd] bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4a38]"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </SheetPrimitive.Close>
              </div>
              <nav
                aria-label="მობილური ნავიგაცია"
                className="mt-6 flex flex-col"
              >
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={
                      isActive(pathname, item.href) ? "page" : undefined
                    }
                    className={cn(
                      "flex min-h-14 items-center border-b border-[#d8ded8] px-2 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4a38]",
                      isActive(pathname, item.href)
                        ? "text-[#1d4a38]"
                        : "text-[#18221d] hover:text-[#1d4a38]",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#173c2f] px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38]"
              >
                კატალოგის ნახვა
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </SheetPrimitive.Content>
          </SheetPrimitive.Portal>
        </SheetPrimitive.Root>
      </div>
    </header>
  );
}
