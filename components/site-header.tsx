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
    <header className="sticky top-0 z-50 border-b border-[#2f2925]/25 bg-[#f4efe7]/95 backdrop-blur-md">
      <div className="mx-auto grid h-[68px] w-full max-w-7xl grid-cols-[1fr_auto] border-x border-[#2f2925]/20 px-4 sm:h-20 sm:px-8 lg:grid-cols-[auto_1fr] lg:px-0">
        <Link
          href="/"
          aria-label="Home Mix — მთავარი გვერდი"
          className="flex min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#3a5577] lg:min-w-64 lg:border-r lg:border-[#2f2925]/20 lg:px-8"
        >
          <Image src="/logo.png" alt="Home Mix" width={500} height={500} priority className="size-11 object-contain sm:size-13" />
          <span className="truncate text-lg font-bold tracking-[-0.02em] text-[#251b16]">Home Mix</span>
        </Link>

        <nav aria-label="მთავარი ნავიგაცია" className="hidden h-full items-stretch justify-end lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "relative flex min-w-36 items-center justify-center border-l border-[#2f2925]/20 px-5 text-sm font-semibold transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#3a5577]",
                isActive(pathname, item.href)
                  ? "bg-[#6f4329] text-white"
                  : "text-[#554a43] hover:bg-[#e7dccf] hover:text-[#251b16]",
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
              className="grid size-11 place-items-center self-center border border-[#2f2925]/35 text-[#251b16] transition-colors hover:bg-[#6f4329] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3a5577] lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </SheetPrimitive.Trigger>
          <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-[#241913]/55 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
            <SheetPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(92vw,390px)] flex-col border-l border-[#2f2925]/35 bg-[#f4efe7] shadow-[-18px_0_50px_rgba(36,25,19,0.18)] duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
              <SheetPrimitive.Title className="sr-only">მთავარი მენიუ</SheetPrimitive.Title>
              <SheetPrimitive.Description className="sr-only">Home Mix-ის გვერდებზე გადასასვლელი ბმულები</SheetPrimitive.Description>
              <div className="flex h-20 items-center justify-between border-b border-[#2f2925]/30 px-5">
                <div className="flex items-center gap-3">
                  <Image src="/logo.png" alt="Home Mix" width={500} height={500} className="size-12 object-contain" />
                  <span className="font-bold">Home Mix</span>
                </div>
                <SheetPrimitive.Close asChild>
                  <button type="button" aria-label="მენიუს დახურვა" className="grid size-11 place-items-center border border-[#2f2925]/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3a5577]">
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </SheetPrimitive.Close>
              </div>
              <nav aria-label="მობილური ნავიგაცია" className="border-b border-[#2f2925]/30">
                {navigation.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cn(
                      "grid min-h-20 grid-cols-[2.5rem_1fr] items-center border-t border-[#2f2925]/25 px-5 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#3a5577]",
                      isActive(pathname, item.href) ? "bg-[#6f4329] text-white" : "text-[#251b16] hover:bg-[#e7dccf]",
                    )}
                  >
                    <span className={cn("text-xs tracking-[0.12em]", isActive(pathname, item.href) ? "text-[#f1c69f]" : "text-[#3a5577]")}>{String(index + 1).padStart(2, "0")}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div aria-hidden="true" className="mt-auto h-28 border-t border-[#2f2925]/25 opacity-50 [background-image:linear-gradient(to_right,transparent_calc(100%-1px),rgba(58,85,119,.3)_1px),linear-gradient(to_bottom,transparent_calc(100%-1px),rgba(58,85,119,.22)_1px)] [background-size:36px_36px]" />
            </SheetPrimitive.Content>
          </SheetPrimitive.Portal>
        </SheetPrimitive.Root>
      </div>
    </header>
  );
}
