import type { Metadata } from "next";
import { Clock3, ExternalLink, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { contactDetails } from "@/lib/contact-details";

export const metadata: Metadata = {
  title: "კონტაქტი",
  description:
    "დაუკავშირდით Home Mix-ს შეკითხვის ან პროდუქტის შესახებ დამატებითი ინფორმაციისთვის.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "კონტაქტი | Home Mix",
    description: "დაუკავშირდით Home Mix-ს პროდუქტის შესახებ დამატებითი ინფორმაციისთვის.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="bg-[#f4f2ed]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl leading-tight font-semibold tracking-[-0.03em] text-[#18221d] sm:text-5xl">
            კონტაქტი
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#5e685f]">
            გაქვთ კითხვები? მოგვწერეთ ან დაგვიკავშირდით მითითებულ ნომერზე.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:items-start">
          <ContactForm />

          <aside className="space-y-6" aria-label="საკონტაქტო ინფორმაცია">
            <section className="rounded-2xl bg-[#e9eee9] p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#18221d]">
                  საკონტაქტო ინფორმაცია
                </h2>
              </div>

              <dl className="mt-7 space-y-5">
                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#1d4a38]">
                    <Phone className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-[#18221d]">
                      ტელეფონი
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-[#5e685f]">
                      {contactDetails.phone.href ? (
                        <a className="underline decoration-[#b9c6bd] underline-offset-4 hover:text-[#1d4a38]" href={contactDetails.phone.href}>
                          {contactDetails.phone.label}
                        </a>
                      ) : (
                        contactDetails.phone.label
                      )}
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#1d4a38]">
                    <MapPin className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-[#18221d]">
                      მისამართი
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-[#5e685f]">
                      {contactDetails.address}
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#1d4a38]">
                    <Clock3 className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-[#18221d]">
                      სამუშაო დრო
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-[#5e685f]">
                      {contactDetails.openingHours}
                    </dd>
                  </div>
                </div>
              </dl>
            </section>

            <div className="overflow-hidden rounded-2xl bg-[#e8ebe7]">
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
                className="flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-[#1d4a38] transition-colors hover:bg-[#e9eee9] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#1d4a38]"
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
