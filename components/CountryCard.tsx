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

interface CountryCardProps {
  country: CountryData;
  rank: number;
  isComparing?: boolean;
  onCompareToggle?: (slug: string) => void;
}

const PILLARS = [
  { key: "infrastructure",     short: "Infra", color: "#3b82f6" },
  { key: "talent",             short: "Talent", color: "#8b5cf6" },
  { key: "governance",         short: "Gov",    color: "#06b6d4" },
  { key: "investment",         short: "Invest", color: "#f59e0b" },
  { key: "economic_readiness", short: "Econ",   color: "#22c55e" },
] as const;

const TRAJ_CONFIG: Record<string, { symbol: string; color: string; bg: string; border: string }> = {
  "Strong Positive": { symbol: "↑↑", color: "#4ade80", bg: "rgba(34,197,94,.12)", border: "rgba(34,197,94,.35)" },
  Positive:          { symbol: "↑",  color: "#86efac", bg: "rgba(34,197,94,.08)", border: "rgba(34,197,94,.22)" },
  Neutral:           { symbol: "→",  color: "#94a3b8", bg: "rgba(148,163,184,.08)", border: "rgba(148,163,184,.2)" },
  Negative:          { symbol: "↓",  color: "#fb923c", bg: "rgba(251,146,60,.08)", border: "rgba(251,146,60,.22)" },
  "Strong Negative": { symbol: "↓↓", color: "#f87171", bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.35)" },
};

function scoreStyle(score: number): React.CSSProperties {
  const color =
    score >= 80 ? "#4ade80" :
    score >= 60 ? "#93c5fd" :
    score >= 40 ? "#fcd34d" : "#fca5a5";
  return { color };
}

function scoreBand(score: number) {
  if (score >= 80) return { label: "Leading",     color: "#4ade80", bg: "rgba(34,197,94,.10)",   border: "rgba(34,197,94,.25)"   };
  if (score >= 60) return { label: "Advanced",    color: "#93c5fd", bg: "rgba(96,165,250,.10)",  border: "rgba(96,165,250,.25)"  };
  if (score >= 40) return { label: "Developing",  color: "#fcd34d", bg: "rgba(251,191,36,.10)",  border: "rgba(251,191,36,.25)"  };
  return                   { label: "Nascent",     color: "#fca5a5", bg: "rgba(248,113,113,.10)", border: "rgba(248,113,113,.25)" };
}

export default function CountryCard({ country, rank, isComparing = false, onCompareToggle }: CountryCardProps) {
  const traj  = TRAJ_CONFIG[country.trajectory_label] ?? TRAJ_CONFIG["Neutral"];
  const band  = scoreBand(country.total_score);
  const delta = country.projected_score_2028 - country.total_score;

  return (
    <Link
      href={`/country/${country.slug}`}
      className="group block relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,.45)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,.30)";
        (e.currentTarget as HTMLElement).style.boxShadow  = "0 4px 20px rgba(0,0,0,.5), 0 0 0 1px rgba(59,130,246,.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.boxShadow  = "0 1px 3px rgba(0,0,0,.45)";
      }}
    >
      {/* Top accent bar — colour-coded by score band */}
      <div className="h-0.5 w-full" style={{ background: band.color, opacity: 0.7 }} />

      {/* Compare toggle button */}
      {onCompareToggle && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompareToggle(country.slug); }}
          className="absolute top-3 right-3 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150"
          title={isComparing ? "Remove from comparison" : "Add to comparison"}
          style={
            isComparing
              ? { background: "var(--accent)", border: "1.5px solid var(--accent)", boxShadow: "0 0 8px rgba(59,130,246,.5)" }
              : { background: "transparent", border: "1.5px solid rgba(59,130,246,.35)" }
          }
        >
          {isComparing ? (
            <svg className="w-2.5 h-2.5" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-2.5 h-2.5" fill="none" stroke="rgba(96,165,250,.8)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      )}

      <div className="p-5">
        {/* ── Row 1: Rank · Flag · Country · Score ── */}
        <div className="flex items-start gap-3 mb-4">
          {/* Rank */}
          <div className="flex-shrink-0 w-8 text-center pt-0.5">
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-3)" }}>
              #{rank}
            </span>
          </div>

          {/* Flag + name */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-3xl leading-none flex-shrink-0">{country.flag}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight truncate" style={{ color: "var(--text-1)" }}>
                {country.name}
              </h3>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-3)" }}>
                {country.region}
              </p>
            </div>
          </div>

          {/* Score */}
          <div className="flex-shrink-0 text-right">
            <span className="text-3xl font-black leading-none tabular-nums" style={scoreStyle(country.total_score)}>
              {country.total_score}
            </span>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>/100</span>
          </div>
        </div>

        {/* ── Row 2: Score band label + Trajectory ── */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{ background: band.bg, color: band.color, border: `1px solid ${band.border}` }}>
            {band.label}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>·</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
            style={{ background: traj.bg, color: traj.color, border: `1px solid ${traj.border}` }}>
            {traj.symbol} {country.trajectory_label}
          </span>
        </div>

        {/* ── Row 3: Pillar scores ── */}
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
          {/* Bar row */}
          <div className="flex h-2">
            {PILLARS.map((p) => {
              const score = country.scores[p.key].score;
              return (
                <div key={p.key} className="flex-1 overflow-hidden" title={`${p.short}: ${score}/20`}>
                  <div className="h-full" style={{ background: "var(--raised)" }}>
                    <div className="h-full transition-all" style={{ width: `${(score / 20) * 100}%`, background: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Labels row */}
          <div className="flex" style={{ borderTop: "1px solid var(--border)" }}>
            {PILLARS.map((p) => {
              const score = country.scores[p.key].score;
              return (
                <div key={p.key} className="flex-1 text-center py-1.5 px-1">
                  <p className="text-[9px] font-medium mb-0.5" style={{ color: "var(--text-3)" }}>{p.short}</p>
                  <p className="text-[11px] font-bold tabular-nums" style={{ color: p.color }}>{score}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Row 4: 2028 projection ── */}
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--text-3)" }}>
            Projected 2028:{" "}
            <span className="font-bold" style={{ color: "var(--accent)" }}>
              {country.projected_score_2028}/100
            </span>
          </span>
          <span className="font-semibold"
            style={{ color: delta > 0 ? "#4ade80" : delta < 0 ? "#f87171" : "var(--text-3)" }}>
            {delta > 0 ? "+" : ""}{delta} pts
          </span>
        </div>
      </div>

      {/* Hover CTA strip */}
      <div className="px-5 py-2.5 flex items-center justify-between transition-all duration-200 opacity-0 group-hover:opacity-100"
        style={{ borderTop: "1px solid var(--border)", background: "rgba(59,130,246,.06)" }}>
        <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
          View Country Profile
        </span>
        <span className="text-xs" style={{ color: "var(--accent)" }}>→</span>
      </div>
    </Link>
  );
}
