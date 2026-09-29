import { appPath } from "@/config/paths";
import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: appPath("/"),
    name: "Relatório de Notas Filial 15",
    short_name: "Notas Filial 15",
    description: "Relatório de notas recebidas, com leitura local e PDF.",
    lang: "pt-BR",
    start_url: appPath("/"),
    scope: appPath("/"),
    display: "standalone",
    background_color: "#f7f8f3",
    theme_color: "#174f42",
    icons: [
      {
        src: appPath("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: appPath("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: appPath("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
