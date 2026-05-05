"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
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
  "High Adoption":    { color: "#3F7A4D", bg: "rgba(63,122,77,.10)",   border: "rgba(63,122,77,.30)"   },
  "Growing Adoption": { color: "#3B5BA5", bg: "rgba(59,91,165,.10)",   border: "rgba(59,91,165,.30)"   },
  "Early Adoption":   { color: "#B58A2E", bg: "rgba(181,138,46,.10)",  border: "rgba(181,138,46,.30)"  },
  "Nascent Adoption": { color: "#A8513D", bg: "rgba(168,81,61,.10)",   border: "rgba(168,81,61,.30)"   },
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
    () => countriesRaw.countries.map((c) => ({ ...c, data_source: "fallback" as const, wb_data_year: null, imf_data: false, oecd_data: false, anthropic_data: false })) as ScoredCountry[],
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
    <main style={{ minHeight: "100vh", background: "var(--dt-bg)" }}>
      <SiteHeader activePage="adoption" />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Lens toggle ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", gap: 2, border: "1px solid var(--dt-border)", background: "var(--dt-surface)", padding: 4 }}>
            <Link href="/" style={{ padding: "6px 20px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--dt-text-3)", textDecoration: "none" }}>
              Readiness Index
            </Link>
            <span style={{ padding: "6px 20px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, background: "var(--signal)", color: "#fff" }}>
              Adoption Scorecard
            </span>
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{ background: "var(--dt-surface)", borderTop: "4px solid var(--positive)", border: "1px solid var(--dt-border)", padding: "32px 40px", marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--positive)", marginBottom: 12 }}>
            AI ADOPTION SCORECARD · 2026
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.02em", color: "var(--dt-text-0)", lineHeight: 1.1, marginBottom: 12 }}>
            Which countries are <em style={{ color: "var(--positive)" }}>actually using AI</em>?
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.6, color: "var(--dt-text-2)", maxWidth: 640, marginBottom: 24 }}>
            Having the infrastructure and talent to build AI is not the same as actually using it.
            This scorecard measures real deployment — in government services, businesses, and everyday life — across 186 countries.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 600, marginBottom: 24 }}>
            <div style={{ padding: 16, background: "var(--dt-raised)", border: "1px solid var(--dt-border)", borderLeft: "3px solid var(--signal)" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--signal)", marginBottom: 8 }}>READINESS SCORE</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--dt-text-0)", marginBottom: 6 }}>Can this country build AI?</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, lineHeight: 1.5, color: "var(--dt-text-3)" }}>
                Measures the underlying capacity — digital infrastructure, AI talent, investment, governance frameworks, and economic strength.
              </p>
            </div>
            <div style={{ padding: 16, background: "var(--dt-raised)", border: "1px solid var(--dt-border)", borderLeft: "3px solid var(--positive)" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--positive)", marginBottom: 8 }}>ADOPTION SCORE</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--dt-text-0)", marginBottom: 6 }}>Is this country using AI now?</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, lineHeight: 1.5, color: "var(--dt-text-3)" }}>
                Measures active deployment — AI in public services, businesses, labour markets, and consumer apps.
              </p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Highest Adoption",     value: topCountry     ? `${topCountry.flag} ${topCountry.name}` : "—",                         sub: topCountry     ? `${topCountry.adoption_total}/100` : "" },
              { label: "Global Average",        value: `${avgScore}`,                                                                           sub: "out of 100" },
              { label: "Biggest Leapfrogger",   value: topOverperform  ? `${topOverperform.flag} ${topOverperform.name.split(" ")[0]}` : "—",   sub: topOverperform  ? `+${topOverperform.adoption_gap} pts above readiness` : "" },
              { label: "Biggest Underutiliser", value: topUnderperform ? `${topUnderperform.flag} ${topUnderperform.name.split(" ")[0]}` : "—", sub: topUnderperform ? `${topUnderperform.adoption_gap} pts below readiness` : "" },
            ].map((s) => (
              <div key={s.label} style={{ padding: 14, background: "var(--dt-raised)", border: "1px solid var(--dt-border)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--dt-text-3)", marginBottom: 8 }}>{s.label.toUpperCase()}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 500, color: "var(--positive)", lineHeight: 1.2, marginBottom: 4 }}>{s.value}</p>
                {s.sub && <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--dt-text-3)" }}>{s.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Insights ── */}
        <AdoptionInsights
          data={enriched}
          onSortChange={(s) => { setSort(s as SortKey); gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
          onRegionChange={(r) => { setRegion(r as Region); gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
        />

        {/* ── Gap explainer ── */}
        <div style={{ background: "var(--dt-surface)", border: "1px solid var(--dt-border)", padding: 24, marginBottom: 0 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--dt-text-0)", marginBottom: 16 }}>
            Why the gap between readiness and adoption matters
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ borderLeft: "3px solid var(--positive)", paddingLeft: 16 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--positive)", marginBottom: 8 }}>LEAPFROGGERS ↑</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.6, color: "var(--dt-text-2)" }}>Countries adopting AI faster than their readiness predicts. Often driven by mobile-first technology — Kenya&apos;s M-Pesa, the Philippines&apos; GCash, Bangladesh&apos;s bKash embedded AI into daily financial life before broadband or desktop infrastructure arrived.</p>
            </div>
            <div style={{ borderLeft: "3px solid var(--signal)", paddingLeft: 16 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--signal)", marginBottom: 8 }}>ALIGNED ≈</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.6, color: "var(--dt-text-2)" }}>Countries where deployment roughly matches capacity. The US, UK, and China are broadly aligned — their high readiness scores translate into correspondingly high real-world AI use.</p>
            </div>
            <div style={{ borderLeft: "3px solid #B58A2E", paddingLeft: 16 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#B58A2E", marginBottom: 8 }}>UNDERUTILISERS ↓</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.6, color: "var(--dt-text-2)" }}>Countries with strong AI foundations that are slow to deploy. Japan, Germany, Switzerland, and Italy consistently underperform their readiness — due to conservative adoption culture, regulatory caution, or legacy enterprise systems resisting change.</p>
            </div>
          </div>
        </div>

        {/* ── Gap Matrix ── */}
        <GapMatrix data={enriched} />

        {/* ── Filter bar ── */}
        <div ref={gridRef} style={{ display: "flex", flexDirection: "column", gap: 10, scrollMarginTop: 128, marginTop: 24 }}>
          {/* Row 1 */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <input type="text" placeholder="Search countries…" value={search}
                onChange={(e) => setSearch(e.target.value)} className="input-base" style={{ fontSize: 13 }} />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--dt-text-3)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
              )}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
              className="input-base" style={{ width: "auto", minWidth: 190, fontSize: 12 }}>
              <option value="adoption_total">Sort: Adoption Score</option>
              <option value="adoption_gap">Sort: Biggest Leapfrogger</option>
              <option value="gap_negative">Sort: Biggest Underutiliser</option>
              <option value="government">Sort: Government Deployment</option>
              <option value="consumer">Sort: Consumer Usage</option>
            </select>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dt-text-3)" }}>{filtered.length} of {enriched.length} countries</span>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {/* Grid / Table toggle */}
              {(["grid", "table"] as ViewMode[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", fontSize: 11,
                    fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.06em",
                    border: "1px solid", cursor: "pointer",
                    ...(view === v
                      ? { background: "var(--signal)", color: "#fff", borderColor: "var(--signal)" }
                      : { background: "transparent", color: "var(--dt-text-3)", borderColor: "var(--dt-border)" })
                  }}>
                  {v === "grid" ? (
                    <svg width={12} height={12} fill="currentColor" viewBox="0 0 16 16">
                      <rect x="1" y="1" width="6" height="6" /><rect x="9" y="1" width="6" height="6" />
                      <rect x="1" y="9" width="6" height="6" /><rect x="9" y="9" width="6" height="6" />
                    </svg>
                  ) : (
                    <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 16 16">
                      <line x1="1" y1="4" x2="15" y2="4" strokeWidth="1.5" />
                      <line x1="1" y1="8" x2="15" y2="8" strokeWidth="1.5" />
                      <line x1="1" y1="12" x2="15" y2="12" strokeWidth="1.5" />
                    </svg>
                  )}
                  {v === "grid" ? "Cards" : "Table"}
                </button>
              ))}

              {/* Share */}
              <div style={{ position: "relative" }}>
                <button onClick={shareView} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  title="Copy link to this filtered view">
                  <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                {shareToast && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, padding: "5px 12px", fontSize: 11, fontFamily: "var(--font-mono)", whiteSpace: "nowrap", background: "var(--dt-surface)", border: "1px solid var(--dt-border)", color: "var(--positive)" }}>
                    Link copied!
                  </div>
                )}
              </div>

              {/* Export */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setExportOpen((o) => !o)}
                  className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
                {exportOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setExportOpen(false)} />
                    <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, background: "var(--dt-surface)", border: "1px solid var(--dt-border)", minWidth: 160 }}>
                      <button
                        onClick={() => { triggerDownload(buildAdoptionCSV(filtered, globalRanks), "ai_adoption_scorecard_2026.csv", "text/csv"); setExportOpen(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", fontSize: 11, fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--dt-text-1)", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--dt-raised)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
            {REGIONS.map((r) => (
              <button key={r} onClick={() => setRegion(r)}
                style={{
                  padding: "4px 12px", fontSize: 11, fontFamily: "var(--font-sans)", fontWeight: 600,
                  border: "1px solid", cursor: "pointer",
                  ...(region === r
                    ? { background: "var(--signal)", color: "#fff", borderColor: "var(--signal)" }
                    : { background: "transparent", color: "var(--dt-text-3)", borderColor: "var(--dt-border)" })
                }}>{r}</button>
            ))}
          </div>

          {/* Row 3: Tier pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--dt-text-3)" }}>TIER:</span>
            {TIERS.map((t) => {
              const ts = t !== "All" ? TIER_COLORS[t] : null;
              const isActive = tier === t;
              return (
                <button key={t} onClick={() => setTier(t)}
                  style={{
                    padding: "4px 12px", fontSize: 11, fontFamily: "var(--font-sans)", fontWeight: 600,
                    border: "1px solid", cursor: "pointer",
                    ...(isActive && ts
                      ? { background: ts.bg, color: ts.color, borderColor: ts.border }
                      : isActive
                      ? { background: "var(--signal)", color: "#fff", borderColor: "var(--signal)" }
                      : { background: "transparent", color: "var(--dt-text-3)", borderColor: "var(--dt-border)" })
                  }}>{t}</button>
              );
            })}
          </div>

          {compareToast && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#B58A2E" }}>Max 3 countries — remove one first.</p>
          )}
        </div>

        {/* ── Section header ── */}
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--dt-text-3)", marginBottom: 4 }}>
            ALL COUNTRIES · ADOPTION RANKINGS
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--dt-text-3)" }}>
            {view === "grid"
              ? "Click any card to see the full country profile. Use the + button to compare up to 3 countries side by side."
              : "Click any column header to sort. Click a country name to see its full profile."}
          </p>
        </div>

        {/* ── Content ── */}
        {view === "table" ? (
          <AdoptionTable countries={filtered} globalRanks={globalRanks} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🚀</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--dt-text-2)" }}>No countries found</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, marginTop: 8, color: "var(--dt-text-3)" }}>Try adjusting your search or filters</p>
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
        <footer style={{ paddingTop: 32, paddingBottom: 16, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dt-text-3)" }}>
            AI Adoption Scorecard · AI Trajectory Index · {new Date().getFullYear()} ·{" "}
            <Link href="/methodology" style={{ color: "inherit", textDecoration: "none" }}>Methodology</Link>
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
