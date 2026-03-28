"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import CountryCard from "@/components/CountryCard";
import SkeletonCard from "@/components/SkeletonCard";
import FilterBar, { Region, SortKey } from "@/components/FilterBar";
import staticData from "@/data/countries.json";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";

export default function Home() {
  const [search, setSearch]     = useState("");
  const [region, setRegion]     = useState<Region>("All");
  const [sort, setSort]         = useState<SortKey>("total_score");
  const [countries, setCountries] = useState<ScoredCountry[]>(() =>
    staticData.countries.map((c) => ({ ...c, data_source: "fallback" as const }))
  );
  const [loading, setLoading]         = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [usingLive, setUsingLive]     = useState(false);
  const [staleWarn, setStaleWarn]     = useState(false);

  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then((data: ScoresResponse) => {
        setCountries(data.countries);
        setLastUpdated(data.last_updated);
        setUsingLive(data.using_live_data);
        const sevenDays = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(data.last_updated).getTime() < sevenDays) setStaleWarn(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    countries
      .filter((c) => {
        const ms = c.name.toLowerCase().includes(search.toLowerCase());
        const mr = region === "All" || c.region === region;
        return ms && mr;
      })
      .sort((a, b) => b[sort] - a[sort]),
    [countries, search, region, sort]
  );

  const ranked    = useMemo(() => [...countries].sort((a, b) => b.total_score - a.total_score), [countries]);
  const getRank   = (slug: string) => ranked.findIndex((c) => c.slug === slug) + 1;
  const avgScore  = Math.round(countries.reduce((s, c) => s + c.total_score, 0) / countries.length);
  const topCountry = ranked[0];

  const fmtDate = lastUpdated
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastUpdated))
    : null;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Page glow */}
      <div className="page-glow" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.92)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-black tracking-tight font-display" style={{ color: "var(--text-1)" }}>
              AI Trajectory Index
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
              {countries.length} countries · 5 dimensions · live data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/map" className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </Link>
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                Built by{" "}
                <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors" style={{ color: "var(--accent)" }}>
                  Ankit Mishra
                </a>
              </p>
              {fmtDate && (
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                  {usingLive ? (
                    <span className="flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Live · {fmtDate}
                    </span>
                  ) : (
                    <span style={{ color: "var(--amber)" }}>Cached · {fmtDate}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Stale warning */}
        {staleWarn && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2 fade-up"
            style={{ background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.25)", color: "var(--amber)" }}>
            <span>⚠</span>
            <span>Data may be outdated — live World Bank feed unavailable. Showing cached scores.</span>
          </div>
        )}
        {!loading && !usingLive && !staleWarn && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2 fade-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
            <span>ℹ</span>
            <span>Showing baseline scores — World Bank live data temporarily unavailable.</span>
          </div>
        )}

        {/* Hero */}
        <div className="relative card shine-on-hover rounded-3xl px-6 py-14 mb-12 text-center overflow-hidden">
          {/* top edge accent */}
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,.4), transparent)" }} />
          {/* inner glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(59,130,246,.08) 0%, transparent 70%)" }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-semibold fade-up"
              style={{ background: "rgba(59,130,246,.10)", border: "1px solid rgba(59,130,246,.22)", color: "var(--accent)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Phase 3 · AI Narratives + Live World Bank Data
            </div>

            <h2 className="text-4xl sm:text-5xl font-black tracking-tight font-display mb-4 fade-up-1"
              style={{ color: "var(--text-1)" }}>
              Where is every nation in the{" "}
              <span className="gradient-text">AI race?</span>
            </h2>

            <p className="text-base max-w-xl mx-auto mb-10 leading-relaxed fade-up-2"
              style={{ color: "var(--text-2)" }}>
              Five dimensions. Real data. Forward trajectories. Understand which countries are
              accelerating, which are plateauing, and why.
            </p>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto fade-up-3">
              {[
                { value: String(countries.length), label: "Countries Scored" },
                { value: "5",                      label: "Dimensions"        },
                { value: `${avgScore}/100`,         label: "Avg Score"         },
                { value: topCountry ? `${topCountry.flag} ${topCountry.name.split(" ")[0]}` : "—", label: "Top Ranked" },
              ].map((s, i) => (
                <div key={s.label} className={`rounded-2xl p-4 text-center fade-up-${i + 1}`}
                  style={{ background: "rgba(6,11,20,.6)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}>
                  <div className="text-2xl font-black mb-1" style={{ color: "var(--accent)" }}>{s.value}</div>
                  <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          search={search} region={region} sort={sort}
          onSearch={setSearch} onRegion={setRegion} onSort={setSort}
          total={countries.length} filtered={filtered.length}
        />

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 fade-up">
            <p className="text-4xl mb-4">🌐</p>
            <p className="text-lg font-semibold" style={{ color: "var(--text-2)" }}>No countries found</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-3)" }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((country) => (
              <CountryCard key={country.slug} country={country} rank={getRank(country.slug)} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 text-center space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Data: World Bank API · OECD AI Policy Observatory · Scores updated daily.
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            AI Trajectory Index · Built by{" "}
            <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors" style={{ color: "var(--text-3)" }}>
              Ankit Mishra
            </a>
            {" "}— Commercial Portfolio Director at Holocene · Forbes contributor
          </p>
        </footer>
      </div>
    </main>
  );
}
