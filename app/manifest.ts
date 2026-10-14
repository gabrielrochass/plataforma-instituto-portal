import type { MetadataRoute } from "next";
import { m } from "@/lib/i18n";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: m.app.name,
    short_name: m.app.shortName,
    description: m.app.description,
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf6ec",
    theme_color: "#faf6ec",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: m.attendance.take,
        url: "/chamada",
        icons: [
          { src: "/icons/chamada-96.png", sizes: "96x96", type: "image/png" },
        ],
      },
    ],
  };
}
