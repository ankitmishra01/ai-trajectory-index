import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Trajectory Index — Scoring 186 Economies on AI Readiness & Trajectory",
  description:
    "A live, interactive index scoring 186 economies on current AI readiness and 3–5 year trajectory. World Bank data, WGI governance indicators, OECD policy data, and AI narratives.",
  openGraph: {
    title: "AI Trajectory Index",
    description: "Scoring 186 economies on current AI readiness and 3–5 year trajectory.",
    url: "https://ai-trajectory-index.vercel.app",
    siteName: "AI Trajectory Index",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
