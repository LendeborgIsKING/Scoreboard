import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Saira_Stencil_One } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Scoreboard",
  description: "Scoreboard app — deployed on Vercel",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      className={`${geistSans.variable} ${geistMono.variable} ${sairaStencil.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
