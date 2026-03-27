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

export default function CountryCard({ country, rank }: CountryCardProps) {
  const scoreColor =
    country.total_score >= 80
      ? "text-emerald-400"
      : country.total_score >= 60
      ? "text-blue-400"
      : country.total_score >= 40
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="group relative bg-[#0f1628] border border-[#1c2847] rounded-2xl p-5 hover:border-blue-500/50 hover:bg-[#111827] transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.08)] flex flex-col gap-4">
      {/* Rank badge */}
      <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#1c2847] flex items-center justify-center text-xs font-bold text-slate-400">
        #{rank}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        <span className="text-3xl leading-none">{country.flag}</span>
        <div>
          <h3 className="text-base font-bold text-white leading-tight">
            {country.name}
          </h3>
          <span className="text-xs text-slate-500">{country.region}</span>
        </div>
        <div className="ml-auto text-right">
          <span className={`text-3xl font-black ${scoreColor}`}>
            {country.total_score}
          </span>
          <span className="text-slate-500 text-sm">/100</span>
        </div>
      </div>

      {/* Trajectory */}
      <div className="flex flex-wrap items-center gap-2">
        <TrajectoryArrow
          label={country.trajectory_label}
          score={country.trajectory_score}
          size="sm"
        />
        <span className="text-xs text-slate-500">
          → <span className="text-slate-300 font-semibold">{country.projected_score_2028}</span>/100 by 2028
        </span>
      </div>

      {/* Dimension bars (compact) */}
      <div className="space-y-2">
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
      <div className="space-y-1.5">
        <div className="flex gap-2 items-start">
          <span className="text-emerald-400 text-xs mt-0.5">▲</span>
          <p className="text-xs text-emerald-400/90 line-clamp-1 leading-relaxed">
            {country.top_accelerator}
          </p>
        </div>
        <div className="flex gap-2 items-start">
          <span className="text-red-400 text-xs mt-0.5">▼</span>
          <p className="text-xs text-red-400/90 line-clamp-1 leading-relaxed">
            {country.top_risk}
          </p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/country/${country.slug}`}
        className="mt-auto block w-full text-center py-2.5 rounded-xl bg-[#1c2847] text-blue-400 text-sm font-semibold hover:bg-blue-500 hover:text-white transition-all duration-200 border border-[#1c2847] hover:border-blue-500"
      >
        View Analysis →
      </Link>
    </div>
  );
}
