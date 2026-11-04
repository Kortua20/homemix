// Brand glyphs lucide does not ship (it has no WhatsApp/Messenger/Viber/Telegram marks).
// Each is a single 24×24 path, filled with currentColor, so it takes text colour and size
// like any lucide icon.
export const brandGlyphs = {
  facebook:
    "M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.3-3.8 3.8v2.4H8v3h2.5V21h3Z",
  messenger:
    "M12 3C6.9 3 3 6.7 3 11.6c0 2.6 1.1 4.8 2.8 6.3V21l2.7-1.5c1 .3 2.2.5 3.5.5 5.1 0 9-3.7 9-8.4S17.1 3 12 3Zm.9 11.3-2.3-2.4-4.4 2.4 4.9-5.2 2.3 2.4 4.4-2.4-4.9 5.2Z",
  viber:
    "M12 3c-4.6 0-8 2.7-8 7.6 0 2.7 1 4.6 2.7 5.8V20l2.9-2c.8.2 1.6.2 2.4.2 4.6 0 8-2.7 8-7.6S16.6 3 12 3Zm3.7 10.6c-.3.6-1.1 1.1-1.7 1.1-.4 0-.8 0-2.6-.8-1.7-.8-3.1-2.6-3.6-3.6-.3-.6-.5-1.3-.2-2 .2-.4.7-.9 1.1-.9h.4c.2 0 .4.1.5.4l.6 1.4c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .5.4.8 1.2 1.6 2 2 .2.1.4.1.5-.1l.5-.6c.1-.2.4-.2.6-.1l1.4.7c.2.1.4.3.4.5 0 .2-.1.3-.2.4Z",
  whatsapp:
    "M12 3a9 9 0 0 0-7.8 13.4L3 21l4.7-1.2A9 9 0 1 0 12 3Zm4.6 12.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.5.2.3.7 1.1 1.4 1.8 1 .9 1.8 1.1 2 1.3.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.8-.2 1.3Z",
  telegram:
    "M20.7 4.3 3.6 10.9c-1.2.5-1.1 1.2-.2 1.5l4.4 1.4 1.7 5.2c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.1-2.1 4.4 3.3c.8.4 1.4.2 1.6-.8l2.9-13.7c.3-1.2-.4-1.7-1.3-1.4Zm-3.1 3.2-7.7 7-.3 3.2-1.5-4.6 9.5-5.6Z",
} as const;

export type BrandGlyph = keyof typeof brandGlyphs;

export function BrandIcon({
  glyph,
  className,
}: {
  glyph: BrandGlyph;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={brandGlyphs[glyph]} />
    </svg>
  );
}
