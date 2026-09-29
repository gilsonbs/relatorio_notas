import { appPath } from "@/config/paths";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaStatus } from "@/components/PwaStatus";
export const metadata: Metadata = {
  title: "Relatório de Notas | Filial 15",
  icons: {
    icon: appPath("/icons/icon-192.png"),
    apple: appPath("/icons/icon-192.png"),
  },
  description:
    "Organize as notas recebidas e prepare o relatório da Filial 15.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#174f42",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaStatus />
      </body>
    </html>
  );
}
