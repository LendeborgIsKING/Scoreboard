import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Saira_Stencil_One,
  Rajdhani,
  Audiowide,
  Playfair_Display_SC,
  Bungee,
  Iceberg,
  Cinzel,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sairaStencil = Saira_Stencil_One({
  weight: "400",
  variable: "--font-saira-stencil",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["500", "600", "700"],
});

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-audiowide",
});

const playfairSc = Playfair_Display_SC({
  subsets: ["latin"],
  variable: "--font-playfair-sc",
  weight: ["400", "700"],
});

const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bungee",
});

const iceberg = Iceberg({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-iceberg",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["600", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Scoreboard",
  description: "Scoreboard app — deployed on Vercel",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Scoreboard",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sairaStencil.variable} ${rajdhani.variable} ${audiowide.variable} ${playfairSc.variable} ${bungee.variable} ${iceberg.variable} ${cinzel.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
