type OptionalLink = string | null;

export const contactDetails = {
  phone: {
    label: "+995...",
    href: null as OptionalLink,
  },
  address: "აქ დაამატეთ მისამართი",
  openingHours: "ორშაბათი–შაბათი, 10:00–19:00",
  mapEmbedUrl:
    "https://www.google.com/maps?q=41.7106,44.7519&z=15&output=embed",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=41.7106%2C44.7519",
} as const;

export const socialLinks: {
  facebook: OptionalLink;
  instagram: OptionalLink;
} = {
  facebook: null,
  instagram: null,
};
