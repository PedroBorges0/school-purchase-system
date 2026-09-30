import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de Compras — Colégio Conexão",
  description: "Sistema de gestão de requisições de compra",
  icons: {
    icon: "/icon.jpeg",
    shortcut: "/icon.jpeg",
    apple: "/icon.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}