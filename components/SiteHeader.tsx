"use client";

import Link from "next/link";
import { useState } from "react";
import { copyText } from "@/lib/copyText";

interface SiteHeaderProps {
  activePage?: "index" | "map" | "explore" | "compare" | "adoption" | "methodology";
  usingLive?: boolean;
  lastFetched?: string | null;
  citation?: string;
}

const NAV = [
  { label: "Index", href: "/", key: "index" },
  { label: "Map", href: "/map", key: "map" },
  { label: "Explore", href: "/explore", key: "explore" },
  { label: "Compare", href: "/compare/usa/china", key: "compare" },
  { label: "Adoption", href: "/adoption", key: "adoption" },
  { label: "Methodology", href: "/methodology", key: "methodology" },
] as const;

const SITE_CITATION = "Mishra, A. (2026). AI Trajectory Index: Scoring 186 Economies on AI Readiness and 3–5 Year Trajectory. https://ai-trajectory-index.vercel.app";

function formatStatus(usingLive?: boolean, lastFetched?: string | null) {
  const date = lastFetched ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastFetched)) : null;
  if (!date) return "2026 EDITION · 17 INDICATORS";
  return `${usingLive ? "LIVE SOURCES" : "BASELINE FALLBACK"} · UPDATED ${date.toUpperCase()}`;
}

export default function SiteHeader({ activePage, usingLive, lastFetched, citation = SITE_CITATION }: SiteHeaderProps) {
  const [copied, setCopied] = useState(false);
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  async function copyCitation() {
    if (await copyText(citation)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <header style={{ background: "var(--ed-bg)", borderBottom: "1px solid var(--ed-border)", position: "relative", zIndex: 30 }}>
      <div className="site-utility" style={{ borderBottom: "1px solid var(--ed-border)", padding: "8px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ed-text-2)", letterSpacing: ".06em", minWidth: 0 }}>
          <span>{dateStr}</span><span aria-hidden="true">·</span>
          <span className="score-nowrap" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 99, background: usingLive ? "var(--positive)" : "var(--ed-muted)" }} />
            {formatStatus(usingLive, lastFetched)}
          </span>
        </div>
        <button onClick={copyCitation} className="cite-button" style={{ border: 0, background: "transparent", color: "var(--ed-text-1)", font: "600 12px var(--font-sans)", cursor: "pointer", padding: "4px 0" }}>
          {copied ? "Citation copied ✓" : "Cite this index"}
        </button>
      </div>
      <div className="site-masthead" style={{ padding: "20px 48px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 5 }}>VOL. III · 2026 EDITION</div>
          <Link href="/" style={{ textDecoration: "none" }}><span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 38px)", fontWeight: 450, fontStyle: "italic", letterSpacing: "-.025em", color: "var(--ed-text-0)", lineHeight: 1 }}>The AI Trajectory Index</span></Link>
        </div>
        <nav data-desktop-nav aria-label="Primary" style={{ display: "flex", gap: 24, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600 }}>
          {NAV.map((item) => { const active = activePage === item.key; return <Link key={item.key} href={item.href} aria-current={active ? "page" : undefined} style={{ color: active ? "var(--ed-text-0)" : "var(--ed-text-1)", borderBottom: active ? "2px solid var(--signal)" : "2px solid transparent", padding: "8px 0 5px", textDecoration: "none" }}>{item.label}</Link>; })}
        </nav>
        <details className="mobile-nav"><summary aria-label="Open navigation">Menu</summary><nav aria-label="Mobile primary">{NAV.map((item) => <Link key={item.key} href={item.href}>{item.label}</Link>)}</nav></details>
      </div>
      {copied && <div className="status-toast" role="status">Citation copied to clipboard</div>}
    </header>
  );
}
