"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

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
    <header className="sticky top-0 z-50 border-b border-[#e4e2e1]/90 bg-[#fcf9f8]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Home Mix — მთავარი გვერდი"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7f512f]"
        >
          <Image
            src="/logo.png"
            alt="Home Mix"
            width={500}
            height={500}
            priority
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
          />
        </Link>

        <nav aria-label="მთავარი ნავიგაცია" className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f512f]",
                isActive(pathname, item.href)
                  ? "bg-[#e6e2de] text-[#7f512f]"
                  : "text-[#605e5b] hover:bg-white hover:text-[#1b1c1c]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <SheetPrimitive.Root open={open} onOpenChange={setOpen}>
          <SheetPrimitive.Trigger asChild>
            <button
              type="button"
              aria-label="მენიუს გახსნა"
              className="grid size-11 place-items-center rounded-full border border-[#d6c3b8] bg-white text-[#1b1c1c] transition-colors hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f512f] md:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </SheetPrimitive.Trigger>
          <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/35 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
            <SheetPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,360px)] flex-col bg-[#fcf9f8] p-5 shadow-2xl duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
              <SheetPrimitive.Title className="sr-only">მთავარი მენიუ</SheetPrimitive.Title>
              <SheetPrimitive.Description className="sr-only">
                Home Mix-ის გვერდებზე გადასასვლელი ბმულები
              </SheetPrimitive.Description>
              <div className="flex items-center justify-between border-b border-[#e4e2e1] pb-5">
                <Image src="/logo.png" alt="Home Mix" width={500} height={500} className="size-16 object-contain" />
                <SheetPrimitive.Close asChild>
                  <button
                    type="button"
                    aria-label="მენიუს დახურვა"
                    className="grid size-11 place-items-center rounded-full border border-[#d6c3b8] bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f512f]"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </SheetPrimitive.Close>
              </div>
              <nav aria-label="მობილური ნავიგაცია" className="mt-7 flex flex-col gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 items-center rounded-2xl px-5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f512f]",
                      isActive(pathname, item.href)
                        ? "bg-[#e6e2de] text-[#7f512f]"
                        : "text-[#1b1c1c] hover:bg-white",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetPrimitive.Content>
          </SheetPrimitive.Portal>
        </SheetPrimitive.Root>
      </div>
    </header>
  );
}
