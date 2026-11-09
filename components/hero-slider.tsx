"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  image: string;
  alt: string;
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
};

const defaultSlides: HeroSlide[] = [
  {
    image: "/hero/dining-room.webp",
    alt: "ნათელი სასადილო ოთახი ხის მაგიდითა და რბილი სკამებით",
    title: "Home Mix — ჩვენთან ფასი ყოველთვის იკლებს!",
    description:
      "ახალი და მეორადი ავეჯი. ლიკვიდაცია ჰოუმ მიქსში, უფასო მიტანის სერვისი თბილისის მასშტაბით. დივნები, მაგიდები და საწოლები - ყველაფერი ერთ სივრცეში",
    href: "/products",
    actionLabel: "პროდუქტების ნახვა",
  },
  {
    image: "/hero/living-room.webp",
    alt: "თბილ ფერებში მოწყობილი მისაღები ოთახი რბილი დივნით",
    title: "Home Mix — ჩვენთან ფასი ყოველთვის იკლებს!",
    description:
      "ახალი და მეორადი ავეჯი. ლიკვიდაცია ჰოუმ მიქსში, უფასო მიტანის სერვისი თბილისის მასშტაბით. დივნები, მაგიდები და საწოლები - ყველაფერი ერთ სივრცეში",
    href: "/products",
    actionLabel: "პროდუქტების ნახვა",
  },
  {
    image: "/hero/bedroom.webp",
    alt: "მყუდრო საძინებელი რბილი საწოლითა და თბილი განათებით",
    title: "Home Mix — ჩვენთან ფასი ყოველთვის იკლებს!",
    description:
      "ახალი და მეორადი ავეჯი. ლიკვიდაცია ჰოუმ მიქსში, უფასო მიტანის სერვისი თბილისის მასშტაბით. დივნები, მაგიდები და საწოლები - ყველაფერი ერთ სივრცეში",
    href: "/products",
    actionLabel: "პროდუქტების ნახვა",
  },
];

export function HeroSlider({
  slides = defaultSlides,
}: {
  slides?: HeroSlide[];
}) {
  const [active, setActive] = useState(0);
  const [isInView, setIsInView] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(true);
  const sliderRef = useRef<HTMLElement>(null);
  const touchStart = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setActive((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    if (
      !isInView ||
      !documentVisible ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timeout = window.setTimeout(
      () => setActive((current) => (current + 1) % slides.length),
      4000,
    );
    return () => window.clearTimeout(timeout);
  }, [active, documentVisible, isInView, slides.length]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const updateDocumentVisibility = () => setDocumentVisible(!document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.15 },
    );

    observer.observe(slider);
    document.addEventListener("visibilitychange", updateDocumentVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener(
        "visibilitychange",
        updateDocumentVisibility,
      );
    };
  }, []);

  const slide = slides[active] ?? slides[0] ?? defaultSlides[0];

  return (
    <section
      ref={sliderRef}
      aria-roledescription="სლაიდერი"
      aria-label="Home Mix-ის კოლექციები"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance =
          (event.changedTouches[0]?.clientX ?? touchStart.current) -
          touchStart.current;
        if (Math.abs(distance) > 45) goTo(active + (distance < 0 ? 1 : -1));
        touchStart.current = null;
      }}
      className="relative w-full bg-forest-deep"
    >
      <div className="relative min-h-72 overflow-hidden bg-forest-deep sm:min-h-96 lg:min-h-100">
        {slides.map((item, index) => (
          <Image
            key={item.image}
            src={item.image}
            alt={item.alt}
            fill
            preload={index === 0}
            aria-hidden={active !== index}
            sizes="100vw"
            className={cn(
              "object-cover object-[58%_center] transition-[opacity,transform,filter] duration-1000 ease-out motion-reduce:transition-none sm:object-center",
              active === index
                ? "scale-100 opacity-100 blur-0"
                : "pointer-events-none scale-[1.018] opacity-0 blur-[2px]",
            )}
          />
        ))}

        {/* Warm, dark left-side wash: the copy sits on the room, never on a panel. */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,18,14,.78)_0%,rgba(20,18,14,.55)_34%,rgba(20,18,14,.12)_66%,rgba(20,18,14,0)_100%),linear-gradient(0deg,rgba(20,18,14,.45)_0%,transparent_40%)]" />

        <div className="page-container relative z-10 flex min-h-72 items-end pt-8 pb-18 sm:min-h-96 sm:items-center sm:pt-10 sm:pb-24 lg:min-h-100">
          <div className="max-w-180 text-white">
            <h1 className="max-w-[20ch] text-[1.75rem] leading-[1.15] font-bold tracking-tight text-balance sm:text-[clamp(2.25rem,4.6vw,4.25rem)] sm:leading-[1.12]">
              {slide.title}
            </h1>
            {/* Hidden on phones: four lines of body copy doubled the hero's height there,
                and the title plus the button already carry the slide. */}
            <p className="mt-5 hidden max-w-130 text-lg leading-8 text-white/88 sm:block">
              {slide.description}
            </p>
            {/* Needs both: the category hero passes an href to its own page, and a button
                that reloads the page you are on is not an action. */}
            {slide.href && slide.actionLabel ? (
              <Link
                href={slide.href}
                className="group mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/80 px-6 text-sm sm:mt-8 sm:min-h-12 sm:px-7 font-semibold text-white transition-colors hover:bg-white hover:text-forest-deep focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
              >
                {slide.actionLabel}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="page-container absolute inset-x-0 bottom-3 z-20 flex items-center justify-between gap-4 sm:bottom-5">
          <div
            className="-ml-3.5 flex items-center"
            role="tablist"
            aria-label="სლაიდის არჩევა"
          >
            {slides.map((item, index) => (
              <button
                key={item.image}
                type="button"
                role="tab"
                aria-selected={active === index}
                aria-label={`${index + 1} სლაიდის ჩვენება`}
                onClick={() => goTo(index)}
                className="-mx-1 grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full border-[1.5px] border-white transition-colors",
                    active === index ? "bg-white" : "bg-transparent opacity-80",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="წინა სლაიდი"
              className="grid size-11 place-items-center rounded-full border border-white/25 bg-forest-deep/85 text-white transition-colors hover:bg-white hover:text-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="შემდეგი სლაიდი"
              className="grid size-11 place-items-center rounded-full border border-white/25 bg-forest-deep/85 text-white transition-colors hover:bg-white hover:text-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
