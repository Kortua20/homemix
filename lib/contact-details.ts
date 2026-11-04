type OptionalLink = string | null;

export const contactDetails = {
  phone: {
    label: "+995 511 40 18 10",
    href: "tel:+995511401810" as OptionalLink,
  },
  address: "თბილისი , მარატ ნოზაძის 29ბ",
  openingHours: "ორშაბათი–შაბათი, 10:00–19:00",
  mapEmbedUrl:
    "https://www.google.com/maps?q=41.79089,44.825477&z=19&output=embed",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=41.79089%2C44.825477",
} as const;

export const socialLinks: {
  facebook: OptionalLink;
  messenger: OptionalLink;
  whatsapp: OptionalLink;
} = {
  // wa.me takes the number in international format without "+" or spaces. Opens the
  // WhatsApp app on phones and WhatsApp Web on desktop. null hides every WhatsApp link.
  whatsapp: "https://wa.me/995511401810",
  facebook: "https://www.facebook.com/share/1D7jGkdW2P/?mibextid=wwXIfr",
  // m.me opens a chat with the page: the Messenger app on phones, messenger.com on
  // desktop. The page has no username yet, so this uses its numeric page ID; switch to
  // m.me/<username> if one is set. null hides every Messenger link.
  messenger: "https://m.me/61591799498450",
};
