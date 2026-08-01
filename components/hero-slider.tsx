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
    title: "შექმენი სახლი, სადაც ცხოვრება გიყვარს",
    description: "კომფორტული ავეჯი ყოველდღიური ცხოვრებისთვის.",
  },
  {
    image: "/hero/dining-room.webp",
    alt: "ნათელი სასადილო ოთახი ხის მაგიდითა და რბილი სკამებით",
    title: "კომფორტი და სტილი ერთ სივრცეში",
    description: "მარტივი არჩევანი თბილი და მყუდრო სახლისთვის.",
  },
  {
    image: "/hero/bedroom.webp",
    alt: "მყუდრო საძინებელი რბილი საწოლითა და თბილი განათებით",
    title: "ავეჯი შენი სახლისთვის",
    description: "გააზრებული ფორმები და მშვიდი ტექსტურები.",
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
      aria-label="Home Mix-ის კოლექციები"
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
      className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8"
    >
      <div className="relative min-h-[540px] overflow-hidden rounded-2xl bg-[#d9d3ce] sm:min-h-[600px]">
        {slides.map((item, index) => (
          <Image
            key={item.image}
            src={item.image}
            alt={item.alt}
            fill
            priority={index === 0}
            aria-hidden={active !== index}
            sizes="(max-width: 1440px) 100vw, 1376px"
            className={cn(
              "object-cover object-[62%_center] transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none sm:object-center",
              active === index
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-[1.015] opacity-0",
            )}
          />
        ))}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(30,21,16,.72)_0%,rgba(30,21,16,.45)_43%,rgba(30,21,16,.06)_78%),linear-gradient(0deg,rgba(30,21,16,.38)_0%,transparent_45%)]" />

        <div className="relative z-10 flex min-h-[540px] items-end px-5 pb-24 pt-16 sm:min-h-[600px] sm:items-center sm:px-10 sm:pb-28 lg:px-16">
          <div className="max-w-2xl text-white">
            <h1 className="max-w-[13ch] text-[clamp(2.35rem,5.2vw,4.75rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/85 sm:text-lg">
              {slide.description}
            </p>
            <Link
              href="/products"
              className="group mt-7 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#7f512f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#6d4528] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:mt-8"
            >
              პროდუქტების ნახვა
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-5 z-20 flex items-center justify-between gap-4 sm:inset-x-10 sm:bottom-8 lg:inset-x-16">
          <div className="flex items-center gap-1" role="tablist" aria-label="სლაიდის არჩევა">
            {slides.map((item, index) => (
              <button
                key={item.image}
                type="button"
                role="tab"
                aria-selected={active === index}
                aria-label={`${index + 1} სლაიდის ჩვენება`}
                onClick={() => goTo(index)}
                className="grid size-11 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className={cn("h-1.5 rounded-full bg-white transition-all", active === index ? "w-7" : "w-1.5 opacity-55")} />
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="წინა სლაიდი"
              className="grid size-11 place-items-center rounded-xl border border-white/45 bg-black/20 text-white transition-colors hover:bg-white hover:text-[#1b1c1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="შემდეგი სლაიდი"
              className="grid size-11 place-items-center rounded-xl border border-white/45 bg-black/20 text-white transition-colors hover:bg-white hover:text-[#1b1c1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
