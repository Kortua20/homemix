import type { Metadata } from "next";
import { Clock3, ExternalLink, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { BrandIcon } from "@/components/brand-icons";
import { PageBanner } from "@/components/page-banner";
import { contactDetails, socialLinks } from "@/lib/contact-details";

export const metadata: Metadata = {
  title: "კონტაქტი",
  description:
    "დაუკავშირდით Home Mix-ს შეკითხვის ან პროდუქტის შესახებ დამატებითი ინფორმაციისთვის.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "კონტაქტი | Home Mix",
    description:
      "დაუკავშირდით Home Mix-ს პროდუქტის შესახებ დამატებითი ინფორმაციისთვის.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main>
      <PageBanner
        title="კონტაქტი"
        description="გაქვთ კითხვები? მოგვწერეთ ან დაგვიკავშირდით მითითებულ ნომერზე."
        crumbs={[{ label: "კონტაქტი" }]}
        image="/hero/bedroom.webp"
      />
      <div className="page-container section-y">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:items-start lg:gap-8">
          <ContactForm />

          <aside className="space-y-6" aria-label="საკონტაქტო ინფორმაცია">
            <section className="rounded-lg bg-white p-5 shadow-card sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <h2 className="flex items-center gap-3 text-xl font-bold tracking-[-0.015em] text-ink before:block before:h-6 before:w-1 before:rounded-full before:bg-forest sm:text-2xl">
                  საკონტაქტო ინფორმაცია
                </h2>
              </div>

              <dl className="mt-7 space-y-5">
                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint text-forest">
                    <Phone className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-ink">
                      ტელეფონი
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-ink-muted">
                      {contactDetails.phone.href ? (
                        <a
                          className="underline decoration-control underline-offset-4 hover:text-forest"
                          href={contactDetails.phone.href}
                        >
                          {contactDetails.phone.label}
                        </a>
                      ) : (
                        contactDetails.phone.label
                      )}
                    </dd>
                  </div>
                </div>

                {socialLinks.whatsapp ? (
                  <div className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint text-forest">
                      <BrandIcon glyph="whatsapp" className="size-5.5" />
                    </span>
                    <div>
                      <dt className="text-sm font-semibold text-ink">
                        WhatsApp
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-ink-muted">
                        <a
                          className="underline decoration-control underline-offset-4 hover:text-forest"
                          href={socialLinks.whatsapp}
                          target="_blank"
                          rel="noreferrer"
                        >
                          მოგვწერეთ WhatsApp-ში
                        </a>
                      </dd>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint text-forest">
                    <MapPin className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-ink">
                      მისამართი
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-ink-muted">
                      {contactDetails.address}
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint text-forest">
                    <Clock3 className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-ink">
                      სამუშაო დრო
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-ink-muted">
                      {contactDetails.openingHours}
                    </dd>
                  </div>
                </div>
              </dl>
            </section>

            <div className="overflow-hidden rounded-lg bg-white shadow-card">
              <iframe
                title="Home Mix-ის დროებითი მდებარეობა Google Maps-ზე"
                src={contactDetails.mapEmbedUrl}
                width="600"
                height="360"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-80 w-full border-0"
              />
              <a
                href={contactDetails.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 border-t border-line bg-white px-5 text-sm font-semibold text-forest transition-colors hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-forest"
              >
                Google Maps-ში გახსნა
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
