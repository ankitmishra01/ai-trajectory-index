"use client";

import Link from "next/link";
import type { EnrichedAdoption } from "@/lib/adoption";
import { TIER_COLORS, DIM_LABELS, DIM_COLORS } from "@/lib/adoption";

interface Props {
  country: EnrichedAdoption;
  rank: number;
}

const DIM_KEYS = ["government", "enterprise", "talent_demand", "consumer", "pipeline"] as const;

export default function AdoptionCard({ country, rank }: Props) {
  const tierStyle = TIER_COLORS[country.adoption_tier] ?? TIER_COLORS["Nascent Adoption"];
  const gap = country.adoption_gap;
  const gapPositive = gap > 2;
  const gapNegative = gap < -2;

  // Top accent bar color by tier
  const accentColor = tierStyle.color;

  return (
    <Link href={`/country/${country.slug}`} style={{ textDecoration: "none" }}>
      <div className="card rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01] cursor-pointer h-full flex flex-col"
        style={{ position: "relative" }}>

        {/* Top accent */}
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}66, ${accentColor})` }} />

        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black w-6 text-center" style={{ color: "var(--text-3)" }}>
                {rank}
              </span>
              <span className="text-2xl">{country.flag}</span>
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--text-1)" }}>
                  {country.name}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>{country.region}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black leading-none" style={{ color: accentColor }}>
                {country.adoption_total}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>/100</p>
            </div>
          </div>

          {/* Tier + gap badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
              style={{ background: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}` }}>
              {country.adoption_tier}
            </span>
            {gapPositive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(74,222,128,.08)", color: "#4ade80", border: "1px solid rgba(74,222,128,.25)" }}>
                +{gap} vs readiness
              </span>
            )}
            {gapNegative && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(245,158,11,.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,.25)" }}>
                {gap} vs readiness
              </span>
            )}
          </div>

          {/* Dimension bars */}
          <div className="space-y-2 flex-1">
            {DIM_KEYS.map((key) => {
              const score = country.adoption_scores[key];
              const pct = (score / 20) * 100;
              const color = DIM_COLORS[key];
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                      {DIM_LABELS[key]}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: "var(--text-2)" }}>{score}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--raised)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Driver */}
          <p className="text-[11px] leading-snug pt-1" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
            {country.top_adoption_driver}
          </p>
        </div>
      </div>
    </Link>
  );
}
