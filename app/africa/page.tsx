"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import staticData from "@/data/countries.json";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";

// ── African country slugs → sub-region ──────────────────────────────────────
const AFRICA_SUBREGIONS: Record<string, string> = {
  // North Africa
  egypt: "North Africa", morocco: "North Africa", tunisia: "North Africa",
  algeria: "North Africa", libya: "North Africa", sudan: "North Africa",
  // East Africa
  kenya: "East Africa", ethiopia: "East Africa", tanzania: "East Africa",
  uganda: "East Africa", rwanda: "East Africa", mozambique: "East Africa",
  madagascar: "East Africa", somalia: "East Africa", eritrea: "East Africa",
  djibouti: "East Africa", malawi: "East Africa", zambia: "East Africa",
  comoros: "East Africa", burundi: "East Africa",
  // West Africa
  nigeria: "West Africa", ghana: "West Africa", senegal: "West Africa",
  "ivory-coast": "West Africa", cameroon: "West Africa", mali: "West Africa",
  "burkina-faso": "West Africa", guinea: "West Africa", benin: "West Africa",
  togo: "West Africa", "sierra-leone": "West Africa", liberia: "West Africa",
  mauritania: "West Africa", niger: "West Africa", chad: "West Africa",
  gambia: "West Africa", "guinea-bissau": "West Africa", "cape-verde": "West Africa",
  // Southern Africa
  "south-africa": "Southern Africa", zimbabwe: "Southern Africa",
  angola: "Southern Africa", namibia: "Southern Africa",
  botswana: "Southern Africa", eswatini: "Southern Africa",
  lesotho: "Southern Africa", mauritius: "Southern Africa",
  seychelles: "Southern Africa",
  // Central Africa
  "democratic-republic-of-the-congo": "Central Africa",
  "republic-of-the-congo": "Central Africa",
  "central-african-republic": "Central Africa",
  gabon: "Central Africa", "equatorial-guinea": "Central Africa",
  "sao-tome-and-principe": "Central Africa",
};

const SUB_REGIONS_ORDER = ["North Africa", "East Africa", "West Africa", "Southern Africa", "Central Africa"];
const SUB_REGION_COLORS: Record<string, string> = {
  "North Africa":   "#f59e0b",
  "East Africa":    "#22c55e",
  "West Africa":    "#3b82f6",
  "Southern Africa":"#8b5cf6",
  "Central Africa": "#06b6d4",
};

const PILLARS = [
  { key: "infrastructure",    label: "Infrastructure",    color: "#3b82f6" },
  { key: "talent",            label: "Talent",            color: "#8b5cf6" },
  { key: "governance",        label: "Governance",        color: "#06b6d4" },
  { key: "investment",        label: "Investment",        color: "#f59e0b" },
  { key: "economic_readiness",label: "Econ. Readiness",   color: "#22c55e" },
] as const;

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function scoreBand(score: number) {
  if (score >= 80) return { label: "Leading",    color: "#4ade80" };
  if (score >= 60) return { label: "Advanced",   color: "#93c5fd" };
  if (score >= 40) return { label: "Developing", color: "#fcd34d" };
  return                   { label: "Nascent",   color: "#fca5a5" };
}

export default function AfricaPage() {
  const [countries, setCountries] = useState<ScoredCountry[]>(() =>
    staticData.countries.map((c) => ({ ...c, data_source: "fallback" as const }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then((d: ScoresResponse) => setCountries(d.countries))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const african = useMemo(
    () => countries.filter((c) => AFRICA_SUBREGIONS[c.slug] !== undefined),
    [countries]
  );

  const globalAvgByPillar = useMemo(() => {
    return Object.fromEntries(
      PILLARS.map((p) => [
        p.key,
        avg(countries.map((c) => c.scores[p.key].score)),
      ])
    );
  }, [countries]);

  const africaAvgByPillar = useMemo(() => {
    return Object.fromEntries(
      PILLARS.map((p) => [
        p.key,
        avg(african.map((c) => c.scores[p.key].score)),
      ])
    );
  }, [african]);

  const bySubRegion = useMemo(() => {
    const map: Record<string, ScoredCountry[]> = {};
    african.forEach((c) => {
      const sr = AFRICA_SUBREGIONS[c.slug];
      if (!map[sr]) map[sr] = [];
      map[sr].push(c);
    });
    return map;
  }, [african]);

  const subRegionAverages = useMemo(() =>
    SUB_REGIONS_ORDER
      .filter((sr) => bySubRegion[sr]?.length)
      .map((sr) => ({
        name: sr,
        avg: avg(bySubRegion[sr].map((c) => c.total_score)),
        count: bySubRegion[sr].length,
        color: SUB_REGION_COLORS[sr],
      })),
    [bySubRegion]
  );

  const fastestMovers = useMemo(() =>
    [...african]
      .sort((a, b) => (b.projected_score_2028 - b.total_score) - (a.projected_score_2028 - a.total_score))
      .slice(0, 10),
    [african]
  );

  const opportunities = useMemo(() =>
    african.filter(
      (c) => c.total_score < 60 && c.total_score >= 20 && // Developing or better but not Leading/Advanced
             (c.trajectory_label === "Strong Positive" || c.trajectory_label === "Positive")
    ).sort((a, b) => (b.projected_score_2028 - b.total_score) - (a.projected_score_2028 - a.total_score)),
    [african]
  );

  const gapData = PILLARS.map((p) => ({
    name: p.label,
    Africa: africaAvgByPillar[p.key],
    Global: globalAvgByPillar[p.key],
    color: p.color,
  }));

  if (!loading && african.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-3)" }}>No African country data found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="page-glow" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.94)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: "var(--text-3)" }}>
            ← Index
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <h1 className="text-sm font-black font-display" style={{ color: "var(--text-1)" }}>
            Africa AI Deep-Dive
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold ml-2"
            style={{ background: "rgba(34,197,94,.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,.22)" }}>
            {african.length} economies
          </span>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="card shine-on-hover rounded-3xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,.4), transparent)" }} />
          <div className="px-6 sm:px-10 pt-10 pb-6 relative">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(74,222,128,.7)" }}>
              Investment Intelligence · Africa Focus
            </p>
            <h2 className="font-serif-display text-4xl sm:text-5xl mb-3 leading-tight" style={{ color: "var(--text-1)" }}>
              The AI opportunity in <em className="not-italic" style={{ color: "#4ade80" }}>Africa</em>
            </h2>
            <p className="text-base max-w-2xl leading-relaxed" style={{ color: "var(--text-2)" }}>
              {african.length} economies across 5 sub-regions. Tracking the continent&apos;s fastest-moving AI markets —
              where infrastructure investment, policy momentum, and a young talent base are converging.
            </p>
          </div>

          {/* Sub-region strip */}
          <div className="px-6 sm:px-10 py-4 flex flex-wrap gap-6"
            style={{ borderTop: "1px solid var(--border)", background: "rgba(6,11,20,.4)" }}>
            {subRegionAverages.map((sr) => (
              <div key={sr.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sr.color }} />
                <span className="text-xs" style={{ color: "var(--text-3)" }}>{sr.name}</span>
                <span className="text-xs font-bold" style={{ color: sr.color }}>{sr.avg}/100</span>
                <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "var(--raised)" }}>
                  <div className="h-full rounded-full" style={{ width: `${sr.avg}%`, background: sr.color }} />
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-3)" }}>({sr.count})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Fastest Movers */}
          <div className="card rounded-2xl overflow-hidden">
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Fastest Rising — Africa
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                Ranked by projected score gain to 2028
              </p>
            </div>
            <div>
              {fastestMovers.map((c, i) => {
                const gain = c.projected_score_2028 - c.total_score;
                const sr   = AFRICA_SUBREGIONS[c.slug] ?? "";
                return (
                  <Link key={c.slug} href={`/country/${c.slug}`}
                    className="flex items-center gap-3 px-5 py-3 group transition-colors"
                    style={{ borderBottom: i < fastestMovers.length - 1 ? "1px solid var(--border)" : undefined }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--raised)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="text-xs w-5 text-center font-bold" style={{ color: "var(--text-3)" }}>{i + 1}</span>
                    <span className="text-xl flex-shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{c.name}</p>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: `${SUB_REGION_COLORS[sr]}18`, color: SUB_REGION_COLORS[sr], border: `1px solid ${SUB_REGION_COLORS[sr]}33` }}>
                          {sr}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
                        {c.total_score}/100 · {c.trajectory_label}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-black" style={{ color: gain > 0 ? "#4ade80" : "#f87171" }}>
                        +{gain} pts
                      </span>
                      <p className="text-[10px]" style={{ color: "var(--text-3)" }}>→ {c.projected_score_2028}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pillar Gap Analysis */}
          <div className="card rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
              Africa vs. Global — Pillar Gap
            </h3>
            <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
              Average pillar scores (0–20) — Africa &amp; Global benchmark
            </p>
            {loading ? (
              <div className="h-48 skeleton rounded-xl" />
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gapData}
                    layout="vertical"
                    margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
                    barGap={2}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid horizontal={false} stroke="rgba(59,130,246,.08)" />
                    <XAxis type="number" domain={[0, 20]} tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={96} tick={{ fill: "var(--text-2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                      cursor={{ fill: "rgba(59,130,246,.05)" }}
                    />
                    <Bar dataKey="Africa" radius={[0, 3, 3, 0]} name="Africa avg">
                      {gapData.map((d) => (
                        <Cell key={d.name} fill={d.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                    <Bar dataKey="Global" radius={[0, 3, 3, 0]} fill="rgba(148,163,184,.25)" name="Global avg" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-[10px] mt-3 text-center" style={{ color: "var(--text-3)" }}>
              Darker bars = Africa average · Grey bars = Global average
            </p>
          </div>
        </div>

        {/* Investment Opportunities */}
        {opportunities.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h3 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                High-Momentum Markets
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(34,197,94,.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,.22)" }}>
                Developing + Positive trajectory
              </span>
              <p className="text-xs ml-auto" style={{ color: "var(--text-3)" }}>
                {opportunities.length} countries meet the criteria
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {opportunities.map((c) => {
                const gain = c.projected_score_2028 - c.total_score;
                const band = scoreBand(c.total_score);
                const sr   = AFRICA_SUBREGIONS[c.slug] ?? "";
                return (
                  <Link key={c.slug} href={`/country/${c.slug}`}
                    className="rounded-2xl p-4 group transition-all duration-200 block"
                    style={{
                      background: "rgba(34,197,94,.04)",
                      border: "1px solid rgba(34,197,94,.18)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,.35)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(34,197,94,.12)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,.18)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{c.name}</p>
                        <p className="text-[10px]" style={{ color: "rgba(74,222,128,.6)" }}>{sr}</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-black" style={{ color: band.color }}>{c.total_score}</span>
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--text-2)" }}>{c.trajectory_label}</span>
                      <span className="text-sm font-bold" style={{ color: "#4ade80" }}>+{gain} pts →</span>
                    </div>
                    <div className="mt-3 grid grid-cols-5 gap-0.5">
                      {PILLARS.map((p) => (
                        <div key={p.key} title={`${p.label}: ${c.scores[p.key].score}/20`}
                          className="h-1.5 rounded-full"
                          style={{ background: `${p.color}${Math.round((c.scores[p.key].score / 20) * 255).toString(16).padStart(2, "0")}` }} />
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub-regional breakdown table */}
        <div className="card rounded-2xl overflow-hidden">
          <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Sub-Regional Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="rankings-table">
              <thead>
                <tr>
                  <th className="pl-5">Sub-Region</th>
                  <th className="text-center">Countries</th>
                  <th className="text-center">Avg Score</th>
                  {PILLARS.map((p) => (
                    <th key={p.key} className="text-center" style={{ minWidth: 72 }}>{p.label.split(".")[0]}</th>
                  ))}
                  <th className="pr-5">Top Country</th>
                </tr>
              </thead>
              <tbody>
                {subRegionAverages.map((sr) => {
                  const srCountries = bySubRegion[sr.name] ?? [];
                  const top = [...srCountries].sort((a, b) => b.total_score - a.total_score)[0];
                  return (
                    <tr key={sr.name} className="group">
                      <td className="pl-5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sr.color }} />
                          <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{sr.name}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="text-sm" style={{ color: "var(--text-2)" }}>{sr.count}</span>
                      </td>
                      <td className="text-center">
                        <span className="text-sm font-bold" style={{ color: sr.color }}>{sr.avg}</span>
                      </td>
                      {PILLARS.map((p) => {
                        const pillarAvg = avg(srCountries.map((c) => c.scores[p.key].score));
                        return (
                          <td key={p.key} className="text-center">
                            <span className="text-sm" style={{ color: p.color }}>{pillarAvg}</span>
                          </td>
                        );
                      })}
                      <td className="pr-5">
                        {top && (
                          <Link href={`/country/${top.slug}`}
                            className="flex items-center gap-1.5 text-xs transition-colors hover:text-blue-300"
                            style={{ color: "var(--text-2)" }}>
                            <span>{top.flag}</span>
                            <span>{top.name}</span>
                            <span className="font-bold" style={{ color: "var(--accent)" }}>{top.total_score}</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 mt-4 text-center space-y-1"
        style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Data: World Bank API · OECD AI Policy Observatory · Scores updated daily.
        </p>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          AI Trajectory Index · Built by{" "}
          <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors">Ankit Mishra</a>
        </p>
      </footer>
    </main>
  );
}
