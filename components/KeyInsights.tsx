"use client";

import { ScoredCountry } from "@/lib/types";
import { SortKey, Region } from "@/components/FilterBar";

interface KeyInsightsProps {
  countries: ScoredCountry[];
  onSortChange: (s: SortKey) => void;
  onRegionChange: (r: Region) => void;
  onNavigate: (href: string) => void;
}

interface Insight {
  icon: string;
  category: string;
  text: string;
  onClick: () => void;
}

export default function KeyInsights({
  countries,
  onSortChange,
  onRegionChange,
  onNavigate,
}: KeyInsightsProps) {
  if (countries.length === 0) return null;

  const insights: Insight[] = [];

  // 1. Global leader
  const byScore = [...countries].sort((a, b) => b.total_score - a.total_score);
  const leader = byScore[0];
  insights.push({
    icon: "🏆",
    category: "Global Leader",
    text: `${leader.flag} ${leader.name} leads globally at ${leader.total_score}/100`,
    onClick: () => onNavigate("/country/" + leader.slug),
  });

  // 2. Fastest mover
  const byGain = [...countries].sort(
    (a, b) =>
      b.projected_score_2028 - b.total_score - (a.projected_score_2028 - a.total_score)
  );
  const mover = byGain[0];
  const delta = Math.round(mover.projected_score_2028 - mover.total_score);
  insights.push({
    icon: "⚡",
    category: "Fastest Mover",
    text: `${mover.flag} ${mover.name} is the fastest-rising nation — +${delta} pts by 2028`,
    onClick: () => onSortChange("trajectory_gain"),
  });

  // 3. Regional leader
  const regionMap: Record<string, { total: number; count: number }> = {};
  for (const c of countries) {
    if (!regionMap[c.region]) regionMap[c.region] = { total: 0, count: 0 };
    regionMap[c.region].total += c.total_score;
    regionMap[c.region].count += 1;
  }
  const globalAvg =
    countries.reduce((sum, c) => sum + c.total_score, 0) / countries.length;
  let topRegion = "";
  let topRegionAvg = -1;
  for (const [region, data] of Object.entries(regionMap)) {
    const avg = data.total / data.count;
    if (avg > topRegionAvg) {
      topRegionAvg = avg;
      topRegion = region;
    }
  }
  const regionGap = Math.round(topRegionAvg - globalAvg);
  insights.push({
    icon: "🌍",
    category: "Regional Leader",
    text: `${topRegion} leads regions at ${Math.round(topRegionAvg)}/100 — ${regionGap} pts above global average`,
    onClick: () => onRegionChange(topRegion as Region),
  });

  // 4. Africa investment gap
  const africaCountries = countries.filter(
    (c) => c.region === "Middle East & Africa"
  );
  const africaInvAvg =
    africaCountries.length > 0
      ? africaCountries.reduce((sum, c) => sum + c.scores.investment.score, 0) /
        africaCountries.length
      : 0;
  insights.push({
    icon: "⚠️",
    category: "Investment Gap",
    text: `Investment is Africa & Middle East's weakest pillar at ${africaInvAvg.toFixed(1)}/20 avg`,
    onClick: () => onNavigate("/africa"),
  });

  // 5. Governance gap
  const govGapCount = countries.filter((c) => {
    const avgPillar = c.total_score / 5;
    return c.scores.governance.score < avgPillar;
  }).length;
  insights.push({
    icon: "📋",
    category: "Governance Gap",
    text: `${govGapCount} economies score below average on governance — the widest gap globally`,
    onClick: () => onSortChange("governance_gap"),
  });

  return (
    <div className="mb-6">
      {/* Heading row */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          Key Insights
        </span>
        {countries.length > 0 && (
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
            Auto-generated from live data
          </span>
        )}
      </div>

      {/* Horizontal scrolling row */}
      <div
        className="flex gap-3 pb-2"
        style={{ overflowX: "auto", scrollbarWidth: "none" }}
      >
        {insights.map((insight, i) => (
          <div
            key={i}
            onClick={insight.onClick}
            className="transition-all duration-200"
            style={{
              minWidth: "240px",
              borderRadius: "0.75rem",
              padding: "1rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid var(--accent)",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--border)";
              (e.currentTarget as HTMLDivElement).style.borderLeftColor =
                "var(--accent)";
            }}
          >
            {/* Top row: icon + category */}
            <div className="flex items-center gap-1.5">
              <span className="text-lg leading-none">{insight.icon}</span>
              <span
                className="text-[10px] uppercase tracking-widest font-bold"
                style={{ color: "var(--accent)" }}
              >
                {insight.category}
              </span>
            </div>

            {/* Main text */}
            <p
              className="text-sm font-semibold mt-1 leading-snug"
              style={{ color: "var(--text-1)" }}
            >
              {insight.text}
            </p>

            {/* Explore link */}
            <p className="text-[10px] mt-2" style={{ color: "var(--text-3)" }}>
              Explore →
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
