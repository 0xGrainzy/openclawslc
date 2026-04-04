import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://openclawslc.com"),
  title: "OpenClaw SLC — Salt Lake City's AI + Crypto Community",
  description:
    "Salt Lake City's community for AI agent builders, crypto founders, and the people shipping the next wave. Monthly events and meetups across the Wasatch.",
  keywords: ["AI", "crypto", "Salt Lake City", "SLC", "blockchain", "agents", "builders", "Wasatch", "meetup"],
  authors: [{ name: "OpenClaw SLC" }],
  openGraph: {
    type: "website",
    url: "https://openclawslc.com",
    siteName: "OpenClaw SLC",
    title: "OpenClaw SLC — Salt Lake City's AI + Crypto Community",
    description: "Salt Lake City's AI + Crypto community. Builders, founders, degens. Monthly meetups across the Wasatch.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw SLC",
    description: "Salt Lake City's AI + Crypto community. Monthly meetups.",
    site: "@openclawslc",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  );
}
