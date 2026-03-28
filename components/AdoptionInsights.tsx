"use client";

import Link from "next/link";
import type { EnrichedAdoption } from "@/lib/adoption";

interface Props {
  data: EnrichedAdoption[];
  onSortChange: (s: string) => void;
  onRegionChange: (r: string) => void;
}

interface Insight {
  icon: string;
  category: string;
  text: string;
  href?: string;
  onClick?: () => void;
}

export default function AdoptionInsights({ data, onSortChange, onRegionChange }: Props) {
  if (data.length === 0) return null;

  const insights: Insight[] = [];

  // 1. Adoption leader
  const byAdoption = [...data].sort((a, b) => b.adoption_total - a.adoption_total);
  const leader = byAdoption[0];
  insights.push({
    icon: "🚀",
    category: "Adoption Leader",
    text: `${leader.flag} ${leader.name} leads global AI adoption at ${leader.adoption_total}/100`,
    href: `/country/${leader.slug}`,
  });

  // 2. Biggest leapfrogger
  const topLeapfrog = [...data].sort((a, b) => b.adoption_gap - a.adoption_gap)[0];
  insights.push({
    icon: "⚡",
    category: "Biggest Leapfrogger",
    text: `${topLeapfrog.flag} ${topLeapfrog.name} adopts AI ${topLeapfrog.adoption_gap} pts above its readiness capacity`,
    onClick: () => onSortChange("adoption_gap"),
  });

  // 3. Region with highest average adoption
  const regionTotals: Record<string, { total: number; count: number }> = {};
  for (const c of data) {
    if (!regionTotals[c.region]) regionTotals[c.region] = { total: 0, count: 0 };
    regionTotals[c.region].total += c.adoption_total;
    regionTotals[c.region].count += 1;
  }
  let topRegion = "", topRegionAvg = 0;
  for (const [r, d] of Object.entries(regionTotals)) {
    const a = d.total / d.count;
    if (a > topRegionAvg) { topRegionAvg = a; topRegion = r; }
  }
  const globalAvg = data.reduce((s, c) => s + c.adoption_total, 0) / data.length;
  insights.push({
    icon: "🌍",
    category: "Regional Leader",
    text: `${topRegion} has the highest avg adoption at ${Math.round(topRegionAvg)}/100 — ${Math.round(topRegionAvg - globalAvg)} pts above global`,
    onClick: () => onRegionChange(topRegion),
  });

  // 4. Government deployment leader
  const topGov = [...data].sort((a, b) => b.adoption_scores.government - a.adoption_scores.government)[0];
  insights.push({
    icon: "🏛️",
    category: "Gov. Deployment",
    text: `${topGov.flag} ${topGov.name} leads in government AI deployment with ${topGov.adoption_scores.government}/20`,
    onClick: () => onSortChange("government"),
  });

  // 5. Biggest underutiliser
  const topUnder = [...data].sort((a, b) => a.adoption_gap - b.adoption_gap)[0];
  insights.push({
    icon: "⚠️",
    category: "Underutiliser",
    text: `${topUnder.flag} ${topUnder.name} is ${Math.abs(topUnder.adoption_gap)} pts below its readiness — strong foundations, slow deployment`,
    onClick: () => onSortChange("gap_negative"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4ade80" }}>
          Adoption Insights
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
          Computed from live data
        </span>
      </div>
      <div className="flex gap-3 pb-2" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
        {insights.map((ins, i) => {
          const inner = (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-lg leading-none">{ins.icon}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#4ade80" }}>
                  {ins.category}
                </span>
              </div>
              <p className="text-sm font-semibold mt-1 leading-snug" style={{ color: "var(--text-1)" }}>
                {ins.text}
              </p>
              <p className="text-[10px] mt-2" style={{ color: "var(--text-3)" }}>Explore →</p>
            </>
          );

          const baseStyle: React.CSSProperties = {
            minWidth: "240px",
            borderRadius: "0.75rem",
            padding: "1rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid #22c55e",
            cursor: "pointer",
            flexShrink: 0,
            textDecoration: "none",
            display: "block",
          };

          if (ins.href) {
            return (
              <Link key={i} href={ins.href} style={baseStyle}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#22c55e")}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.borderLeftColor = "#22c55e"; }}
              >{inner}</Link>
            );
          }
          return (
            <div key={i} style={baseStyle} onClick={ins.onClick}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#22c55e")}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.borderLeftColor = "#22c55e"; }}
            >{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
