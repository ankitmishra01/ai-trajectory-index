"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import CountryCard from "@/components/CountryCard";
import SkeletonCard from "@/components/SkeletonCard";
import RankingsTable from "@/components/RankingsTable";
import FilterBar, { Region, SortKey, TierFilter, TrajectoryFilter } from "@/components/FilterBar";
import ExportButton from "@/components/ExportButton";
import ComparisonPanel from "@/components/ComparisonPanel";
import staticData from "@/data/countries.json";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";

type ViewMode = "grid" | "table";

function scoreBandLabel(score: number): TierFilter {
  if (score >= 80) return "Leading";
  if (score >= 60) return "Advanced";
  if (score >= 40) return "Developing";
  return "Nascent";
}

function regionalAvg(countries: ScoredCountry[], region: string) {
  const rc = countries.filter((c) => c.region === region);
  if (!rc.length) return 0;
  return Math.round(rc.reduce((s, c) => s + c.total_score, 0) / rc.length);
}
const REGIONS_DISPLAY = ["Americas", "Europe", "Asia-Pacific", "Middle East & Africa"] as const;

export default function Home() {
  const [search, setSearch]               = useState("");
  const [region, setRegion]               = useState<Region>("All");
  const [sort, setSort]                   = useState<SortKey>("total_score");
  const [tier, setTier]                   = useState<TierFilter>("All");
  const [trajectoryFilter, setTrajectory] = useState<TrajectoryFilter>("All");
  const [view, setView]                   = useState<ViewMode>("grid");
  const [compareList, setCompareList]     = useState<string[]>([]);

  const [countries, setCountries] = useState<ScoredCountry[]>(() =>
    staticData.countries.map((c) => ({ ...c, data_source: "fallback" as const }))
  );
  const [loading, setLoading]         = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [usingLive, setUsingLive]     = useState(false);
  const [staleWarn, setStaleWarn]     = useState(false);
  const [compareToast, setCompareToast] = useState(false);

  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then((data: ScoresResponse) => {
        setCountries(data.countries);
        setLastUpdated(data.last_updated);
        setUsingLive(data.using_live_data);
        if (new Date(data.last_updated).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000)
          setStaleWarn(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCompare = useCallback((slug: string) => {
    setCompareList((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) {
        setCompareToast(true);
        setTimeout(() => setCompareToast(false), 2500);
        return prev;
      }
      return [...prev, slug];
    });
  }, []);

  const ranked = useMemo(
    () => [...countries].sort((a, b) => b.total_score - a.total_score),
    [countries]
  );

  const globalRanks = useMemo(
    () => Object.fromEntries(ranked.map((c, i) => [c.slug, i + 1])),
    [ranked]
  );

  const filtered = useMemo(() =>
    countries
      .filter((c) => {
        const ms  = c.name.toLowerCase().includes(search.toLowerCase());
        const mr  = region === "All" || c.region === region;
        const mt  = tier === "All" || scoreBandLabel(c.total_score) === tier;
        const mtr = trajectoryFilter === "All" || c.trajectory_label === trajectoryFilter;
        return ms && mr && mt && mtr;
      })
      .sort((a, b) => {
        if (sort === "alphabetical")    return a.name.localeCompare(b.name);
        if (sort === "trajectory_gain") return (b.projected_score_2028 - b.total_score) - (a.projected_score_2028 - a.total_score);
        return (b[sort] as number) - (a[sort] as number);
      }),
    [countries, search, region, sort, tier, trajectoryFilter]
  );

  const topCountry     = ranked[0];
  const avgScore       = Math.round(countries.reduce((s, c) => s + c.total_score, 0) / (countries.length || 1));
  const topTrajCountry = [...countries].sort((a, b) => (b.projected_score_2028 - b.total_score) - (a.projected_score_2028 - a.total_score))[0];

  const fmtDate = lastUpdated
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastUpdated))
    : null;

  const compareCountries = useMemo(
    () => compareList.map((slug) => countries.find((c) => c.slug === slug)).filter(Boolean) as ScoredCountry[],
    [compareList, countries]
  );

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="page-glow" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.96)" }}>

        {/* Row 1: branding + utilities */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-black tracking-tight font-display leading-none" style={{ color: "var(--text-1)" }}>
                AI Trajectory Index
              </h1>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
                {countries.length} economies · 5 pillars · {new Date().getFullYear()} edition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {fmtDate && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-3)" }}>
                {usingLive
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" /><span>Live · {fmtDate}</span></>
                  : <span>Cached · {fmtDate}</span>}
              </div>
            )}
            <div className="hidden sm:block h-4 w-px" style={{ background: "var(--border)" }} />
            <Link href="/methodology" className="hidden sm:block text-[11px] transition-colors hover:text-blue-400" style={{ color: "var(--text-3)" }}>
              Methodology
            </Link>
            <Link href="/map" className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="hidden sm:inline">Map</span>
            </Link>
            <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer"
              className="hidden sm:block text-[11px] font-medium transition-colors hover:text-blue-400" style={{ color: "var(--accent)" }}>
              Ankit Mishra
            </a>
          </div>
        </div>

        {/* Row 2: continent nav strip */}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-0 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}>
            {[
              { href: "/americas",    emoji: "🌎", label: "Americas" },
              { href: "/europe",      emoji: "🌍", label: "Europe" },
              { href: "/africa",      emoji: "🌍", label: "Africa" },
              { href: "/middle-east", emoji: "🕌", label: "Middle East" },
              { href: "/asia-pacific",emoji: "🌏", label: "Asia-Pacific" },
            ].map(({ href, emoji, label }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors hover:text-blue-400"
                style={{ color: "var(--text-2)", borderBottom: "2px solid transparent" }}>
                <span>{emoji}</span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {staleWarn && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2 fade-up"
            style={{ background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.22)", color: "var(--amber)" }}>
            ⚠ Data may be outdated — live World Bank feed unavailable. Showing cached scores.
          </div>
        )}

        {/* ── Hero ── */}
        <div className="relative card shine-on-hover rounded-3xl overflow-hidden mb-8">
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,.35), transparent)" }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(59,130,246,.08) 0%, transparent 70%)" }} />

          <div className="relative px-6 sm:px-12 pt-12 pb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 fade-up"
              style={{ color: "rgba(96,165,250,.7)" }}>
              Global AI Competitiveness Report · {new Date().getFullYear()}
            </p>
            <h2 className="font-serif-display text-4xl sm:text-5xl mb-3 fade-up-1 leading-tight"
              style={{ color: "var(--text-1)" }}>
              Where is every nation in the{" "}
              <em className="not-italic gradient-text">AI race?</em>
            </h2>
            <p className="text-base max-w-2xl mb-8 leading-relaxed fade-up-2" style={{ color: "var(--text-2)" }}>
              Scoring {countries.length} economies across five pillars — Infrastructure, Talent,
              Governance, Investment and Economic Readiness — with live World Bank data and
              AI-generated country analysis.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up-3">
              {[
                { label: "Global Leader",      value: topCountry ? `${topCountry.flag} ${topCountry.name}` : "—", sub: topCountry ? `${topCountry.total_score}/100` : "" },
                { label: "Global Average",     value: `${avgScore}`, sub: "out of 100" },
                { label: "Fastest Rising",     value: topTrajCountry ? `${topTrajCountry.flag} ${topTrajCountry.name.split(" ")[0]}` : "—", sub: topTrajCountry ? `+${topTrajCountry.projected_score_2028 - topTrajCountry.total_score} pts by 2028` : "" },
                { label: "Economies Scored",   value: `${countries.length}`, sub: "4 regions" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4"
                  style={{ background: "rgba(6,11,20,.55)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
                    {s.label}
                  </p>
                  <p className="text-lg font-black leading-none mb-1" style={{ color: "var(--accent)" }}>
                    {s.value}
                  </p>
                  {s.sub && <p className="text-xs" style={{ color: "var(--text-3)" }}>{s.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 sm:px-12 py-4 flex flex-wrap gap-6"
            style={{ borderTop: "1px solid var(--border)", background: "rgba(6,11,20,.4)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest self-center" style={{ color: "var(--text-3)" }}>
              Regional averages
            </p>
            {REGIONS_DISPLAY.map((r) => {
              const a = regionalAvg(countries, r);
              return (
                <div key={r} className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>{r}</span>
                  <span className="text-xs font-bold" style={{ color: "var(--text-2)" }}>{a}/100</span>
                  <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "var(--raised)" }}>
                    <div className="h-full rounded-full" style={{ width: `${a}%`, background: "var(--accent)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Filters + controls ── */}
        <div className="flex flex-col gap-3 mb-6">
          <FilterBar
            search={search} region={region} sort={sort} tier={tier} trajectoryFilter={trajectoryFilter}
            onSearch={setSearch} onRegion={setRegion} onSort={setSort} onTier={setTier} onTrajectoryFilter={setTrajectory}
            total={countries.length} filtered={filtered.length}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: "var(--text-3)" }}>View as</span>
            {(["grid", "table"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={view === v
                  ? { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }
                  : { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)" }
                }
              >
                {v === "grid" ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
                    <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                    <line x1="1" y1="4"  x2="15" y2="4"  strokeWidth="1.5" />
                    <line x1="1" y1="8"  x2="15" y2="8"  strokeWidth="1.5" />
                    <line x1="1" y1="12" x2="15" y2="12" strokeWidth="1.5" />
                  </svg>
                )}
                {v === "grid" ? "Cards" : "Rankings Table"}
              </button>
            ))}
            {view === "table" && (
              <span className="text-[11px] ml-1 hidden sm:inline" style={{ color: "var(--text-3)" }}>
                Click any column header to sort
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {compareList.length > 0 && (
                <button
                  onClick={() => setCompareList([])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "rgba(59,130,246,.10)", color: "var(--accent)", border: "1px solid rgba(59,130,246,.22)" }}
                >
                  Comparing {compareList.length} · Clear
                </button>
              )}
              <ExportButton countries={filtered} globalRanks={globalRanks} />
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : view === "table" ? (
          <RankingsTable countries={filtered} globalRanks={globalRanks} activeRegion={region} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 fade-up">
            <p className="text-4xl mb-4">🌐</p>
            <p className="text-lg font-semibold" style={{ color: "var(--text-2)" }}>No countries found</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-3)" }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            style={{ paddingBottom: compareList.length >= 2 ? "340px" : undefined }}>
            {filtered.map((c) => (
              <CountryCard
                key={c.slug}
                country={c}
                rank={globalRanks[c.slug] ?? 0}
                isComparing={compareList.includes(c.slug)}
                onCompareToggle={toggleCompare}
              />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-16 pt-8 text-center space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Data sourced from World Bank Open Data API · OECD AI Policy Observatory · Scores updated daily.
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            AI Trajectory Index · Built by{" "}
            <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors">Ankit Mishra</a>
            {" "}— Commercial Portfolio Director at Holocene · Forbes contributor · SRI AI & Trust Working Group
          </p>
          <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
            <Link href="/americas" className="text-xs hover:text-blue-400 transition-colors" style={{ color: "var(--text-3)" }}>Americas</Link>
            <Link href="/europe" className="text-xs hover:text-blue-400 transition-colors" style={{ color: "var(--text-3)" }}>Europe</Link>
            <Link href="/africa" className="text-xs hover:text-blue-400 transition-colors" style={{ color: "var(--text-3)" }}>Africa</Link>
            <Link href="/middle-east" className="text-xs hover:text-blue-400 transition-colors" style={{ color: "var(--text-3)" }}>Middle East</Link>
            <Link href="/asia-pacific" className="text-xs hover:text-blue-400 transition-colors" style={{ color: "var(--text-3)" }}>Asia-Pacific</Link>
            <Link href="/methodology" className="text-xs hover:text-blue-400 transition-colors" style={{ color: "var(--text-3)" }}>Methodology</Link>
            <Link href="/map" className="text-xs hover:text-blue-400 transition-colors" style={{ color: "var(--text-3)" }}>Map View</Link>
          </div>
        </footer>
      </div>

      {/* ── Comparison Panel ── */}
      <ComparisonPanel
        selected={compareCountries}
        onRemove={(slug) => setCompareList((p) => p.filter((s) => s !== slug))}
        onClear={() => setCompareList([])}
      />

      {/* ── Max compare toast ── */}
      {compareToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-sm font-semibold pointer-events-none"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)", boxShadow: "0 4px 20px rgba(0,0,0,.6)" }}
        >
          Max 3 countries in comparison
        </div>
      )}
    </main>
  );
}
