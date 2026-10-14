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

  const PILLARS = [
    ["infrastructure", "Infrastructure"],
    ["talent", "Talent"],
    ["governance", "Governance"],
    ["investment", "Investment"],
    ["economic_readiness", "Economic Readiness"],
  ] as const;
  const avg = (xs: ScoredCountry[], f: (c: ScoredCountry) => number) =>
    xs.length ? xs.reduce((s, c) => s + f(c), 0) / xs.length : 0;

  // Governance: compare regional averages of the Governance pillar (0-20), not total readiness.
  const regions = Array.from(new Set(countries.map((c) => c.region)));
  const globalGovAvg = avg(countries, (c) => c.scores.governance.score);
  let topRegion = "";
  let topRegionGovAvg = -1;
  for (const r of regions) {
    const a = avg(countries.filter((c) => c.region === r), (c) => c.scores.governance.score);
    if (a > topRegionGovAvg) { topRegionGovAvg = a; topRegion = r; }
  }

  // Middle East & Africa: report its actual weakest pillar rather than assuming one.
  const meaCountries = countries.filter((c) => c.region === "Middle East & Africa");
  const meaPillars = PILLARS.map(([key, label]) => ({ label, avg: avg(meaCountries, (c) => c.scores[key].score) }))
    .sort((a, b) => a.avg - b.avg);
  const meaWeakest = meaPillars[0];
  const tenth = byScore[Math.min(9, byScore.length - 1)];

  const insights: Insight[] = [
    {
      kicker: "CONVERGENCE",
      body: `The top 10 readiness scores sit between ${tenth.total_score} and ${leader.total_score} out of 100, so frontier capacity is now table stakes among advanced economies.`,
      onClick: () => onNavigate("/country/" + leader.slug),
    },
    {
      kicker: "TRAJECTORY",
      body: `${mover.flag} ${mover.name} has the largest projected gain, +${delta} pts by 2028, a directional scenario that separates rising economies from plateauing ones.`,
      onClick: () => onSortChange("trajectory_gain"),
    },
    {
      kicker: "GOVERNANCE",
      body: `${topRegion} leads on Governance at ${topRegionGovAvg.toFixed(1)}/20 on average, ${(topRegionGovAvg - globalGovAvg).toFixed(1)} pts above the global average of ${globalGovAvg.toFixed(1)}/20.`,
      onClick: () => onRegionChange(topRegion as Region),
    },
    {
      kicker: "REGIONAL GAP",
      body: `${meaWeakest.label} is the weakest pillar across Middle East & Africa at ${meaWeakest.avg.toFixed(1)}/20 on average.`,
      onClick: () => onNavigate("/africa"),
    },
  ];

  return (
    <section data-insights style={{ background: "var(--ed-raised)", padding: "64px 48px", borderTop: "1px solid var(--ed-border)" }}>
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
