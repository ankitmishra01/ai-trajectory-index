"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import staticData from "@/data/countries.json";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";
import type { RegionConfig } from "@/lib/regionConfigs";

const PILLARS = [
  { key: "infrastructure",    label: "Infrastructure",   short: "Infra",  color: "#3b82f6" },
  { key: "talent",            label: "Talent",           short: "Talent", color: "#8b5cf6" },
  { key: "governance",        label: "Governance",       short: "Gov",    color: "#06b6d4" },
  { key: "investment",        label: "Investment",       short: "Invest", color: "#f59e0b" },
  { key: "economic_readiness",label: "Econ. Readiness",  short: "Econ",   color: "#22c55e" },
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

interface Props {
  config: RegionConfig;
}

export default function RegionDeepDive({ config }: Props) {
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

  // Filter to this region's countries
  const regional = useMemo(() =>
    countries.filter((c) => {
      const inRegion = config.dataRegions.includes(c.region);
      const inAllowlist = config.slugAllowlist ? config.slugAllowlist.has(c.slug) : true;
      return inRegion && inAllowlist;
    }),
    [countries, config]
  );

  const globalAvgByPillar = useMemo(() =>
    Object.fromEntries(PILLARS.map((p) => [p.key, avg(countries.map((c) => c.scores[p.key].score))])),
    [countries]
  );

  const regionAvgByPillar = useMemo(() =>
    Object.fromEntries(PILLARS.map((p) => [p.key, avg(regional.map((c) => c.scores[p.key].score))])),
    [regional]
  );

  const bySubRegion = useMemo(() => {
    const map: Record<string, ScoredCountry[]> = {};
    regional.forEach((c) => {
      const sr = config.subregions[c.slug];
      if (!sr) return;
      if (!map[sr]) map[sr] = [];
      map[sr].push(c);
    });
    return map;
  }, [regional, config]);

  const subRegionAverages = useMemo(() =>
    config.subregionOrder
      .filter((sr) => bySubRegion[sr]?.length)
      .map((sr) => ({
        name: sr,
        avg: avg(bySubRegion[sr].map((c) => c.total_score)),
        count: bySubRegion[sr].length,
        color: config.subregionColors[sr] ?? "#3b82f6",
      })),
    [bySubRegion, config]
  );

  const fastestMovers = useMemo(() =>
    [...regional]
      .sort((a, b) => (b.projected_score_2028 - b.total_score) - (a.projected_score_2028 - a.total_score))
      .slice(0, 10),
    [regional]
  );

  const opportunities = useMemo(() =>
    regional
      .filter((c) =>
        c.total_score <= config.opportunityMaxScore &&
        c.total_score >= 15 &&
        (c.trajectory_label === "Strong Positive" || c.trajectory_label === "Positive")
      )
      .sort((a, b) => (b.projected_score_2028 - b.total_score) - (a.projected_score_2028 - a.total_score)),
    [regional, config]
  );

  const gapData = PILLARS.map((p) => ({
    name: p.short,
    fullName: p.label,
    Region: regionAvgByPillar[p.key] ?? 0,
    Global: globalAvgByPillar[p.key] ?? 0,
    color: p.color,
  }));

  const regionAvgTotal = avg(regional.map((c) => c.total_score));
  const globalAvgTotal = avg(countries.map((c) => c.total_score));

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="page-glow" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.94)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3 flex-wrap">
          <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: "var(--text-3)" }}>
            ← Index
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <h1 className="text-sm font-black font-display" style={{ color: "var(--text-1)" }}>
            {config.emoji} {config.name} AI Deep-Dive
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `rgba(${config.accentRgb},.10)`, color: config.accentColor, border: `1px solid rgba(${config.accentRgb},.22)` }}>
            {regional.length} economies
          </span>
          {/* Other region nav */}
          <div className="ml-auto flex items-center gap-1.5 flex-wrap">
            {[
              { href: "/americas",     label: "🌎 Americas"     },
              { href: "/europe",       label: "🌍 Europe"       },
              { href: "/asia-pacific", label: "🌏 Asia-Pacific" },
              { href: "/middle-east",  label: "🕌 Middle East"  },
              { href: "/africa",       label: "🌍 Africa"       },
            ]
              .filter((r) => r.href !== `/${config.id}`)
              .map((r) => (
                <Link key={r.href} href={r.href}
                  className="text-[10px] px-2 py-1 rounded-lg transition-colors hover:text-white"
                  style={{ color: "var(--text-3)", background: "var(--raised)", border: "1px solid var(--border)" }}>
                  {r.label}
                </Link>
              ))}
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero card */}
        <div className="card shine-on-hover rounded-3xl overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, rgba(${config.accentRgb},.4), transparent)` }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(${config.accentRgb},.07) 0%, transparent 70%)` }} />

          <div className="relative px-6 sm:px-10 pt-10 pb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: `rgba(${config.accentRgb},.7)` }}>
              AI Trajectory Index · Regional Intelligence
            </p>
            <h2 className="font-serif-display text-4xl sm:text-5xl mb-3 leading-tight"
              style={{ color: "var(--text-1)" }}>
              {config.tagline}
            </h2>
            <p className="text-base max-w-2xl leading-relaxed mb-6" style={{ color: "var(--text-2)" }}>
              {config.description}
            </p>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Economies",         value: String(regional.length),                         sub: `in ${config.subregionOrder.filter(sr => bySubRegion[sr]?.length).length} sub-regions` },
                { label: "Regional Average",  value: String(regionAvgTotal),                          sub: `Global avg: ${globalAvgTotal}` },
                { label: "Fastest Rising",    value: fastestMovers[0] ? `${fastestMovers[0].flag} ${fastestMovers[0].name.split(" ")[0]}` : "—", sub: fastestMovers[0] ? `+${fastestMovers[0].projected_score_2028 - fastestMovers[0].total_score} pts by 2028` : "" },
                { label: "Top Score",         value: regional.length ? `${[...regional].sort((a,b)=>b.total_score-a.total_score)[0].flag} ${[...regional].sort((a,b)=>b.total_score-a.total_score)[0].total_score}` : "—", sub: regional.length ? [...regional].sort((a,b)=>b.total_score-a.total_score)[0].name : "" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4"
                  style={{ background: "rgba(6,11,20,.55)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>{s.label}</p>
                  <p className="text-lg font-black leading-tight mb-0.5" style={{ color: config.accentColor }}>{s.value}</p>
                  {s.sub && <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{s.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Sub-region averages strip */}
          <div className="px-6 sm:px-10 py-4 flex flex-wrap gap-5"
            style={{ borderTop: "1px solid var(--border)", background: "rgba(6,11,20,.4)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest self-center" style={{ color: "var(--text-3)" }}>
              Sub-regional averages
            </p>
            {subRegionAverages.map((sr) => (
              <div key={sr.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sr.color }} />
                <span className="text-xs" style={{ color: "var(--text-3)" }}>{sr.name}</span>
                <span className="text-xs font-bold" style={{ color: sr.color }}>{sr.avg}</span>
                <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "var(--raised)" }}>
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
                Fastest Rising — {config.name}
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                Ranked by projected score gain to 2028
              </p>
            </div>
            <div>
              {fastestMovers.map((c, i) => {
                const gain = c.projected_score_2028 - c.total_score;
                const sr   = config.subregions[c.slug] ?? "";
                const srColor = config.subregionColors[sr] ?? "#3b82f6";
                return (
                  <Link key={c.slug} href={`/country/${c.slug}`}
                    className="flex items-center gap-3 px-5 py-3 group transition-colors"
                    style={{ borderBottom: i < fastestMovers.length - 1 ? "1px solid var(--border)" : undefined }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--raised)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="text-xs w-5 text-center font-bold tabular-nums" style={{ color: "var(--text-3)" }}>{i + 1}</span>
                    <span className="text-xl flex-shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{c.name}</p>
                        {sr && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: `${srColor}18`, color: srColor, border: `1px solid ${srColor}33` }}>
                            {sr}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
                        {c.total_score}/100 · {c.trajectory_label}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-black" style={{ color: gain > 0 ? "#4ade80" : "#f87171" }}>
                        {gain > 0 ? "+" : ""}{gain} pts
                      </span>
                      <p className="text-[10px]" style={{ color: "var(--text-3)" }}>→ {c.projected_score_2028}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pillar Gap Chart */}
          <div className="card rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
              {config.name} vs. Global — Pillar Gap
            </h3>
            <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
              Average pillar scores (0–20) · {config.name} &amp; Global benchmark
            </p>
            {loading ? (
              <div className="h-56 skeleton rounded-xl" />
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gapData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                    barGap={3}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid horizontal={false} stroke="rgba(59,130,246,.07)" />
                    <XAxis type="number" domain={[0, 20]} tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={52} tick={{ fill: "var(--text-2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value, name) => [`${value}/20`, name]}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                      cursor={{ fill: "rgba(59,130,246,.05)" }}
                    />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                    <Bar dataKey="Region" name={config.name} radius={[0, 3, 3, 0]}>
                      {gapData.map((d) => (
                        <Cell key={d.name} fill={d.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                    <Bar dataKey="Global" name="Global avg" radius={[0, 3, 3, 0]} fill="rgba(148,163,184,.22)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Opportunity Markets */}
        {opportunities.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: config.accentColor }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                {config.opportunityLabel}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `rgba(${config.accentRgb},.10)`, color: config.accentColor, border: `1px solid rgba(${config.accentRgb},.22)` }}>
                Positive trajectory
              </span>
              <p className="text-xs ml-auto hidden sm:block" style={{ color: "var(--text-3)" }}>
                {opportunities.length} countries
              </p>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>{config.opportunityDescription}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {opportunities.map((c) => {
                const gain  = c.projected_score_2028 - c.total_score;
                const band  = scoreBand(c.total_score);
                const sr    = config.subregions[c.slug] ?? "";
                const srColor = config.subregionColors[sr] ?? config.accentColor;
                return (
                  <Link key={c.slug} href={`/country/${c.slug}`}
                    className="rounded-2xl p-4 block transition-all duration-200"
                    style={{ background: `rgba(${config.accentRgb},.04)`, border: `1px solid rgba(${config.accentRgb},.18)` }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `rgba(${config.accentRgb},.35)`;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px rgba(${config.accentRgb},.12)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `rgba(${config.accentRgb},.18)`;
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{c.name}</p>
                        {sr && <p className="text-[10px]" style={{ color: srColor }}>{sr}</p>}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-black" style={{ color: band.color }}>{c.total_score}</span>
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>/100</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs" style={{ color: "var(--text-2)" }}>{c.trajectory_label}</span>
                      <span className="text-sm font-bold" style={{ color: "#4ade80" }}>+{gain} pts →</span>
                    </div>
                    <div className="grid grid-cols-5 gap-0.5">
                      {PILLARS.map((p) => {
                        const s = c.scores[p.key].score;
                        const opacity = Math.round((s / 20) * 200 + 55).toString(16).padStart(2, "0");
                        return (
                          <div key={p.key} title={`${p.label}: ${s}/20`}
                            className="h-1.5 rounded-full"
                            style={{ background: `${p.color}${opacity}` }} />
                        );
                      })}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Full country table by sub-region */}
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
                    <th key={p.key} className="text-center" style={{ minWidth: 68 }}>{p.short}</th>
                  ))}
                  <th className="pr-5">Leader</th>
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
                        const pa = avg(srCountries.map((c) => c.scores[p.key].score));
                        return (
                          <td key={p.key} className="text-center">
                            <span className="text-sm" style={{ color: p.color }}>{pa}</span>
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

        {/* All countries grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
            All {config.name} Countries — Ranked by Score
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...regional]
              .sort((a, b) => b.total_score - a.total_score)
              .map((c, i) => {
                const band  = scoreBand(c.total_score);
                const delta = c.projected_score_2028 - c.total_score;
                const sr    = config.subregions[c.slug] ?? "";
                const srColor = config.subregionColors[sr] ?? config.accentColor;
                return (
                  <Link key={c.slug} href={`/country/${c.slug}`}
                    className="rounded-xl p-3 flex items-center gap-3 group transition-all duration-150"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,.25)";
                      (e.currentTarget as HTMLElement).style.background = "var(--raised)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                    }}
                  >
                    <span className="text-xs w-5 text-center font-bold tabular-nums flex-shrink-0"
                      style={{ color: "var(--text-3)" }}>{i + 1}</span>
                    <span className="text-2xl flex-shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{c.name}</p>
                      {sr && <p className="text-[10px]" style={{ color: srColor }}>{sr}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-black" style={{ color: band.color }}>{c.total_score}</p>
                      <p className="text-[10px]" style={{ color: delta >= 0 ? "#4ade80" : "#f87171" }}>
                        {delta > 0 ? "+" : ""}{delta}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>

      <footer className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 mt-4 text-center space-y-1"
        style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Data: World Bank API · OECD AI Policy Observatory · IMF AI Preparedness Index · Scores updated daily.
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
