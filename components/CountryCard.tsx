"use client";

import Link from "next/link";
import TrajectoryArrow from "./TrajectoryArrow";
import DimensionBar from "./DimensionBar";

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
}

const DIMENSION_LABELS: Record<string, string> = {
  infrastructure: "Infrastructure",
  talent: "Talent",
  governance: "Governance",
  investment: "Investment",
  economic_readiness: "Economic Readiness",
};

function scoreColor(score: number) {
  if (score >= 80) return { cls: "text-emerald-400", glow: "rgba(34,197,94,.45)" };
  if (score >= 60) return { cls: "text-blue-400",    glow: "rgba(96,165,250,.45)" };
  if (score >= 40) return { cls: "text-amber-400",   glow: "rgba(251,191,36,.45)" };
  return              { cls: "text-red-400",          glow: "rgba(248,113,113,.45)" };
}

export default function CountryCard({ country, rank }: CountryCardProps) {
  const { cls, glow } = scoreColor(country.total_score);

  return (
    <div className="card shine-on-hover flex flex-col gap-4 p-5 rounded-2xl">
      {/* Rank badge */}
      <div className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
        style={{ background: "var(--raised)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
        #{rank}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        <span className="text-4xl leading-none">{country.flag}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold leading-tight truncate" style={{ color: "var(--text-1)" }}>
            {country.name}
          </h3>
          <span className="text-xs mt-0.5 block" style={{ color: "var(--text-3)" }}>
            {country.region}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className={`text-3xl font-black leading-none ${cls}`}
            style={{ textShadow: `0 0 20px ${glow}` }}
          >
            {country.total_score}
          </span>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>/100</span>
        </div>
      </div>

      {/* Trajectory */}
      <div className="flex flex-wrap items-center gap-2">
        <TrajectoryArrow label={country.trajectory_label} score={country.trajectory_score} size="sm" />
        <span className="text-xs" style={{ color: "var(--text-3)" }}>
          →{" "}
          <span className="font-semibold" style={{ color: "var(--text-2)" }}>
            {country.projected_score_2028}
          </span>{" "}
          by 2028
        </span>
      </div>

      {/* Dimension bars */}
      <div className="space-y-1.5">
        {Object.entries(country.scores).map(([key, val]) => (
          <DimensionBar key={key} label={DIMENSION_LABELS[key]} score={val.score} height={5} showScore={false} />
        ))}
      </div>

      {/* Accelerator / Risk */}
      <div className="space-y-1.5 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2 items-start">
          <span className="text-emerald-400 text-xs mt-0.5 flex-shrink-0">▲</span>
          <p className="text-xs text-emerald-400/80 line-clamp-1 leading-relaxed">
            {country.top_accelerator}
          </p>
        </div>
        <div className="flex gap-2 items-start">
          <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">▼</span>
          <p className="text-xs text-red-400/80 line-clamp-1 leading-relaxed">
            {country.top_risk}
          </p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/country/${country.slug}`}
        className="btn-secondary mt-auto block w-full text-center py-2.5 rounded-xl text-sm"
        style={{ color: "var(--accent)" }}
      >
        View Analysis →
      </Link>
    </div>
  );
}
