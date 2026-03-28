"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import NewsTicker from "@/components/NewsTicker";
import AdoptionCard from "@/components/AdoptionCard";
import AdoptionTable from "@/components/AdoptionTable";
import AdoptionInsights from "@/components/AdoptionInsights";
import AdoptionComparisonPanel from "@/components/AdoptionComparisonPanel";
import GapMatrix from "@/components/GapMatrix";
import adoptionRaw from "@/data/adoption.json";
import countriesRaw from "@/data/countries.json";
import { enrichAdoption } from "@/lib/adoption";
import type { EnrichedAdoption } from "@/lib/adoption";
import type { ScoredCountry } from "@/lib/types";

type SortKey = "adoption_total" | "adoption_gap" | "gap_negative" | "government" | "consumer";
type Region = "All" | "Americas" | "Europe" | "Asia-Pacific" | "Middle East & Africa";
type TierFilter = "All" | "High Adoption" | "Growing Adoption" | "Early Adoption" | "Nascent Adoption";
type ViewMode = "grid" | "table";

const REGIONS: Region[] = ["All", "Americas", "Europe", "Asia-Pacific", "Middle East & Africa"];
const TIERS: TierFilter[] = ["All", "High Adoption", "Growing Adoption", "Early Adoption", "Nascent Adoption"];

const TIER_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  "High Adoption":    { color: "#4ade80", bg: "rgba(74,222,128,.10)",  border: "rgba(74,222,128,.30)"  },
  "Growing Adoption": { color: "#60a5fa", bg: "rgba(96,165,250,.10)",  border: "rgba(96,165,250,.30)"  },
  "Early Adoption":   { color: "#f59e0b", bg: "rgba(245,158,11,.10)",  border: "rgba(245,158,11,.30)"  },
  "Nascent Adoption": { color: "#f87171", bg: "rgba(248,113,113,.10)", border: "rgba(248,113,113,.30)" },
};

function triggerDownload(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function buildAdoptionCSV(countries: EnrichedAdoption[], ranks: Record<string, number>): string {
  const headers = ["Rank","Country","Flag","Region","Adoption_Score","Tier","Gap_vs_Readiness","Government","Enterprise","Talent_Demand","Consumer","Pipeline"];
  const rows = [...countries]
    .sort((a, b) => (ranks[a.slug] ?? 999) - (ranks[b.slug] ?? 999))
    .map((c) => [
      ranks[c.slug] ?? "", `"${c.name}"`, c.flag, `"${c.region}"`,
      c.adoption_total, `"${c.adoption_tier}"`, c.adoption_gap,
      c.adoption_scores.government, c.adoption_scores.enterprise,
      c.adoption_scores.talent_demand, c.adoption_scores.consumer, c.adoption_scores.pipeline,
    ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export default function AdoptionPage() {
  const [region, setRegion]         = useState<Region>("All");
  const [sort, setSort]             = useState<SortKey>("adoption_total");
  const [search, setSearch]         = useState("");
  const [tier, setTier]             = useState<TierFilter>("All");
  const [view, setView]             = useState<ViewMode>("grid");
  const [shareToast, setShareToast] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareToast, setCompareToast] = useState(false);
  const urlInitialisedRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

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
      const mt = tier === "All" || c.adoption_tier === tier;
      return ms && mr && mt;
    });
    if (sort === "adoption_total") arr = arr.sort((a, b) => b.adoption_total - a.adoption_total);
    else if (sort === "adoption_gap")  arr = arr.sort((a, b) => b.adoption_gap - a.adoption_gap);
    else if (sort === "gap_negative")  arr = arr.sort((a, b) => a.adoption_gap - b.adoption_gap);
    else if (sort === "government")    arr = arr.sort((a, b) => b.adoption_scores.government - a.adoption_scores.government);
    else if (sort === "consumer")      arr = arr.sort((a, b) => b.adoption_scores.consumer - a.adoption_scores.consumer);
    return arr;
  }, [enriched, region, sort, search, tier]);

  // URL state
  useEffect(() => {
    if (typeof window === "undefined" || urlInitialisedRef.current) return;
    urlInitialisedRef.current = true;
    const p = new URLSearchParams(window.location.search);
    const r = p.get("region"); if (r) setRegion(decodeURIComponent(r) as Region);
    const t = p.get("tier");   if (t) setTier(decodeURIComponent(t) as TierFilter);
    const s = p.get("sort");   if (s) setSort(s as SortKey);
    const q = p.get("q");      if (q) setSearch(decodeURIComponent(q));
    const v = p.get("view");   if (v === "table") setView("table");
  }, []);

  useEffect(() => {
    if (!urlInitialisedRef.current) return;
    const p = new URLSearchParams();
    if (region !== "All")          p.set("region", region);
    if (tier !== "All")            p.set("tier", tier);
    if (sort !== "adoption_total") p.set("sort", sort);
    if (search)                    p.set("q", search);
    if (view !== "grid")           p.set("view", view);
    const qs = p.toString();
    window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
  }, [region, tier, sort, search, view]);

  const toggleCompare = useCallback((slug: string) => {
    setCompareList((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) { setCompareToast(true); setTimeout(() => setCompareToast(false), 2500); return prev; }
      return [...prev, slug];
    });
  }, []);

  function shareView() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    });
  }

  const topCountry      = sorted[0];
  const avgScore        = Math.round(enriched.reduce((s, c) => s + c.adoption_total, 0) / (enriched.length || 1));
  const topOverperform  = [...enriched].sort((a, b) => b.adoption_gap - a.adoption_gap)[0];
  const topUnderperform = [...enriched].sort((a, b) => a.adoption_gap - b.adoption_gap)[0];

  const globalRanks = useMemo(
    () => Object.fromEntries(sorted.map((c, i) => [c.slug, i + 1])),
    [sorted]
  );

  const compareCountries = useMemo(
    () => compareList.map((s) => enriched.find((c) => c.slug === s)).filter(Boolean) as EnrichedAdoption[],
    [compareList, enriched]
  );

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="page-glow" />

      <NewsTicker />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.96)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <div>
              <h1 className="text-sm font-black tracking-tight font-display leading-none" style={{ color: "var(--text-1)" }}>
                AI Trajectory Index
              </h1>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Adoption Scorecard · 2026</p>
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
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
            <Link href="/" className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ color: "var(--text-3)", background: "transparent" }}>Readiness Index</Link>
            <span className="px-5 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}>Adoption Scorecard</span>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="relative card shine-on-hover rounded-3xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,.35), transparent)" }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(34,197,94,.06) 0%, transparent 70%)" }} />
          <div className="relative px-6 sm:px-12 pt-10 pb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(74,222,128,.7)" }}>
              AI Adoption Scorecard · 2026
            </p>
            <h2 className="font-serif-display text-3xl sm:text-5xl mb-3 leading-tight" style={{ color: "var(--text-1)" }}>
              Which countries are{" "}
              <em className="not-italic" style={{
                background: "linear-gradient(135deg, #4ade80, #22c55e 60%, #86efac)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>actually using AI</em>?
            </h2>
            <p className="text-base max-w-2xl mb-6 leading-relaxed" style={{ color: "var(--text-2)" }}>
              Having the infrastructure and talent to build AI is not the same as actually using it.
              This scorecard measures real deployment — in government services, businesses, and everyday life — across 186 countries.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-2xl">
              <div className="rounded-2xl p-4" style={{ background: "rgba(59,130,246,.07)", border: "1px solid rgba(59,130,246,.22)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">📊</span>
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--accent)" }}>Readiness Score</span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>Can this country build AI?</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                  Measures the underlying capacity — digital infrastructure, AI talent, investment, governance frameworks, and economic strength.
                </p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.22)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🚀</span>
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#4ade80" }}>Adoption Score</span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>Is this country using AI now?</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                  Measures active deployment — AI in public services, businesses, labour markets, and consumer apps.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Highest Adoption",     value: topCountry     ? `${topCountry.flag} ${topCountry.name}` : "—",                         sub: topCountry     ? `${topCountry.adoption_total}/100` : "" },
                { label: "Global Average",        value: `${avgScore}`,                                                                           sub: "out of 100" },
                { label: "Biggest Leapfrogger",   value: topOverperform  ? `${topOverperform.flag} ${topOverperform.name.split(" ")[0]}` : "—",   sub: topOverperform  ? `+${topOverperform.adoption_gap} pts above readiness` : "" },
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

        {/* ── Insights ── */}
        <AdoptionInsights
          data={enriched}
          onSortChange={(s) => { setSort(s as SortKey); gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
          onRegionChange={(r) => { setRegion(r as Region); gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
        />

        {/* ── Gap explainer ── */}
        <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
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

        {/* ── Filter bar ── */}
        <div ref={gridRef} className="flex flex-col gap-3 scroll-mt-32">
          {/* Row 1 */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <input type="text" placeholder="Search countries…" value={search}
                onChange={(e) => setSearch(e.target.value)} className="input-base pr-8 text-sm" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "var(--text-3)" }}>✕</button>
              )}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
              className="input-base text-xs" style={{ width: "auto", minWidth: 190 }}>
              <option value="adoption_total">Sort: Adoption Score</option>
              <option value="adoption_gap">Sort: Biggest Leapfrogger</option>
              <option value="gap_negative">Sort: Biggest Underutiliser</option>
              <option value="government">Sort: Government Deployment</option>
              <option value="consumer">Sort: Consumer Usage</option>
            </select>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>{filtered.length} of {enriched.length} countries</span>

            <div className="ml-auto flex items-center gap-2">
              {/* Grid / Table toggle */}
              {(["grid", "table"] as ViewMode[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={view === v
                    ? { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }
                    : { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)" }
                  }>
                  {v === "grid" ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                      <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
                      <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                      <line x1="1" y1="4" x2="15" y2="4" strokeWidth="1.5" />
                      <line x1="1" y1="8" x2="15" y2="8" strokeWidth="1.5" />
                      <line x1="1" y1="12" x2="15" y2="12" strokeWidth="1.5" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{v === "grid" ? "Cards" : "Table"}</span>
                </button>
              ))}

              {/* Share */}
              <div className="relative">
                <button onClick={shareView} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl"
                  title="Copy link to this filtered view">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="hidden sm:inline">Share</span>
                </button>
                {shareToast && (
                  <div className="absolute right-0 top-full mt-2 z-50 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#4ade80" }}>
                    Link copied!
                  </div>
                )}
              </div>

              {/* Export */}
              <div className="relative">
                <button onClick={() => setExportOpen((o) => !o)}
                  className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-xl"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: 160 }}>
                      <button
                        onClick={() => { triggerDownload(buildAdoptionCSV(filtered, globalRanks), "ai_adoption_scorecard_2026.csv", "text/csv"); setExportOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-left"
                        style={{ color: "var(--text-1)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--raised)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Region pills */}
          <div className="flex gap-1.5 flex-wrap">
            {REGIONS.map((r) => (
              <button key={r} onClick={() => setRegion(r)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={region === r
                  ? { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }
                  : { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)" }
                }>{r}</button>
            ))}
          </div>

          {/* Row 3: Tier pills */}
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Tier:</span>
            {TIERS.map((t) => {
              const ts = t !== "All" ? TIER_COLORS[t] : null;
              const isActive = tier === t;
              return (
                <button key={t} onClick={() => setTier(t)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={isActive && ts
                    ? { background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }
                    : isActive
                    ? { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }
                    : { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)" }
                  }>{t}</button>
              );
            })}
          </div>

          {compareToast && (
            <p className="text-xs" style={{ color: "#f59e0b" }}>Max 3 countries — remove one first.</p>
          )}
        </div>

        {/* ── Section header ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
            All Countries · Adoption Rankings
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
            {view === "grid"
              ? "Click any card to see the full country profile. Use the + button to compare up to 3 countries side by side."
              : "Click any column header to sort. Click a country name to see its full profile."}
          </p>
        </div>

        {/* ── Content ── */}
        {view === "table" ? (
          <AdoptionTable countries={filtered} globalRanks={globalRanks} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🚀</p>
            <p className="text-lg font-semibold" style={{ color: "var(--text-2)" }}>No countries found</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-3)" }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            style={{ paddingBottom: compareList.length >= 1 ? "96px" : undefined }}>
            {filtered.map((country) => (
              <AdoptionCard
                key={country.slug}
                country={country}
                rank={globalRanks[country.slug] ?? 0}
                isComparing={compareList.includes(country.slug)}
                onCompareToggle={toggleCompare}
              />
            ))}
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

      {/* ── Comparison panel ── */}
      <AdoptionComparisonPanel
        selected={compareCountries}
        onRemove={(slug) => setCompareList((p) => p.filter((s) => s !== slug))}
        onClear={() => setCompareList([])}
      />
    </main>
  );
}
