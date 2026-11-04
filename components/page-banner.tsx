import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

// The inner-page header from the reference product page: a short photographic band with
// the page title on the left and the breadcrumb on the right. "მთავარი" is always the
// first crumb, so callers pass only what comes after it.
export function PageBanner({
  title,
  description,
  crumbs = [],
  image = "/hero/living-room.webp",
  imageAlt = "",
}: {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  image?: string;
  imageAlt?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-forest-night">
      <Image
        src={image}
        alt={imageAlt}
        fill
        preload
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(20,18,14,.82)_0%,rgba(20,18,14,.62)_45%,rgba(20,18,14,.4)_100%)]" />

      <div className="page-container flex min-h-36 flex-col justify-center gap-3 py-7 sm:min-h-40 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-white text-balance sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        <Breadcrumbs crumbs={crumbs} tone="photo" className="shrink-0" />
      </div>
    </section>
  );
}

const crumbTones = {
  photo: {
    list: "text-white/80",
    link: "hover:text-white focus-visible:outline-white",
    separator: "text-white/55",
    current: "text-white",
  },
  canvas: {
    list: "text-ink-muted",
    link: "hover:text-forest focus-visible:outline-forest",
    separator: "text-control",
    current: "text-ink",
  },
} as const;

// "მთავარი" is always the first crumb; the last crumb is the current page.
export function Breadcrumbs({
  crumbs,
  tone = "canvas",
  className,
}: {
  crumbs: Crumb[];
  tone?: keyof typeof crumbTones;
  className?: string;
}) {
  const style = crumbTones[tone];
  const linkClass = `flex min-h-9 items-center gap-1.5 rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${style.link}`;

  return (
    <nav aria-label="გვერდის გზა" className={className}>
      <ol className={`flex flex-wrap items-center gap-1.5 text-sm ${style.list}`}>
        <li>
          <Link href="/" className={`${linkClass} font-semibold`}>
            <Home className="size-4" aria-hidden="true" />
            მთავარი
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <li aria-hidden="true">
                <ChevronRight className={`size-3.5 ${style.separator}`} />
              </li>
              <li className="min-w-0">
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} className={linkClass}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={`block max-w-56 truncate ${style.current}`}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
