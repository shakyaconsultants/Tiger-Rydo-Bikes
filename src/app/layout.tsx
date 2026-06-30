import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PublicAutoRefresh from "@/components/PublicAutoRefresh";
import { BRAND } from "@/lib/constants";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.fullName} — ${BRAND.tagline}`,
  description:
    "Tiger Rydo is the electric scooter brand for modern city riders who want premium design, reliable performance, and a clean identity. Built for the city. Smart. Clean. Electric.",
  keywords: [
    "electric scooter",
    "e-scooter",
    "Tiger Rydo",
    "urban mobility",
    "EV",
    "electric vehicle",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: `${BRAND.fullName} — ${BRAND.tagline}`,
    description: BRAND.promise,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body className="antialiased">
        <PublicAutoRefresh />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
