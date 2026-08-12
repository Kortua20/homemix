type OptionalLink = string | null;

export const contactDetails = {
  phone: {
    label: "+995 599 93 30 56",
    href: "tel:+995599933056" as OptionalLink,
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
} = {
  facebook: "https://www.facebook.com/share/1D7jGkdW2P/?mibextid=wwXIfr",
};
