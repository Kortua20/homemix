import type { Metadata } from "next";
import { Clock3, ExternalLink, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "კონტაქტი",
  description: "დაუკავშირდით Home Mix-ს შეკითხვის ან პროდუქტის შესახებ დამატებითი ინფორმაციისთვის.",
};

const temporaryContact = {
  phone: "+995 555 12 34 56",
  phoneHref: "+995555123456",
  address: "ილია ჭავჭავაძის გამზირი 12, თბილისი",
  mapUrl: "https://www.google.com/maps?q=41.7106,44.7519&z=15&output=embed",
  mapLink: "https://www.google.com/maps/search/?api=1&query=41.7106%2C44.7519",
};

export default function ContactPage() {
  return (
    <main className="bg-[#fcf9f8]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl leading-tight font-semibold tracking-[-0.03em] text-[#1b1c1c] sm:text-5xl">
            კონტაქტი
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#605e5b]">
            გაქვთ შეკითხვა პროდუქტზე? მოგვწერეთ ან დაგვიკავშირდით მითითებულ ნომერზე.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:items-start">
          <ContactForm />

          <aside className="space-y-6" aria-label="საკონტაქტო ინფორმაცია">
            <section className="rounded-2xl bg-[#f6f3f2] p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#1b1c1c]">
                  საკონტაქტო ინფორმაცია
                </h2>
                <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[#7f512f]">
                  დროებითი
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#605e5b]">
                ქვემოთ მოცემული მისამართი, ნომერი და რუკა სატესტოა და მოგვიანებით ჩანაცვლდება.
              </p>

              <dl className="mt-7 space-y-5">
                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#7f512f]">
                    <Phone className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-[#1b1c1c]">ტელეფონი</dt>
                    <dd className="mt-1 text-sm leading-6 text-[#605e5b]">
                      <a className="underline decoration-[#d6c3b8] underline-offset-4 hover:text-[#7f512f]" href={`tel:${temporaryContact.phoneHref}`}>
                        {temporaryContact.phone}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#7f512f]">
                    <MapPin className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-[#1b1c1c]">მისამართი</dt>
                    <dd className="mt-1 text-sm leading-6 text-[#605e5b]">{temporaryContact.address}</dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#7f512f]">
                    <Clock3 className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-[#1b1c1c]">სამუშაო დრო</dt>
                    <dd className="mt-1 text-sm leading-6 text-[#605e5b]">ორშაბათი–შაბათი, 10:00–19:00</dd>
                  </div>
                </div>
              </dl>
            </section>

            <div className="overflow-hidden rounded-2xl bg-[#f0eded]">
              <iframe
                title="Home Mix-ის დროებითი მდებარეობა Google Maps-ზე"
                src={temporaryContact.mapUrl}
                width="600"
                height="360"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-80 w-full border-0"
              />
              <a
                href={temporaryContact.mapLink}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-[#7f512f] transition-colors hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#7f512f]"
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
