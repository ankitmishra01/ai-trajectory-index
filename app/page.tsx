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

        // Warn if cached data is older than 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(data.last_updated).getTime() < sevenDaysAgo) {
          setStaleWarning(true);
        }
      })
      .catch(() => {
        /* silent: keep static fallback */
      })
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
    <main className="min-h-screen bg-[#0a0f1e]">
      {/* Sticky Header */}
      <header className="border-b border-[#1c2847] sticky top-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              AI Trajectory Index
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scoring {countries.length} countries on current AI readiness and 3–5 year trajectory
            </p>
          </div>
          <div className="text-right flex items-center gap-3">
            <Link
              href="/map"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c2847] text-blue-400 text-xs font-semibold hover:bg-blue-500 hover:text-white transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map View
            </Link>
            <div>
            <p className="text-xs text-slate-500">
              Built by{" "}
              <a
                href="https://ankitmishra.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ankit Mishra
              </a>
            </p>
            {formattedDate && (
              <p className="text-xs text-slate-600 mt-0.5">
                {usingLiveData ? (
                  <span className="flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Live · Updated {formattedDate}
                  </span>
                ) : (
                  <span className="text-amber-500/70">Cached data · {formattedDate}</span>
                )}
              </p>
            )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Stale data warning */}
        {staleWarning && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center gap-2">
            <span>⚠</span>
            <span>Data may be outdated — live World Bank feed unavailable. Showing cached scores.</span>
          </div>
        )}

        {/* API unavailable notice */}
        {!loading && !usingLiveData && !staleWarning && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-slate-800/50 border border-[#1c2847] text-slate-400 text-sm flex items-center gap-2">
            <span>ℹ</span>
            <span>Showing baseline scores — World Bank live data temporarily unavailable.</span>
          </div>
        )}

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Phase 2 · Live Data Edition
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Where is every nation in the{" "}
            <span className="text-blue-400">AI race?</span>
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Five dimensions. Real data. Forward trajectories. Understand which
            countries are accelerating, which are plateauing, and why.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Countries Scored", value: String(countries.length) },
            { label: "Scoring Dimensions", value: "5" },
            { label: "Avg. Current Score", value: `${avgScore}/100` },
            {
              label: "Top Ranked",
              value: topCountry
                ? `${topCountry.flag} ${topCountry.name.split(" ")[0]}`
                : "—",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0f1628] border border-[#1c2847] rounded-xl p-4 text-center"
            >
              <div className="text-xl font-black text-blue-400">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
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
        <footer className="mt-16 pt-8 border-t border-[#1c2847] text-center space-y-2">
          <p className="text-xs text-slate-500">
            Data: World Bank API (IT.NET.USER.ZS, GB.XPD.RSDV.GD.ZS, NY.GDP.PCAP.CD + 3 more) ·{" "}
            OECD AI Policy Observatory · Scores updated daily.
          </p>
          <p className="text-xs text-slate-600">
            AI Trajectory Index · Built by{" "}
            <a
              href="https://ankitmishra.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-blue-400 transition-colors"
            >
              Ankit Mishra
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
