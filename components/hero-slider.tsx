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
    eyebrow: "სახლი, რომელიც შენ გგავს",
    title: "შექმენი სივრცე, სადაც ცხოვრება გიყვარს",
    description: "კომფორტი, ბუნებრივი მასალები და მშვიდი დიზაინი ყოველდღიური სიმყუდროვისთვის.",
  },
  {
    image: "/hero/dining-room.webp",
    alt: "ნათელი სასადილო ოთახი ხის მაგიდითა და რბილი სკამებით",
    eyebrow: "ერთად გატარებული დროისთვის",
    title: "კომფორტი და სტილი ერთ სივრცეში",
    description: "ავეჯი, რომელიც უბრალო ყოველდღიურ წუთებს საყვარელ მოგონებებად აქცევს.",
  },
  {
    image: "/hero/bedroom.webp",
    alt: "მყუდრო საძინებელი რბილი საწოლითა და თბილი განათებით",
    eyebrow: "სიმშვიდე იწყება სახლში",
    title: "ავეჯი თქვენი სახლისთვის",
    description: "გააზრებული ფორმები და რბილი ტექსტურები მშვიდი, სრულყოფილი დასვენებისთვის.",
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
    const interval = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(interval);
  }, [paused]);

  return (
    <section
      aria-roledescription="სლაიდერი"
      aria-label="Home Mix-ის კოლექციები"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(distance) > 45) goTo(active + (distance < 0 ? 1 : -1));
        touchStart.current = null;
      }}
      className="relative mx-auto mt-3 w-[calc(100%-2rem)] max-w-[1400px] overflow-hidden rounded-[1.75rem] bg-[#34271f] shadow-[0_16px_40px_rgba(48,33,23,0.12)] sm:mt-5 sm:w-[calc(100%-3rem)] sm:rounded-[2rem]"
    >
      <div className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[650px]">
        {slides.map((slide, index) => (
          <article
            key={slide.image}
            aria-hidden={active !== index}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none",
              active === index ? "z-10 opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 640px) 100vw, 1400px"
              className="object-cover object-[58%_center] sm:object-center"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,17,13,0.82)_0%,rgba(24,17,13,0.58)_38%,rgba(24,17,13,0.10)_72%),linear-gradient(0deg,rgba(24,17,13,0.45)_0%,transparent_48%)]" />
            <div className="relative z-10 flex min-h-[500px] items-end px-5 pb-20 pt-20 sm:min-h-[600px] sm:items-center sm:px-12 sm:pb-24 lg:min-h-[650px] lg:px-20">
              <div className="max-w-[650px] text-white">
                <p className="mb-3 text-xs font-bold tracking-[0.18em] text-white/80 uppercase sm:text-sm">
                  {slide.eyebrow}
                </p>
                <h1 className="max-w-[15ch] text-[2rem] leading-[1.16] font-semibold tracking-[-0.045em] text-balance sm:text-5xl sm:leading-[1.12] lg:text-6xl">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:mt-6 sm:text-base sm:leading-7">
                  {slide.description}
                </p>
                <Link
                  href="/products"
                  tabIndex={active === index ? 0 : -1}
                  className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#7f512f] transition-colors hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:mt-9"
                >
                  კოლექციის ნახვა
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-between px-5 sm:bottom-7 sm:px-12 lg:px-20">
        <div className="flex items-center gap-2" role="tablist" aria-label="სლაიდის არჩევა">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-label={`${index + 1} სლაიდის ჩვენება`}
              onClick={() => goTo(index)}
              className="grid size-8 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className={cn("h-1.5 rounded-full bg-white transition-all", active === index ? "w-7" : "w-1.5 opacity-55")} />
            </button>
          ))}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => goTo(active - 1)} aria-label="წინა სლაიდი" className="grid size-11 place-items-center rounded-full border border-white/35 bg-black/15 text-white backdrop-blur-sm hover:bg-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => goTo(active + 1)} aria-label="შემდეგი სლაიდი" className="grid size-11 place-items-center rounded-full border border-white/35 bg-black/15 text-white backdrop-blur-sm hover:bg-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
