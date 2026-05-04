"use client";

import Link from "next/link";

interface CountryData {
  slug: string;
  name: string;
  flag: string;
  region: string;
  total_score: number;
  trajectory_score: number;
  trajectory_label: string;
  projected_score_2028: number;
  top_accelerator: string;
  top_risk: string;
  scores: {
    infrastructure: { score: number };
    talent: { score: number };
    governance: { score: number };
    investment: { score: number };
    economic_readiness: { score: number };
  };
}

export interface CountryCardProps {
  country: CountryData;
  rank: number;
  variant?: "leader" | "dense";
  isComparing?: boolean;
  onCompareToggle?: (slug: string) => void;
  isWatchlisted?: boolean;
  onWatchlistToggle?: (slug: string) => void;
}

const PILLARS = [
  { key: "infrastructure"     as const, short: "Infra",  color: "var(--pillar-infra)"  },
  { key: "talent"             as const, short: "Talent", color: "var(--pillar-talent)" },
  { key: "governance"         as const, short: "Gov",    color: "var(--pillar-gov)"    },
  { key: "investment"         as const, short: "Inv",    color: "var(--pillar-invest)" },
  { key: "economic_readiness" as const, short: "Econ",   color: "var(--pillar-econ)"   },
];

const TRAJ_CONFIG: Record<string, { glyph: string; color: string }> = {
  "Strong Positive": { glyph: "▲▲", color: "var(--positive)" },
  "Positive":        { glyph: "▲",  color: "var(--positive)" },
  "Neutral":         { glyph: "◆",  color: "var(--dt-text-3)" },
  "Negative":        { glyph: "▼",  color: "var(--negative)" },
  "Strong Negative": { glyph: "▼▼", color: "var(--negative)" },
};

function MiniSparkline({ from, to, width = 56, height = 18 }: { from: number; to: number; width?: number; height?: number }) {
  const trend = to - from;
  const color = trend > 0 ? "var(--positive)" : trend < 0 ? "var(--negative)" : "var(--dt-text-3)";
  const pts = Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    const noise = Math.sin(i * 1.7) * Math.abs(trend) * 0.15;
    return from + trend * t + noise;
  });
  const min = Math.min(...pts) - 1;
  const max = Math.max(...pts) + 1;
  const range = max - min || 1;
  const pathD = pts.map((p, i) => {
    const x = (i / 11) * width;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const lastY = height - ((pts[11] - min) / range) * height;
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible", flexShrink: 0 }}>
      <path d={pathD} stroke={color} strokeWidth={1.25} fill="none" />
      <circle cx={width} cy={lastY.toFixed(2)} r={1.75} fill={color} />
    </svg>
  );
}

function PillarBars({ scores }: { scores: CountryData["scores"] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
      {PILLARS.map((p) => {
        const score = scores[p.key].score;
        return (
          <div key={p.key}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
              <div style={{ width: `${(score / 20) * 100}%`, height: "100%", background: p.color }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--dt-text-3)" }}>{p.short}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, color: "var(--dt-text-1)" }}>{score}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrajectoryGlyph({ label, traj }: { label: string; traj: number }) {
  const cfg = TRAJ_CONFIG[label] ?? TRAJ_CONFIG["Neutral"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 11, color: cfg.color, fontWeight: 600 }}>
      <span style={{ fontSize: 10 }}>{cfg.glyph}</span>
      <span>{traj > 0 ? "+" : ""}{traj}</span>
    </span>
  );
}

export default function CountryCard({
  country,
  rank,
  variant = "dense",
  isComparing = false,
  onCompareToggle,
  isWatchlisted = false,
  onWatchlistToggle,
}: CountryCardProps) {
  const baseStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    background: "var(--dt-surface)",
    border: "1px solid var(--dt-border)",
    textDecoration: "none",
    transition: "border-color .15s",
    position: "relative",
  };

  const actionBtns = (onWatchlistToggle || onCompareToggle) ? (
    <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, zIndex: 10 }}
      onClick={(e) => e.preventDefault()}>
      {onWatchlistToggle && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWatchlistToggle(country.slug); }}
          style={{
            width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
            background: isWatchlisted ? "rgba(181,138,46,.15)" : "transparent",
            border: isWatchlisted ? "1px solid rgba(181,138,46,.5)" : "1px solid var(--dt-border)",
            cursor: "pointer",
          }}
          title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
        >
          <span style={{ fontSize: 10 }}>{isWatchlisted ? "★" : "☆"}</span>
        </button>
      )}
      {onCompareToggle && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompareToggle(country.slug); }}
          style={{
            width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
            background: isComparing ? "var(--signal)" : "transparent",
            border: `1px solid ${isComparing ? "var(--signal)" : "var(--dt-border)"}`,
            cursor: "pointer",
          }}
          title={isComparing ? "Remove from comparison" : "Add to comparison"}
        >
          <span style={{ fontSize: 12, color: isComparing ? "#fff" : "var(--dt-text-2)" }}>{isComparing ? "✓" : "+"}</span>
        </button>
      )}
    </div>
  ) : null;

  if (variant === "leader") {
    return (
      <Link
        href={`/country/${country.slug}`}
        style={{ ...baseStyle, gap: 16, padding: 24 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--dt-border-strong)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--dt-border)"; }}
      >
        {actionBtns}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 8 }}>
              RANK · {String(rank).padStart(2, "0")} / 186
            </div>
            <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 8 }}>{country.flag}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--dt-text-0)", lineHeight: 1.05, letterSpacing: "-0.015em" }}>{country.name}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--dt-text-3)", marginTop: 4 }}>{country.region}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 44, fontWeight: 500, color: "var(--dt-text-0)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{country.total_score}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dt-text-3)", marginTop: 4 }}>/ 100</div>
            <div style={{ marginTop: 8 }}>
              <TrajectoryGlyph traj={Math.round(country.trajectory_score)} label={country.trajectory_label} />
            </div>
          </div>
        </div>

        {country.top_accelerator && (
          <p style={{ fontFamily: "var(--font-display)", fontSize: 13, fontStyle: "italic", color: "var(--dt-text-1)", lineHeight: 1.45, margin: 0 }}>
            &ldquo;{country.top_accelerator}&rdquo;
          </p>
        )}

        <PillarBars scores={country.scores} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--dt-border)", marginTop: "auto" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)" }}>
            2028 · <span style={{ color: "var(--dt-text-0)", fontWeight: 600 }}>{country.projected_score_2028}</span>
          </div>
          <MiniSparkline from={country.total_score} to={country.projected_score_2028} width={72} height={18} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--signal)", fontWeight: 600 }}>Profile →</span>
        </div>
      </Link>
    );
  }

  // Dense card
  return (
    <Link
      href={`/country/${country.slug}`}
      style={{ ...baseStyle, gap: 10, padding: 16 }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--dt-border-strong)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--dt-border)"; }}
    >
      {actionBtns}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingRight: (onWatchlistToggle || onCompareToggle) ? 52 : 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", fontWeight: 700 }}>#{rank}</span>
          <span style={{ fontSize: 20 }}>{country.flag}</span>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, color: "var(--dt-text-0)", lineHeight: 1.1 }}>{country.name}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--dt-text-3)" }}>{country.region}</div>
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 500, color: "var(--dt-text-0)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{country.total_score}</div>
      </div>

      <PillarBars scores={country.scores} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--dt-border)" }}>
        <TrajectoryGlyph traj={Math.round(country.trajectory_score)} label={country.trajectory_label} />
        <MiniSparkline from={country.total_score} to={country.projected_score_2028} width={44} height={14} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)" }}>→ {country.projected_score_2028}</span>
      </div>
    </Link>
  );
}
