"use client";

import Link from "next/link";
import type { EnrichedAdoption } from "@/lib/adoption";
import { TIER_COLORS, DIM_COLORS, DIM_LABELS } from "@/lib/adoption";

interface Props {
  country: EnrichedAdoption;
  rank: number;
}

const DIM_KEYS = ["government", "enterprise", "talent_demand", "consumer", "pipeline"] as const;

const DIM_SHORT: Record<string, string> = {
  government:    "Gov",
  enterprise:    "Biz",
  talent_demand: "Talent",
  consumer:      "Users",
  pipeline:      "R&D",
};

export default function AdoptionCard({ country, rank }: Props) {
  const tierStyle = TIER_COLORS[country.adoption_tier] ?? TIER_COLORS["Nascent Adoption"];
  const gap = country.adoption_gap;

  return (
    <Link
      href={`/country/${country.slug}`}
      className="group block relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,.45)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,.30)";
        (e.currentTarget as HTMLElement).style.boxShadow  = "0 4px 20px rgba(0,0,0,.5), 0 0 0 1px rgba(34,197,94,.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.boxShadow  = "0 1px 3px rgba(0,0,0,.45)";
      }}
    >
      {/* Top accent bar — colour-coded by tier */}
      <div className="h-0.5 w-full" style={{ background: tierStyle.color, opacity: 0.7 }} />

      <div className="p-5">
        {/* Row 1: Rank · Flag · Country · Score */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 text-center pt-0.5">
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-3)" }}>
              #{rank}
            </span>
          </div>
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
          <div className="flex-shrink-0 text-right">
            <span className="text-3xl font-black leading-none tabular-nums" style={{ color: tierStyle.color }}>
              {country.adoption_total}
            </span>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>/100</span>
          </div>
        </div>

        {/* Row 2: Tier badge + gap badge */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{ background: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}` }}>
            {country.adoption_tier}
          </span>
          {gap > 2 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: "rgba(74,222,128,.08)", color: "#4ade80", border: "1px solid rgba(74,222,128,.25)" }}>
              ↑ +{gap} vs readiness
            </span>
          )}
          {gap < -2 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: "rgba(245,158,11,.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,.25)" }}>
              ↓ {gap} vs readiness
            </span>
          )}
        </div>

        {/* Row 3: Segmented adoption dimension bar */}
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
          <div className="flex h-2">
            {DIM_KEYS.map((key) => {
              const score = country.adoption_scores[key];
              return (
                <div key={key} className="flex-1 overflow-hidden"
                  title={`${DIM_LABELS[key]}: ${score}/20`}>
                  <div className="h-full" style={{ background: "var(--raised)" }}>
                    <div className="h-full transition-all"
                      style={{ width: `${(score / 20) * 100}%`, background: DIM_COLORS[key] }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex" style={{ borderTop: "1px solid var(--border)" }}>
            {DIM_KEYS.map((key) => {
              const score = country.adoption_scores[key];
              return (
                <div key={key} className="flex-1 text-center py-1.5 px-1">
                  <p className="text-[9px] font-medium mb-0.5" style={{ color: "var(--text-3)" }}>
                    {DIM_SHORT[key]}
                  </p>
                  <p className="text-[11px] font-bold tabular-nums" style={{ color: DIM_COLORS[key] }}>
                    {score}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 4: Top adoption driver */}
        <p className="text-xs leading-snug" style={{ color: "var(--text-3)" }}>
          {country.top_adoption_driver}
        </p>
      </div>

      {/* Hover CTA strip */}
      <div className="px-5 py-2.5 flex items-center justify-between transition-all duration-200 opacity-0 group-hover:opacity-100"
        style={{ borderTop: "1px solid var(--border)", background: "rgba(34,197,94,.06)" }}>
        <span className="text-xs font-semibold" style={{ color: "#4ade80" }}>
          View Country Profile
        </span>
        <span className="text-xs" style={{ color: "#4ade80" }}>→</span>
      </div>
    </Link>
  );
}
