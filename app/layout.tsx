import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elevate — Liga C/I",
  description: "Registro de células, costos y facturas para la liga interna de eficiencia (Cost/Income) de Elevate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
