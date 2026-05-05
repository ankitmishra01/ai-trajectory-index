import Link from "next/link";

interface SiteHeaderProps {
  activePage?: "index" | "map" | "compare" | "adoption" | "methodology";
  usingLive?: boolean;
  lastFetched?: string | null;
}

const NAV = [
  { label: "Index",       href: "/",            key: "index"       },
  { label: "Map",         href: "/map",          key: "map"         },
  { label: "Compare",     href: "/compare/usa/china", key: "compare"     },
  { label: "Adoption",    href: "/adoption",     key: "adoption"    },
  { label: "Methodology", href: "/methodology",  key: "methodology" },
];

export default function SiteHeader({ activePage, usingLive, lastFetched }: SiteHeaderProps) {
  const now = new Date();
  const dateStr = now
    .toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  return (
    <header style={{ background: "var(--ed-bg)", borderBottom: "1px solid var(--ed-border)" }}>
      {/* Date strip */}
      <div style={{ borderBottom: "1px solid var(--ed-border)", padding: "8px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ed-text-2)", letterSpacing: "0.04em" }}>
          <span>{dateStr}</span>
          <span style={{ color: "var(--ed-border-strong)" }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: usingLive ? "var(--positive)" : "var(--ed-muted)", display: "inline-block" }} />
            {usingLive ? "LIVE · WORLD BANK · 17 INDICATORS" : lastFetched ? `CACHED · ${lastFetched.toUpperCase()}` : "17 INDICATORS · WORLD BANK"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ed-text-2)" }}>
          <Link href="/methodology" style={{ color: "inherit", textDecoration: "none" }}>Methodology</Link>
          <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Cite</a>
          <Link href="/" style={{ color: "var(--signal)", fontWeight: 600, textDecoration: "none" }}>Index</Link>
        </div>
      </div>

      {/* Masthead */}
      <div style={{ padding: "20px 48px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--signal)", fontWeight: 600, letterSpacing: "0.12em", marginBottom: 4 }}>
            VOL. III · 2026 EDITION
          </div>
          <Link href="/" style={{ textDecoration: "none" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.02em", color: "var(--ed-text-0)", lineHeight: 1, margin: 0 }}>
              The AI Trajectory Index
            </h1>
          </Link>
        </div>
        <nav style={{ display: "flex", gap: 28, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500 }}>
          {NAV.map((l) => {
            const isActive = activePage === l.key;
            return (
              <Link
                key={l.key}
                href={l.href}
                style={{
                  color: isActive ? "var(--ed-text-0)" : "var(--ed-text-1)",
                  borderBottom: isActive ? "2px solid var(--signal)" : "2px solid transparent",
                  paddingBottom: 4,
                  textDecoration: "none",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
