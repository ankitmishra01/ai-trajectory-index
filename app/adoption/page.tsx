"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import AdoptionCard from "@/components/AdoptionCard";
import GapMatrix from "@/components/GapMatrix";
import adoptionRaw from "@/data/adoption.json";
import countriesRaw from "@/data/countries.json";
import { enrichAdoption } from "@/lib/adoption";
import type { EnrichedAdoption } from "@/lib/adoption";
import type { ScoredCountry } from "@/lib/types";

type SortKey = "adoption_total" | "adoption_gap" | "gap_negative" | "government" | "consumer";
type Region = "All" | "Americas" | "Europe" | "Asia-Pacific" | "Middle East & Africa";

const REGIONS: Region[] = ["All", "Americas", "Europe", "Asia-Pacific", "Middle East & Africa"];

export default function AdoptionPage() {
  const [region, setRegion] = useState<Region>("All");
  const [sort, setSort] = useState<SortKey>("adoption_total");
  const [search, setSearch] = useState("");

  const countries = useMemo(
    () => countriesRaw.countries.map((c) => ({ ...c, data_source: "fallback" as const })) as ScoredCountry[],
    []
  );

  const enriched: EnrichedAdoption[] = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => enrichAdoption(adoptionRaw.countries as any, countries),
    [countries]
  );

  const sorted = useMemo(() => [...enriched].sort((a, b) => b.adoption_total - a.adoption_total), [enriched]);

  const filtered = useMemo(() => {
    let arr = enriched.filter((c) => {
      const ms = c.name.toLowerCase().includes(search.toLowerCase());
      const mr = region === "All" || c.region === region;
      return ms && mr;
    });
    if (sort === "adoption_total") arr = arr.sort((a, b) => b.adoption_total - a.adoption_total);
    else if (sort === "adoption_gap") arr = arr.sort((a, b) => b.adoption_gap - a.adoption_gap);
    else if (sort === "gap_negative") arr = arr.sort((a, b) => a.adoption_gap - b.adoption_gap);
    else if (sort === "government") arr = arr.sort((a, b) => b.adoption_scores.government - a.adoption_scores.government);
    else if (sort === "consumer") arr = arr.sort((a, b) => b.adoption_scores.consumer - a.adoption_scores.consumer);
    return arr;
  }, [enriched, region, sort, search]);

  // Hero stats
  const topCountry     = sorted[0];
  const avgScore       = Math.round(enriched.reduce((s, c) => s + c.adoption_total, 0) / (enriched.length || 1));
  const topOverperform = [...enriched].sort((a, b) => b.adoption_gap - a.adoption_gap)[0];
  const topUnderperform= [...enriched].sort((a, b) => a.adoption_gap - b.adoption_gap)[0];

  const globalRanks = useMemo(
    () => Object.fromEntries(sorted.map((c, i) => [c.slug, i + 1])),
    [sorted]
  );

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="page-glow" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.96)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <div>
              <h1 className="text-sm font-black tracking-tight font-display leading-none" style={{ color: "var(--text-1)" }}>
                AI Trajectory Index
              </h1>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
                Adoption Scorecard · 2026
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/methodology" className="hidden sm:block text-[11px] transition-colors hover:text-blue-400"
              style={{ color: "var(--text-3)" }}>Methodology</Link>
            <div className="hidden sm:block h-4 w-px" style={{ background: "var(--border)" }} />
            <Link href="/map" className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="hidden sm:inline">Map</span>
            </Link>
          </div>
        </div>
        {/* Sub-nav */}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-0 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}>
            {[
              { href: "/americas",     emoji: "🌎", label: "Americas"     },
              { href: "/europe",       emoji: "🌍", label: "Europe"       },
              { href: "/africa",       emoji: "🌍", label: "Africa"       },
              { href: "/middle-east",  emoji: "🕌", label: "Middle East"  },
              { href: "/asia-pacific", emoji: "🌏", label: "Asia-Pacific" },
            ].map(({ href, emoji, label }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors hover:text-blue-400"
                style={{ color: "var(--text-2)", borderBottom: "2px solid transparent" }}>
                <span>{emoji}</span><span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Lens toggle ── */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-2xl p-1 gap-1"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Link href="/"
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ color: "var(--text-3)", background: "transparent" }}>
              Readiness Index
            </Link>
            <span className="px-5 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}>
              Adoption Scorecard
            </span>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="relative card shine-on-hover rounded-3xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,.35), transparent)" }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(34,197,94,.06) 0%, transparent 70%)" }} />

          <div className="relative px-6 sm:px-12 pt-10 pb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "rgba(74,222,128,.7)" }}>
              AI Adoption Scorecard · 2026
            </p>
            <h2 className="font-serif-display text-3xl sm:text-5xl mb-3 leading-tight"
              style={{ color: "var(--text-1)" }}>
              Which countries are{" "}
              <em className="not-italic" style={{
                background: "linear-gradient(135deg, #4ade80, #22c55e 60%, #86efac)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
              }}>actually using AI</em>?
            </h2>
            <p className="text-base max-w-2xl mb-6 leading-relaxed" style={{ color: "var(--text-2)" }}>
              Having the infrastructure and talent to build AI is not the same as actually using it.
              This scorecard measures real deployment — in government services, businesses, and everyday
              life — across 186 countries.
            </p>

            {/* Readiness vs Adoption explainer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-2xl">
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(59,130,246,.07)", border: "1px solid rgba(59,130,246,.22)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">📊</span>
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                    Readiness Score
                  </span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                  Can this country build AI?
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                  Measures the underlying capacity — digital infrastructure, AI talent, investment, governance frameworks, and economic strength. A high score means the foundations are in place.
                </p>
              </div>
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.22)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🚀</span>
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#4ade80" }}>
                    Adoption Score
                  </span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                  Is this country using AI now?
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                  Measures active deployment — AI in public services, businesses, labour markets, and consumer apps. A high score means AI is already embedded in daily economic life.
                </p>
              </div>
            </div>

            {/* Hero stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Highest Adoption", value: topCountry ? `${topCountry.flag} ${topCountry.name}` : "—", sub: topCountry ? `${topCountry.adoption_total}/100` : "" },
                { label: "Global Average",   value: `${avgScore}`, sub: "out of 100" },
                { label: "Biggest Leapfrogger", value: topOverperform ? `${topOverperform.flag} ${topOverperform.name.split(" ")[0]}` : "—", sub: topOverperform ? `+${topOverperform.adoption_gap} pts above readiness` : "" },
                { label: "Biggest Underutiliser", value: topUnderperform ? `${topUnderperform.flag} ${topUnderperform.name.split(" ")[0]}` : "—", sub: topUnderperform ? `${topUnderperform.adoption_gap} pts below readiness` : "" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4"
                  style={{ background: "rgba(6,11,20,.55)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>{s.label}</p>
                  <p className="text-lg font-black leading-none mb-1" style={{ color: "#4ade80" }}>{s.value}</p>
                  {s.sub && <p className="text-xs" style={{ color: "var(--text-3)" }}>{s.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── The Gap explainer ── */}
        <div className="rounded-2xl p-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-black mb-3" style={{ color: "var(--text-1)" }}>
            Why the gap between readiness and adoption matters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
            <div>
              <p className="font-bold mb-1" style={{ color: "#4ade80" }}>Leapfroggers ↑</p>
              <p>Countries adopting AI faster than their readiness predicts. Often driven by mobile-first technology — Kenya&apos;s M-Pesa, the Philippines&apos; GCash, Bangladesh&apos;s bKash embedded AI into daily financial life before broadband or desktop infrastructure arrived.</p>
            </div>
            <div>
              <p className="font-bold mb-1" style={{ color: "var(--accent)" }}>Aligned ≈</p>
              <p>Countries where deployment roughly matches capacity. The US, UK, and China are broadly aligned — their high readiness scores translate into correspondingly high real-world AI use.</p>
            </div>
            <div>
              <p className="font-bold mb-1" style={{ color: "#f59e0b" }}>Underutilisers ↓</p>
              <p>Countries with strong AI foundations that are slow to deploy. Japan, Germany, Switzerland, and Italy consistently underperform their readiness — due to conservative adoption culture, regulatory caution, or legacy enterprise systems resisting change.</p>
            </div>
          </div>
        </div>

        {/* ── Gap Matrix ── */}
        <GapMatrix data={enriched} />

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <input
              type="text"
              placeholder="Search countries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pr-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "var(--text-3)" }}>✕</button>
            )}
          </div>

          {/* Region pills */}
          <div className="flex gap-1.5 flex-wrap">
            {REGIONS.map((r) => (
              <button key={r} onClick={() => setRegion(r)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={region === r
                  ? { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }
                  : { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)" }
                }>
                {r}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input-base text-xs"
            style={{ width: "auto", minWidth: 180 }}
          >
            <option value="adoption_total">Sort: Adoption Score</option>
            <option value="adoption_gap">Sort: Biggest Leapfrogger</option>
            <option value="gap_negative">Sort: Biggest Underutiliser</option>
            <option value="government">Sort: Government Deployment</option>
            <option value="consumer">Sort: Consumer Usage</option>
          </select>

          <span className="text-xs ml-auto" style={{ color: "var(--text-3)" }}>
            {filtered.length} of {enriched.length} countries
          </span>
        </div>

        {/* ── Cards section header ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
            All Countries · Adoption Rankings
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
            Each card shows the adoption score (0–100), how it compares to the country&apos;s readiness score, and the five adoption dimensions. Click any card to see the full country profile.
          </p>
        </div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((country) => (
            <AdoptionCard
              key={country.slug}
              country={country}
              rank={globalRanks[country.slug] ?? 0}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>No countries match your filters.</p>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="pt-8 pb-4 text-center">
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            AI Adoption Scorecard · AI Trajectory Index · {new Date().getFullYear()} ·{" "}
            <Link href="/methodology" className="hover:text-blue-400 transition-colors">Methodology</Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
