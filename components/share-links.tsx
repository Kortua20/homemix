import { BrandIcon, type BrandGlyph } from "@/components/brand-icons";

// Plain share links — no SDKs, no tracking scripts. Messenger and Viber open their apps
// and only work where the app is installed (mostly phones); the others work everywhere.

type Network = {
  name: string;
  color: string;
  href: (url: string, text: string) => string;
  glyph: BrandGlyph;
};

const networks: Network[] = [
  {
    name: "Facebook",
    color: "#1877f2",
    href: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    glyph: "facebook",
  },
  {
    name: "Messenger",
    color: "#0084ff",
    href: (url) => `fb-messenger://share/?link=${encodeURIComponent(url)}`,
    glyph: "messenger",
  },
  {
    name: "Viber",
    color: "#7360f2",
    href: (url, text) =>
      `viber://forward?text=${encodeURIComponent(`${text} ${url}`)}`,
    glyph: "viber",
  },
  {
    name: "WhatsApp",
    color: "#25d366",
    href: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    glyph: "whatsapp",
  },
  {
    name: "Telegram",
    color: "#229ed9",
    href: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    glyph: "telegram",
  },
];

export function ShareLinks({ url, title }: { url: string; title: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="text-sm font-semibold text-ink">გაზიარება:</p>
      <ul className="flex flex-wrap gap-2">
        {networks.map((network) => (
          <li key={network.name}>
            <a
              href={network.href(url, title)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${network.name}-ზე გაზიარება`}
              style={{ backgroundColor: network.color }}
              className="grid size-10 place-items-center rounded-full text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none"
            >
              <BrandIcon glyph={network.glyph} className="size-6" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
