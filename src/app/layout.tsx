import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/lib/cart-context";
import PublicWidgets from "@/components/public/PublicWidgets";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maison Dorée – Horlogerie de Luxe",
  description:
    "Montres de luxe en Algérie – Chronographes, automatiques, diamant, classiques. Livraison dans toute l'Algérie. Paiement à la livraison.",
  keywords: [
    "montres luxe algérie",
    "montres chronographes",
    "montres automatiques",
    "montres diamant",
    "horlogerie luxe",
    "COD",
    "livraison algérie",
    "maison dorée",
  ],
  authors: [{ name: "Maison Dorée" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Maison Dorée – Horlogerie de Luxe",
    description:
      "Votre showroom de montres de luxe en ligne. Livraison partout en Algérie. Paiement à la livraison.",
    type: "website",
    locale: "fr_DZ",
    siteName: "Maison Dorée",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maison Dorée – Horlogerie de Luxe",
    description:
      "Votre showroom de montres de luxe en ligne. Livraison partout en Algérie.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-[#08080a] text-[#f5f5f0]`}
      >
        <CartProvider>
          {children}
          <PublicWidgets />
        </CartProvider>
        <Toaster />
      </body>
    </html>
  );
}
