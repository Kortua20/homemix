import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Home Mix",
    short_name: "Home Mix",
    description: "თანამედროვე ავეჯი თქვენი სახლისთვის.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f2ed",
    theme_color: "#173c2f",
    lang: "ka",
    icons: [{ src: "/logo.png", sizes: "any", type: "image/png" }],
  };
}
