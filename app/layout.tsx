import type { Metadata } from "next";
import "./globals.css";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
