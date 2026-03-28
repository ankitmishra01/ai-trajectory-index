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

function scoreColorClass(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function scoreGlowStyle(score: number): React.CSSProperties {
  const color =
    score >= 80
      ? "rgba(52,211,153,0.4)"
      : score >= 60
      ? "rgba(96,165,250,0.4)"
      : score >= 40
      ? "rgba(251,191,36,0.4)"
      : "rgba(248,113,113,0.4)";
  return { textShadow: `0 0 20px ${color}` };
}

export default function CountryCard({ country, rank }: CountryCardProps) {
  const scoreClass = scoreColorClass(country.total_score);

  return (
    <div className="group relative bg-[#0c1322] border border-[#1a2540] rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:border-blue-500/40 hover:bg-[#0e1929] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_12px_40px_rgba(59,130,246,0.1)] overflow-hidden">
      {/* Subtle top glow on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Rank badge */}
      <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#1a2540] border border-[#243360] flex items-center justify-center text-[11px] font-bold text-slate-500 group-hover:border-blue-500/40 group-hover:text-blue-400 transition-all">
        #{rank}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        <span className="text-4xl leading-none">{country.flag}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white leading-tight truncate">
            {country.name}
          </h3>
          <span className="text-xs text-slate-500 mt-0.5 block">{country.region}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className={`text-3xl font-black ${scoreClass} leading-none`}
            style={scoreGlowStyle(country.total_score)}
          >
            {country.total_score}
          </span>
          <span className="text-slate-600 text-xs">/100</span>
        </div>
      </div>

      {/* Trajectory */}
      <div className="flex flex-wrap items-center gap-2">
        <TrajectoryArrow
          label={country.trajectory_label}
          score={country.trajectory_score}
          size="sm"
        />
        <span className="text-xs text-slate-600">
          →{" "}
          <span className="text-slate-300 font-semibold">
            {country.projected_score_2028}
          </span>
          <span className="text-slate-600"> by 2028</span>
        </span>
      </div>

      {/* Dimension bars (compact) */}
      <div className="space-y-1.5">
        {Object.entries(country.scores).map(([key, val]) => (
          <DimensionBar
            key={key}
            label={DIMENSION_LABELS[key]}
            score={val.score}
            height={5}
            showScore={false}
          />
        ))}
      </div>

      {/* Accelerator / Risk */}
      <div className="space-y-1.5 border-t border-[#1a2540] pt-3">
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
        className="mt-auto block w-full text-center py-2.5 rounded-xl bg-[#1a2540] text-blue-400 text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200 border border-[#243360] hover:border-blue-600 group-hover:border-blue-500/40"
      >
        View Analysis →
      </Link>
    </div>
  );
}
