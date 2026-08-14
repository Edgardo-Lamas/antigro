import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { BAJADA, PRODUCTO } from "@/lib/config";

const SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? "https://antigro.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  title: {
    default: `${PRODUCTO} — señales de grooming, sin leer un solo mensaje`,
    template: `%s | ${PRODUCTO}`,
  },
  description: BAJADA,
  authors: [{ name: "Edgardo Lamas" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: `${PRODUCTO} — señales de grooming, sin leer un solo mensaje`,
    description: BAJADA,
    type: "website",
    locale: "es_AR",
    siteName: PRODUCTO,
    url: SITIO,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <head>
        <meta name="theme-color" content="#0d1117" />
      </head>
      <body className={`${GeistSans.variable} antialiased`}>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-acento focus:px-4 focus:py-2 focus:font-semibold focus:text-fondo focus:outline-none"
        >
          Saltar al contenido
        </a>
        <div id="contenido" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  );
}
