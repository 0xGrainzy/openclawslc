import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://openclawslc.com"),
  title: "OpenClaw SLC — Salt Lake City's AI + Crypto Community",
  description:
    "Salt Lake City's community for AI agent builders, crypto founders, and the people shipping the next wave. Monthly events, meetups, and connections across the Wasatch.",
  keywords: [
    "OpenClaw SLC",
    "Salt Lake City crypto",
    "SLC AI agents",
    "Utah crypto community",
    "Salt Lake City blockchain",
    "AI agents Salt Lake City",
    "crypto meetup SLC",
    "Utah AI builders",
  ],
  openGraph: {
    type: "website",
    url: "https://openclawslc.com",
    title: "OpenClaw SLC — Salt Lake City's AI + Crypto Community",
    description:
      "Salt Lake City's community for AI agent builders, crypto founders, and the next wave of frontier tech.",
    siteName: "OpenClaw SLC",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw SLC",
    description: "Salt Lake City's AI + Crypto Community",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
