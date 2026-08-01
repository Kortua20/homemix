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
    <header className="sticky top-0 z-50 border-b border-[#e4e2e1] bg-[#fcf9f8]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Home Mix — მთავარი გვერდი"
          className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f]"
        >
          <Image src="/logo.png" alt="Home Mix" width={500} height={500} priority className="size-11 object-contain sm:size-13" />
          <span className="truncate text-lg font-bold tracking-[-0.02em] text-[#1b1c1c]">Home Mix</span>
        </Link>

        <nav aria-label="მთავარი ნავიგაცია" className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 items-center px-1 text-sm font-semibold transition-colors after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[#7f512f] after:transition-transform hover:text-[#7f512f] hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f]",
                isActive(pathname, item.href)
                  ? "text-[#7f512f] after:scale-x-100"
                  : "text-[#605e5b]",
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
              className="grid size-11 place-items-center rounded-xl border border-[#d6c3b8] bg-white text-[#1b1c1c] transition-colors hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f512f] md:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </SheetPrimitive.Trigger>
          <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/35 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
            <SheetPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(90vw,360px)] flex-col bg-[#fcf9f8] p-5 shadow-[-18px_0_50px_rgba(36,25,19,0.16)] duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
              <SheetPrimitive.Title className="sr-only">მთავარი მენიუ</SheetPrimitive.Title>
              <SheetPrimitive.Description className="sr-only">Home Mix-ის გვერდებზე გადასასვლელი ბმულები</SheetPrimitive.Description>
              <div className="flex items-center justify-between border-b border-[#e4e2e1] pb-5">
                <div className="flex items-center gap-3">
                  <Image src="/logo.png" alt="Home Mix" width={500} height={500} className="size-12 object-contain" />
                  <span className="font-bold text-[#1b1c1c]">Home Mix</span>
                </div>
                <SheetPrimitive.Close asChild>
                  <button type="button" aria-label="მენიუს დახურვა" className="grid size-11 place-items-center rounded-xl border border-[#d6c3b8] bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f512f]">
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </SheetPrimitive.Close>
              </div>
              <nav aria-label="მობილური ნავიგაცია" className="mt-6 flex flex-col">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 items-center border-b border-[#e4e2e1] px-2 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f512f]",
                      isActive(pathname, item.href) ? "text-[#7f512f]" : "text-[#1b1c1c] hover:text-[#7f512f]",
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
