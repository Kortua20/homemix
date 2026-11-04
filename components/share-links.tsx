// Plain share links — no SDKs, no tracking scripts. Messenger and Viber open their apps
// and only work where the app is installed (mostly phones); the others work everywhere.

type Network = {
  name: string;
  color: string;
  href: (url: string, text: string) => string;
  // 24×24 brand glyph, drawn as a single path.
  path: string;
};

const networks: Network[] = [
  {
    name: "Facebook",
    color: "#1877f2",
    href: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    path: "M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.3-3.8 3.8v2.4H8v3h2.5V21h3Z",
  },
  {
    name: "Messenger",
    color: "#0084ff",
    href: (url) => `fb-messenger://share/?link=${encodeURIComponent(url)}`,
    path: "M12 3C6.9 3 3 6.7 3 11.6c0 2.6 1.1 4.8 2.8 6.3V21l2.7-1.5c1 .3 2.2.5 3.5.5 5.1 0 9-3.7 9-8.4S17.1 3 12 3Zm.9 11.3-2.3-2.4-4.4 2.4 4.9-5.2 2.3 2.4 4.4-2.4-4.9 5.2Z",
  },
  {
    name: "Viber",
    color: "#7360f2",
    href: (url, text) =>
      `viber://forward?text=${encodeURIComponent(`${text} ${url}`)}`,
    path: "M12 3c-4.6 0-8 2.7-8 7.6 0 2.7 1 4.6 2.7 5.8V20l2.9-2c.8.2 1.6.2 2.4.2 4.6 0 8-2.7 8-7.6S16.6 3 12 3Zm3.7 10.6c-.3.6-1.1 1.1-1.7 1.1-.4 0-.8 0-2.6-.8-1.7-.8-3.1-2.6-3.6-3.6-.3-.6-.5-1.3-.2-2 .2-.4.7-.9 1.1-.9h.4c.2 0 .4.1.5.4l.6 1.4c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .5.4.8 1.2 1.6 2 2 .2.1.4.1.5-.1l.5-.6c.1-.2.4-.2.6-.1l1.4.7c.2.1.4.3.4.5 0 .2-.1.3-.2.4Z",
  },
  {
    name: "WhatsApp",
    color: "#25d366",
    href: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    path: "M12 3a9 9 0 0 0-7.8 13.4L3 21l4.7-1.2A9 9 0 1 0 12 3Zm4.6 12.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.5.2.3.7 1.1 1.4 1.8 1 .9 1.8 1.1 2 1.3.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.8-.2 1.3Z",
  },
  {
    name: "Telegram",
    color: "#229ed9",
    href: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    path: "M20.7 4.3 3.6 10.9c-1.2.5-1.1 1.2-.2 1.5l4.4 1.4 1.7 5.2c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.1-2.1 4.4 3.3c.8.4 1.4.2 1.6-.8l2.9-13.7c.3-1.2-.4-1.7-1.3-1.4Zm-3.1 3.2-7.7 7-.3 3.2-1.5-4.6 9.5-5.6Z",
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
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={network.path} />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
