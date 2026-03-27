import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Trajectory Index — Scoring 20 Countries on AI Readiness & Trajectory",
  description:
    "A live, interactive tool scoring every country on current AI readiness and forward-looking 3–5 year trajectory.",
  openGraph: {
    title: "AI Trajectory Index",
    description: "Scoring 20 countries on current AI readiness and 3–5 year trajectory.",
    url: "https://ai-index.ankitmishra.ca",
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
