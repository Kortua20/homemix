"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    title: "40% -იანი ფასდაკლება სრულ პროდუქციაზე",
    description:
      "ახალი და მეორადი ავეჯი. ლიკვიდაცია ჰოუმ მიქსში, უფასო მიტანის სერვისი თბილისის მასშტაბით. დივნები, მაგიდები და საწოლები - ყველაფერი ერთ სივრცეში",
  },
  {
    image: "/hero/living-room.webp",
    alt: "თბილ ფერებში მოწყობილი მისაღები ოთახი რბილი დივნით",
    title: "40% -იანი ფასდაკლება სრულ პროდუქციაზე",
    description:
      "ახალი და მეორადი ავეჯი. ლიკვიდაცია ჰოუმ მიქსში, უფასო მიტანის სერვისი თბილისის მასშტაბით. დივნები, მაგიდები და საწოლები - ყველაფერი ერთ სივრცეში",
  },
  {
    image: "/hero/bedroom.webp",
    alt: "მყუდრო საძინებელი რბილი საწოლითა და თბილი განათებით",
    title: "40% -იანი ფასდაკლება სრულ პროდუქციაზე",
    description:
      "ახალი და მეორადი ავეჯი. ლიკვიდაცია ჰოუმ მიქსში, უფასო მიტანის სერვისი თბილისის მასშტაბით. დივნები, მაგიდები და საწოლები - ყველაფერი ერთ სივრცეში",
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
      className="relative w-full bg-[#173c2f]"
    >
      <div className="relative min-h-120 overflow-hidden bg-[#173c2f] sm:min-h-125 lg:min-h-130">
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

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,24,17,.88)_0%,rgba(8,24,17,.63)_32%,rgba(8,24,17,.14)_68%,rgba(8,24,17,.04)_100%),linear-gradient(0deg,rgba(8,24,17,.42)_0%,transparent_42%)]" />

        <div className="relative z-10 mx-auto flex min-h-120 w-full max-w-384 items-end px-5 pb-20 pt-12 sm:min-h-125 sm:items-center sm:px-8 sm:pb-20 lg:min-h-130 lg:px-12 xl:px-16">
          <div className="max-w-172.5 text-white">
            <h1 className="max-w-[15ch] text-[clamp(2.25rem,4.2vw,4rem)] md:leading-20 font-semibold tracking-[-0.035em] text-balance">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-140 text-base leading-7 text-[#dce7df]">
              {slide.description}
            </p>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-3 z-20 mx-auto flex w-full max-w-384 items-center justify-between gap-4 px-5 sm:bottom-5 sm:px-8 lg:px-12 xl:px-16">
          <div
            className="flex items-center gap-1"
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
                className="grid size-11 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span
                  className={cn(
                    "h-px bg-white transition-all",
                    active === index ? "w-10" : "w-5 opacity-45",
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
              className="grid size-11 place-items-center rounded-xl border border-white/55 bg-[#173c2f]/40 text-white transition-colors hover:bg-white hover:text-[#173c2f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="შემდეგი სლაიდი"
              className="grid size-11 place-items-center rounded-xl border border-white/55 bg-[#173c2f]/40 text-white transition-colors hover:bg-white hover:text-[#173c2f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
