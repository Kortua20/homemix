"use client";

import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  Facebook,
  MapPin,
  Menu,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useId, useState } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { contactDetails, socialLinks } from "@/lib/contact-details";

export type NavCategory = { id: string; name: string; slug: string };

const navigation = [
  { label: "მთავარი", href: "/" },
  { label: "პროდუქტები", href: "/products" },
  { label: "კატალოგი", href: "/categories" },
  { label: "ჩვენ შესახებ", href: "/about" },
  { label: "კონტაქტი", href: "/contact" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const navLinkClass =
  "relative flex min-h-11 items-center gap-1 px-1 text-sm font-semibold transition-colors after:absolute after:inset-x-1 after:bottom-1.5 after:h-0.5 after:origin-left after:rounded-full after:bg-brass after:transition-transform hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest";

// Search goes to the existing catalogue search (/products?q=). next/form keeps it a
// client-side navigation and still works as a plain GET form without JavaScript.
function HeaderSearch({
  className,
  onSubmit,
}: {
  className?: string;
  onSubmit?: () => void;
}) {
  const inputId = useId();

  return (
    <Form
      action="/products"
      role="search"
      onSubmit={onSubmit}
      className={cn("relative", className)}
    >
      <label className="sr-only" htmlFor={inputId}>
        პროდუქტის ძიება
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        maxLength={100}
        placeholder="ძებნა..."
        className="h-11 w-full rounded-full border border-transparent bg-sand/60 pr-12 pl-5 text-base text-ink placeholder:text-meta transition-colors hover:border-control focus:border-forest focus:bg-white focus:outline-none sm:text-sm"
      />
      <button
        type="submit"
        aria-label="ძიება"
        className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-muted transition-colors hover:bg-mint hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-forest"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
    </Form>
  );
}

export function SiteHeader({ categories = [] }: { categories?: NavCategory[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_1px_0_var(--color-line)]">
      <div className="bg-forest-deep text-white">
        <div className="page-container flex h-9 items-center justify-between gap-4 text-xs">
          <div className="flex min-w-0 items-center gap-5">
            {contactDetails.phone.href ? (
              <a
                href={contactDetails.phone.href}
                className="flex shrink-0 items-center gap-2 font-semibold focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Phone className="size-3.5" aria-hidden="true" />
                {contactDetails.phone.label}
              </a>
            ) : (
              <span className="flex shrink-0 items-center gap-2 font-semibold">
                <Phone className="size-3.5" aria-hidden="true" />
                {contactDetails.phone.label}
              </span>
            )}
            <a
              href={contactDetails.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden min-w-0 items-center gap-2 text-white/85 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:flex"
            >
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{contactDetails.address}</span>
            </a>
          </div>
          <div className="flex items-center gap-5">
            <p className="hidden items-center gap-2 text-white/85 lg:flex">
              <CreditCard className="size-3.5" aria-hidden="true" />
              მაღაზიაში ხელმისაწვდომია განვადება და ნაწილ-ნაწილ გადახდა
            </p>
            {socialLinks.facebook ? (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="grid size-7 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
              >
                <Facebook className="size-4" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="page-container flex h-18 items-center gap-6 sm:h-20">
        <Link
          href="/"
          aria-label="Home Mix — მთავარი გვერდი"
          className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
        >
          {/* TODO(asset): swap for a horizontal logo lockup (icon + wordmark side by side,
              as in the reference) once provided — e.g. /logo-horizontal.svg. */}
          <Image
            src="/logo.png"
            alt="Home Mix"
            width={500}
            height={500}
            preload
            className="size-16 object-contain sm:size-[4.5rem]"
          />
          <span className="hidden text-[11px] leading-tight font-semibold text-meta xl:block">
            ახალი და მეორადი ავეჯი
          </span>
        </Link>

        <nav
          aria-label="მთავარი ნავიგაცია"
          className="hidden items-center gap-5 lg:flex xl:gap-7"
        >
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);
            const linkClass = cn(
              navLinkClass,
              active ? "text-forest after:scale-x-100" : "text-ink after:scale-x-0",
            );

            // The catalogue link doubles as a category menu. It opens on hover and on
            // keyboard focus (focus-within), and the link itself still goes to /categories.
            if (item.href === "/categories" && categories.length > 0) {
              return (
                <div key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={linkClass}
                  >
                    {item.label}
                    <ChevronDown
                      className="size-3.5 transition-transform group-focus-within:rotate-180 group-hover:rotate-180 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </Link>
                  <div className="invisible absolute top-full left-1/2 z-50 w-64 -translate-x-1/2 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="rounded-lg border border-line bg-white p-2 shadow-popover">
                      {categories.map((category) => (
                        <li key={category.id}>
                          <Link
                            href={`/categories/${encodeURIComponent(category.slug)}`}
                            className="flex min-h-10 items-center rounded-md px-3 text-sm text-ink transition-colors hover:bg-mint hover:text-forest focus-visible:bg-mint focus-visible:outline-none"
                          >
                            {category.name}
                          </Link>
                        </li>
                      ))}
                      <li className="mt-1 border-t border-line pt-1">
                        <Link
                          href="/categories"
                          className="flex min-h-10 items-center justify-between rounded-md px-3 text-sm font-semibold text-forest transition-colors hover:bg-mint focus-visible:bg-mint focus-visible:outline-none"
                        >
                          ყველა კატეგორია
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={linkClass}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <HeaderSearch className="ml-auto hidden w-56 md:block xl:w-64" />

        <Link
          href="/products"
          aria-label="პროდუქტების ძიება"
          className="ml-auto grid size-11 place-items-center rounded-full text-forest-deep transition-colors hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest md:hidden"
        >
          <Search className="size-5" aria-hidden="true" />
        </Link>

        <SheetPrimitive.Root open={open} onOpenChange={setOpen}>
          <SheetPrimitive.Trigger asChild>
            <button
              type="button"
              aria-label="მენიუს გახსნა"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-control bg-white text-ink transition-colors hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </SheetPrimitive.Trigger>
          <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/35 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
            <SheetPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(90vw,380px)] flex-col overflow-y-auto bg-canvas p-5 shadow-drawer duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
              <SheetPrimitive.Title className="sr-only">
                მთავარი მენიუ
              </SheetPrimitive.Title>
              <SheetPrimitive.Description className="sr-only">
                Home Mix-ის გვერდებზე გადასასვლელი ბმულები
              </SheetPrimitive.Description>
              <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
                <Image
                  src="/logo.png"
                  alt=""
                  width={500}
                  height={500}
                  className="size-14 object-contain"
                />
                <SheetPrimitive.Close asChild>
                  <button
                    type="button"
                    aria-label="მენიუს დახურვა"
                    className="grid size-11 place-items-center rounded-full border border-control bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </SheetPrimitive.Close>
              </div>
              <HeaderSearch className="mt-5" onSubmit={() => setOpen(false)} />
              <nav
                aria-label="მობილური ნავიგაცია"
                className="mt-4 flex flex-col"
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
                      "flex min-h-14 items-center border-b border-line px-2 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
                      isActive(pathname, item.href)
                        ? "text-forest"
                        : "text-ink hover:text-forest",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Link
                href="/categories"
                onClick={() => setOpen(false)}
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-forest-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest"
              >
                კატალოგის ნახვა
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-ink-muted">
                <CreditCard
                  className="mt-1 size-4 shrink-0 text-forest"
                  aria-hidden="true"
                />
                მაღაზიაში ხელმისაწვდომია განვადება და ნაწილ-ნაწილ გადახდა
              </p>
            </SheetPrimitive.Content>
          </SheetPrimitive.Portal>
        </SheetPrimitive.Root>
      </div>
    </header>
  );
}
