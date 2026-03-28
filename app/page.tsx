"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import CountryCard from "@/components/CountryCard";
import SkeletonCard from "@/components/SkeletonCard";
import FilterBar, { Region, SortKey } from "@/components/FilterBar";
import staticData from "@/data/countries.json";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";

export default function Home() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<Region>("All");
  const [sort, setSort] = useState<SortKey>("total_score");

  const [countries, setCountries] = useState<ScoredCountry[]>(() =>
    staticData.countries.map((c) => ({ ...c, data_source: "fallback" as const }))
  );
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [usingLiveData, setUsingLiveData] = useState(false);
  const [staleWarning, setStaleWarning] = useState(false);

  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then((data: ScoresResponse) => {
        setCountries(data.countries);
        setLastUpdated(data.last_updated);
        setUsingLiveData(data.using_live_data);
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(data.last_updated).getTime() < sevenDaysAgo) {
          setStaleWarning(true);
        }
      })
      .catch(() => {/* keep static fallback */})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return countries
      .filter((c) => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchRegion = region === "All" || c.region === region;
        return matchSearch && matchRegion;
      })
      .sort((a, b) => b[sort] - a[sort]);
  }, [countries, search, region, sort]);

  const rankedAll = useMemo(
    () => [...countries].sort((a, b) => b.total_score - a.total_score),
    [countries]
  );

  const getRank = (slug: string) =>
    rankedAll.findIndex((c) => c.slug === slug) + 1;

  const avgScore = Math.round(
    countries.reduce((s, c) => s + c.total_score, 0) / countries.length
  );
  const topCountry = rankedAll[0];

  const formattedDate = lastUpdated
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(lastUpdated))
    : null;

  return (
    <main className="min-h-screen bg-[#060b14]">
      {/* Sticky Header */}
      <header className="border-b border-[#1a2540] sticky top-0 z-50 bg-[#060b14]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-black text-white tracking-tight font-display">
                AI Trajectory Index
              </h1>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {countries.length} countries · 5 dimensions · live data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a2540] text-blue-400 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all border border-[#243360] hover:border-blue-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </Link>
            <div className="text-right">
              <p className="text-xs text-slate-500">
                Built by{" "}
                <a
                  href="https://ankitmishra.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400/80 hover:text-blue-300 transition-colors"
                >
                  Ankit Mishra
                </a>
              </p>
              {formattedDate && (
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {usingLiveData ? (
                    <span className="flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Live · {formattedDate}
                    </span>
                  ) : (
                    <span className="text-amber-500/60">Cached · {formattedDate}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Stale warning */}
        {staleWarning && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/25 text-amber-400 text-sm flex items-center gap-2">
            <span>⚠</span>
            <span>Data may be outdated — live World Bank feed unavailable. Showing cached scores.</span>
          </div>
        )}
        {!loading && !usingLiveData && !staleWarning && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-[#0c1322] border border-[#1a2540] text-slate-500 text-sm flex items-center gap-2">
            <span>ℹ</span>
            <span>Showing baseline scores — World Bank live data temporarily unavailable.</span>
          </div>
        )}

        {/* Hero */}
        <div className="relative mb-12 text-center overflow-hidden rounded-3xl bg-[#0c1322] border border-[#1a2540] px-6 py-14">
          {/* Background glow */}
          <div className="absolute inset-0 hero-glow pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Phase 3 · AI Narratives + Live Data
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight font-display">
              Where is every nation in the{" "}
              <span className="gradient-text-blue">AI race?</span>
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto mb-10 leading-relaxed">
              Five dimensions. Real data. Forward trajectories. Understand which
              countries are accelerating, which are plateauing, and why.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { value: String(countries.length), label: "Countries Scored" },
                { value: "5", label: "Dimensions" },
                { value: `${avgScore}`, label: "Avg Score / 100" },
                {
                  value: topCountry ? `${topCountry.flag} ${topCountry.name.split(" ")[0]}` : "—",
                  label: "Top Ranked",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#060b14]/60 border border-[#1a2540] rounded-2xl p-4 text-center backdrop-blur-sm"
                >
                  <div className="text-2xl font-black text-blue-400 mb-1">{stat.value}</div>
                  <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar
          search={search}
          region={region}
          sort={sort}
          onSearch={setSearch}
          onRegion={setRegion}
          onSort={setSort}
          total={countries.length}
          filtered={filtered.length}
        />

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-4xl mb-4">🌐</p>
            <p className="text-lg font-semibold text-slate-400">No countries found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((country) => (
              <CountryCard
                key={country.slug}
                country={country}
                rank={getRank(country.slug)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[#1a2540] text-center space-y-2">
          <p className="text-xs text-slate-600">
            Data: World Bank API · OECD AI Policy Observatory · Scores updated daily.
          </p>
          <p className="text-xs text-slate-700">
            AI Trajectory Index · Built by{" "}
            <a
              href="https://ankitmishra.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-blue-400 transition-colors"
            >
              Ankit Mishra
            </a>
            {" "}— Commercial Portfolio Director at Holocene · Forbes contributor
          </p>
        </footer>
      </div>
    </main>
  );
}
