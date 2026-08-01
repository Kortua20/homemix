"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const slides = [
  {
    image: "/hero/living-room.webp",
    alt: "თბილ ფერებში მოწყობილი მისაღები ოთახი რბილი დივნით",
    title: "ავეჯი, რომელიც სახლს შენად აქცევს",
    description: "ფორმა, მასალა და კომფორტი — შერჩეული ყოველდღიური ცხოვრებისთვის.",
    note: "მისაღები ოთახი",
    measure: "2400 × 3150",
  },
  {
    image: "/hero/dining-room.webp",
    alt: "ნათელი სასადილო ოთახი ხის მაგიდითა და რბილი სკამებით",
    title: "ერთად გატარებული დრო იწყება სივრცით",
    description: "მაგიდები და სკამები, რომლებიც ყოველდღიურ შეხვედრებს ბუნებრივ ადგილს უქმნის.",
    note: "სასადილო სივრცე",
    measure: "1800 × 900",
  },
  {
    image: "/hero/bedroom.webp",
    alt: "მყუდრო საძინებელი რბილი საწოლითა და თბილი განათებით",
    title: "სიმშვიდე, რომელიც სახლში გელოდება",
    description: "გააზრებული ფორმები და მშვიდი ტექსტურები სრულყოფილი დასვენებისთვის.",
    note: "საძინებელი",
    measure: "1600 × 2100",
  },
] as const;

export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    setActive((index + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      7000,
    );
    return () => window.clearInterval(interval);
  }, [paused]);

  const slide = slides[active];

  return (
    <section
      aria-roledescription="სლაიდერი"
      aria-label="Home Mix-ის სივრცეები"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance =
          (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(distance) > 45) goTo(active + (distance < 0 ? 1 : -1));
        touchStart.current = null;
      }}
      className="relative bg-[#f4efe7]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,transparent_calc(100%-1px),rgba(58,85,119,.2)_1px),linear-gradient(to_bottom,transparent_calc(100%-1px),rgba(58,85,119,.14)_1px)] [background-size:72px_72px]" />

      <div className="relative mx-auto grid min-h-[calc(100svh-68px)] w-full max-w-7xl border-x border-[#2f2925]/20 lg:min-h-[720px] lg:grid-cols-[0.92fr_1.18fr]">
        <div className="relative z-10 flex flex-col justify-between border-b border-[#2f2925]/25 px-4 py-9 sm:px-8 sm:py-12 lg:border-r lg:border-b-0 lg:px-12 lg:py-14">
          <div className="flex items-center justify-between border-b border-[#2f2925]/25 pb-4 text-[0.68rem] font-semibold tracking-[0.12em] text-[#3a5577] uppercase">
            <span>Home Mix / 2026</span>
            <span>{String(active + 1).padStart(2, "0")} — {String(slides.length).padStart(2, "0")}</span>
          </div>

          <div className="py-10 lg:py-14">
            <h1 className="max-w-[10.5ch] text-[clamp(2.75rem,6.8vw,6rem)] leading-[0.98] font-semibold tracking-[-0.04em] text-[#251b16] text-balance">
              {slide.title}
            </h1>
            <p className="mt-7 max-w-[34rem] text-base leading-7 text-[#5d5149] sm:text-lg sm:leading-8">
              {slide.description}
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto] border border-[#2f2925]/35 bg-[#efe5d7]">
            <Link
              href="/products"
              className="group flex min-h-16 items-center justify-between gap-4 bg-[#6f4329] px-5 text-sm font-bold text-white transition-colors hover:bg-[#56311f] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white sm:px-6"
            >
              პროდუქტების ნახვა
              <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
            <span aria-hidden="true" className="hidden min-w-32 items-center justify-center border-l border-[#2f2925]/30 px-4 text-[0.67rem] font-semibold tracking-[0.12em] text-[#5d5149] uppercase sm:flex">
              კატალოგი
            </span>
          </div>
        </div>

        <div className="relative min-h-[48svh] overflow-hidden bg-[#b9aa9f] sm:min-h-[560px] lg:min-h-0">
          {slides.map((item, index) => (
            <Image
              key={item.image}
              src={item.image}
              alt={item.alt}
              fill
              priority={index === 0}
              aria-hidden={active !== index}
              sizes="(max-width: 1024px) 100vw, 58vw"
              className={cn(
                "object-cover transition-[opacity,transform,filter] duration-700 ease-out motion-reduce:transition-none",
                active === index
                  ? "scale-100 opacity-100 blur-0"
                  : "pointer-events-none scale-[1.025] opacity-0 blur-[2px]",
              )}
            />
          ))}
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(24,16,12,.5),transparent_42%)]" />

          <div aria-hidden="true" className="absolute inset-x-5 top-7 flex items-center gap-3 text-[0.65rem] font-semibold tracking-[0.12em] text-white/90 sm:inset-x-8 lg:inset-x-10">
            <span className="size-2 rounded-full border border-white" />
            <span className="h-px flex-1 bg-white/70" />
            <span>{slide.measure}</span>
            <span className="size-2 rounded-full border border-white" />
          </div>

          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-5 border border-white/35 bg-[#251b16]/75 p-4 text-white sm:inset-x-8 sm:bottom-8 sm:p-5 lg:inset-x-10">
            <div>
              <p className="text-[0.66rem] font-semibold tracking-[0.13em] text-white/65 uppercase">სივრცე</p>
              <p className="mt-1 text-sm font-semibold sm:text-base">{slide.note}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="წინა სლაიდი"
                className="grid size-11 place-items-center border border-white/40 transition-colors hover:bg-white hover:text-[#251b16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="შემდეგი სლაიდი"
                className="grid size-11 place-items-center border border-white/40 transition-colors hover:bg-white hover:text-[#251b16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="absolute right-4 top-16 flex flex-col gap-2 sm:right-8 lg:right-10" role="tablist" aria-label="სლაიდის არჩევა">
            {slides.map((item, index) => (
              <button
                key={item.image}
                type="button"
                role="tab"
                aria-selected={active === index}
                aria-label={`${index + 1} სლაიდის ჩვენება`}
                onClick={() => goTo(index)}
                className={cn(
                  "grid size-11 place-items-center border text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  active === index
                    ? "border-white bg-white text-[#251b16]"
                    : "border-white/45 bg-[#251b16]/40 text-white hover:bg-[#251b16]/70",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
