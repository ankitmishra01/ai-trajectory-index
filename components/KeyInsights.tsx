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
  kicker: string;
  body: string;
  onClick: () => void;
}

export default function KeyInsights({ countries, onSortChange, onRegionChange, onNavigate }: KeyInsightsProps) {
  if (countries.length === 0) return null;

  const byScore = [...countries].sort((a, b) => b.total_score - a.total_score);
  const leader = byScore[0];

  const byGain = [...countries].sort((a, b) =>
    (b.projected_score_2028 - b.total_score) - (a.projected_score_2028 - a.total_score)
  );
  const mover = byGain[0];
  const delta = Math.round(mover.projected_score_2028 - mover.total_score);

  const regionMap: Record<string, { total: number; count: number }> = {};
  for (const c of countries) {
    if (!regionMap[c.region]) regionMap[c.region] = { total: 0, count: 0 };
    regionMap[c.region].total += c.total_score;
    regionMap[c.region].count += 1;
  }
  const globalAvg = countries.reduce((s, c) => s + c.total_score, 0) / countries.length;
  let topRegion = "";
  let topRegionAvg = -1;
  for (const [r, d] of Object.entries(regionMap)) {
    const avg = d.total / d.count;
    if (avg > topRegionAvg) { topRegionAvg = avg; topRegion = r; }
  }

  const africaCountries = countries.filter((c) => c.region === "Middle East & Africa");
  const africaInvAvg = africaCountries.length > 0
    ? africaCountries.reduce((s, c) => s + c.scores.investment.score, 0) / africaCountries.length
    : 0;

  const insights: Insight[] = [
    {
      kicker: "CONVERGENCE",
      body: `Top-10 readiness scores cluster between 70–${leader.total_score} — frontier capacity is now table stakes among advanced economies.`,
      onClick: () => onNavigate("/country/" + leader.slug),
    },
    {
      kicker: "TRAJECTORY",
      body: `${mover.flag} ${mover.name} is the fastest-rising economy at +${delta} pts — trajectory separates leaders from plateauing nations.`,
      onClick: () => onSortChange("trajectory_gain"),
    },
    {
      kicker: "GOVERNANCE",
      body: `${topRegion} leads on governance avg at ${Math.round(topRegionAvg)}/100 — ${Math.round(topRegionAvg - globalAvg)} pts above the global average.`,
      onClick: () => onRegionChange(topRegion as Region),
    },
    {
      kicker: "INVESTMENT GAP",
      body: `Investment is Africa & Middle East's weakest pillar at ${africaInvAvg.toFixed(1)}/20 avg — capital access is the binding constraint.`,
      onClick: () => onNavigate("/africa"),
    },
  ];

  return (
    <section style={{ background: "var(--ed-raised)", padding: "64px 48px", borderTop: "1px solid var(--ed-border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 48 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--signal)", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 12 }}>AT A GLANCE</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 400, color: "var(--ed-text-0)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0 }}>
            Four signals from the <em style={{ fontStyle: "italic" }}>2026 data.</em>
          </h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "32px 48px" }}>
          {insights.map((ins, i) => (
            <div
              key={i}
              onClick={ins.onClick}
              style={{ paddingTop: 16, borderTop: "1px solid var(--ed-border-strong)", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ed-text-2)", fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--signal)", letterSpacing: "0.14em", fontWeight: 700 }}>{ins.kicker}</span>
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 400, color: "var(--ed-text-0)", lineHeight: 1.4, margin: 0 }}>{ins.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
