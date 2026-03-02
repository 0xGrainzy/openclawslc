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
  openGraph: {
    type: "website",
    url: "https://openclawslc.com",
    title: "OpenClaw SLC",
    description: "Salt Lake City's AI + Crypto community. Builders, founders, degens.",
  },
  twitter: { card: "summary_large_image", title: "OpenClaw SLC" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
