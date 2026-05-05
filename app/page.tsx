"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import CountryCard from "@/components/CountryCard";
import SkeletonCard from "@/components/SkeletonCard";
import RankingsTable from "@/components/RankingsTable";
import FilterBar, { Region, SortKey, TierFilter, TrajectoryFilter } from "@/components/FilterBar";
import ExportButton from "@/components/ExportButton";
import ComparisonPanel from "@/components/ComparisonPanel";
import KeyInsights from "@/components/KeyInsights";
import FastestMovers from "@/components/FastestMovers";
import staticData from "@/data/countries.json";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";

type ViewMode = "grid" | "table";

function scoreBandLabel(score: number): TierFilter {
  if (score >= 80) return "Leading";
  if (score >= 60) return "Advanced";
  if (score >= 40) return "Developing";
  return "Nascent";
}

function encodeRegion(r: Region) {
  return r === "All" ? "" : r.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-");
}
function decodeRegion(s: string): Region {
  const map: Record<string, Region> = {
    "americas": "Americas", "europe": "Europe",
    "asia-pacific": "Asia-Pacific", "middle-east-africa": "Middle East & Africa",
  };
  return map[s] ?? "All";
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array(n + 1).fill(0).map((_, j) => j === 0 ? i : 0)
  );
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

// ── Tiny sparkline (editorial hero leaderboard) ─────────────────────────────
function HeroSparkline({ from, to }: { from: number; to: number }) {
  const trend = to - from;
  const color = trend > 0 ? "var(--positive)" : trend < 0 ? "var(--negative)" : "var(--ed-muted)";
  const width = 48, height = 20;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const t = i / 9;
    const noise = Math.sin(i * 1.7) * Math.abs(trend) * 0.12;
    return from + trend * t + noise;
  });
  const min = Math.min(...pts) - 1;
  const max = Math.max(...pts) + 1;
  const range = max - min || 1;
  const pathD = pts.map((p, i) => {
    const x = (i / 9) * width;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block", flexShrink: 0 }}>
      <path d={pathD} stroke={color} strokeWidth={1.25} fill="none" />
    </svg>
  );
}

const REGIONS_DISPLAY = ["Americas", "Europe", "Asia-Pacific", "Middle East & Africa"] as const;

function regionalAvg(countries: ScoredCountry[], region: string) {
  const rc = countries.filter((c) => c.region === region);
  if (!rc.length) return 0;
  return Math.round(rc.reduce((s, c) => s + c.total_score, 0) / rc.length);
}

export default function Home() {
  const [search, setSearch]               = useState("");
  const [region, setRegion]               = useState<Region>("All");
  const [sort, setSort]                   = useState<SortKey>("total_score");
  const [tier, setTier]                   = useState<TierFilter>("All");
  const [trajectoryFilter, setTrajectory] = useState<TrajectoryFilter>("All");
  const [view, setView]                   = useState<ViewMode>("grid");
  const [compareList, setCompareList]     = useState<string[]>([]);
  const [watchlist, setWatchlist]         = useState<string[]>([]);
  const [shareToast, setShareToast]       = useState(false);
  const [compareToast, setCompareToast]   = useState(false);

  const [countries, setCountries] = useState<ScoredCountry[]>(() =>
    staticData.countries.map((c) => ({ ...c, data_source: "fallback" as const, wb_data_year: null, imf_data: false, oecd_data: false, anthropic_data: false }))
  );
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [usingLive, setUsingLive] = useState(false);

  const urlInitRef = useRef(false);
  const gridRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || urlInitRef.current) return;
    urlInitRef.current = true;
    const p = new URLSearchParams(window.location.search);
    const r = p.get("region"); if (r) setRegion(decodeRegion(r));
    const t = p.get("tier");   if (t) setTier(t as TierFilter);
    const tr = p.get("trajectory"); if (tr) setTrajectory(tr.replace(/-/g, " ") as TrajectoryFilter);
    const s = p.get("sort");   if (s) setSort(s as SortKey);
    const v = p.get("view");   if (v === "table") setView("table");
    const q = p.get("q");      if (q) setSearch(q);
  }, []);

  useEffect(() => {
    if (!urlInitRef.current) return;
    const p = new URLSearchParams();
    const er = encodeRegion(region);
    if (er)                          p.set("region", er);
    if (tier !== "All")              p.set("tier", tier.toLowerCase());
    if (trajectoryFilter !== "All")  p.set("trajectory", trajectoryFilter.toLowerCase().replace(/\s+/g, "-"));
    if (sort !== "total_score")      p.set("sort", sort);
    if (view !== "grid")             p.set("view", view);
    if (search)                      p.set("q", encodeURIComponent(search));
    const qs = p.toString();
    window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
  }, [region, tier, trajectoryFilter, sort, view, search]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ati_watchlist");
      if (raw) setWatchlist(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const toggleWatchlist = useCallback((slug: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length >= 10 ? prev : [...prev, slug];
      try { localStorage.setItem("ati_watchlist", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then((data: ScoresResponse) => {
        setCountries(data.countries);
        setLastUpdated(data.last_updated);
        setUsingLive(data.using_live_data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCompare = useCallback((slug: string) => {
    setCompareList((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) { setCompareToast(true); setTimeout(() => setCompareToast(false), 2500); return prev; }
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
        if (sort === "governance_gap")  return (b.total_score / 5 - b.scores.governance.score) - (a.total_score / 5 - a.scores.governance.score);
        return b.total_score - a.total_score;
      }),
    [countries, search, region, sort, tier, trajectoryFilter]
  );

  const fuzzySuggestion = useMemo(() => {
    if (filtered.length > 0 || !search.trim()) return null;
    const q = search.trim().toLowerCase();
    const best = countries
      .map((c) => ({ c, score: levenshtein(q, c.name.toLowerCase().slice(0, q.length + 3)) }))
      .sort((a, b) => a.score - b.score)[0];
    return best && best.score <= Math.max(2, Math.floor(q.length / 2)) ? best.c : null;
  }, [filtered.length, search, countries]);

  const topCountry     = ranked[0];
  const topTrajCountry = [...countries].sort((a, b) => (b.projected_score_2028 - b.total_score) - (a.projected_score_2028 - a.total_score))[0];
  const avgScore       = Math.round(countries.reduce((s, c) => s + c.total_score, 0) / (countries.length || 1));
  const compareCountries = useMemo(
    () => compareList.map((slug) => countries.find((c) => c.slug === slug)).filter(Boolean) as ScoredCountry[],
    [compareList, countries]
  );

  const fmtDate = lastUpdated
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastUpdated))
    : null;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  function scrollToGrid() { gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function shareView() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareToast(true); setTimeout(() => setShareToast(false), 2500);
    });
  }

  const liveCount = countries.filter((c) => c.data_source === "live").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          EDITORIAL HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <header style={{ background: "var(--ed-bg)", borderBottom: "1px solid var(--ed-border)" }}>
        {/* Date strip */}
        <div style={{ borderBottom: "1px solid var(--ed-border)", padding: "8px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ed-text-2)", letterSpacing: "0.04em" }}>
            <span>{dateStr}</span>
            <span style={{ color: "var(--ed-border-strong)" }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: usingLive ? "var(--positive)" : "var(--ed-muted)" }} />
              {usingLive ? `LIVE · WORLD BANK · 17 INDICATORS` : fmtDate ? `CACHED · ${fmtDate}` : "LOADING DATA…"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ed-text-2)" }}>
            <Link href="/methodology" style={{ color: "inherit", textDecoration: "none" }}>Methodology</Link>
            <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Cite</a>
            <Link href="/map" style={{ color: "inherit", textDecoration: "none" }}>Map</Link>
          </div>
        </div>
        {/* Masthead */}
        <div style={{ padding: "20px 48px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--signal)", fontWeight: 600, letterSpacing: "0.12em", marginBottom: 4 }}>VOL. III · 2026 EDITION</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.02em", color: "var(--ed-text-0)", lineHeight: 1, margin: 0 }}>
              The AI Trajectory Index
            </h1>
          </div>
          <nav style={{ display: "flex", gap: 28, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--ed-text-1)" }}>
            {[
              { label: "Index",       href: "/" },
              { label: "Map",         href: "/map" },
              { label: "Compare",     href: "/compare" },
              { label: "Adoption",    href: "/adoption" },
              { label: "Methodology", href: "/methodology" },
            ].map((l, i) => (
              <Link key={l.href} href={l.href}
                style={{
                  color: i === 0 ? "var(--ed-text-0)" : "var(--ed-text-1)",
                  borderBottom: i === 0 ? "2px solid var(--signal)" : "2px solid transparent",
                  paddingBottom: 4, textDecoration: "none",
                }}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — editorial 2-col: headline + leaderboard preview
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ed-bg)", padding: "64px 48px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 64, alignItems: "end" }}>
          {/* Left: editorial headline */}
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ed-text-2)", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 1, background: "var(--signal)", display: "inline-block" }} />
              GLOBAL · {countries.length} ECONOMIES · FIVE PILLARS
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 6vw, 88px)", fontWeight: 400, lineHeight: 0.95, letterSpacing: "-0.03em", color: "var(--ed-text-0)", margin: 0 }}>
              Who is winning the<br />
              <em style={{ fontStyle: "italic", color: "var(--signal)" }}>AI race</em> — and who<br />
              is being left behind?
            </h2>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", fontWeight: 400, color: "var(--ed-text-1)", lineHeight: 1.45, marginTop: 28, maxWidth: 560 }}>
              A live index scoring {countries.length} economies on AI readiness today and trajectory through 2028 — built on World Bank, OECD and World Governance Indicator data.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button
                onClick={scrollToGrid}
                style={{ background: "var(--signal)", color: "#fff", border: 0, padding: "12px 20px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em", cursor: "pointer" }}>
                Explore the data →
              </button>
              <Link href="/methodology"
                style={{ background: "transparent", color: "var(--ed-text-0)", border: "1px solid var(--ed-text-0)", padding: "12px 20px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                Read methodology
              </Link>
            </div>
          </div>

          {/* Right: leaderboard preview (top 5) */}
          <div style={{ borderLeft: "1px solid var(--ed-border-strong)", paddingLeft: 32 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ed-text-2)", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 16 }}>TOP FIVE · OVERALL READINESS</div>
            {ranked.slice(0, 5).map((c, i) => (
              <Link key={c.slug} href={`/country/${c.slug}`}
                style={{ display: "grid", gridTemplateColumns: "32px 1fr auto auto", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--ed-border)", textDecoration: "none" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontStyle: "italic", color: "var(--ed-muted)", lineHeight: 1 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--ed-text-0)", lineHeight: 1.1 }}>{c.flag} {c.name}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ed-text-2)", marginTop: 2 }}>{c.region}</div>
                </div>
                <HeroSparkline from={c.total_score} to={c.projected_score_2028} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 500, color: "var(--ed-text-0)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{c.total_score}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ed-text-2)", marginTop: 2 }}>/100</div>
                </div>
              </Link>
            ))}
            <button onClick={scrollToGrid} style={{ display: "block", marginTop: 14, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--signal)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              See full ranking ↓
            </button>
          </div>
        </div>

        {/* KPI band */}
        <div style={{ marginTop: 72, paddingTop: 32, borderTop: "1px solid var(--ed-border-strong)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {[
            {
              kicker: "Global Leader",
              value:  topCountry ? `${topCountry.flag} ${topCountry.name}` : "—",
              sub:    topCountry ? `${topCountry.total_score} / 100` : "",
              note:   "Highest overall readiness score",
            },
            {
              kicker: "Fastest Rising",
              value:  topTrajCountry ? `${topTrajCountry.flag} ${topTrajCountry.name.split(" ")[0]}` : "—",
              sub:    topTrajCountry ? `+${Math.round(topTrajCountry.projected_score_2028 - topTrajCountry.total_score)} pts` : "",
              note:   "Largest projected gain by 2028",
            },
            {
              kicker: "Median Score",
              value:  String(avgScore),
              sub:    "/ 100",
              note:   `Global average across ${countries.length} economies`,
            },
            {
              kicker: "Data Sources",
              value:  "17",
              sub:    "WB indicators",
              note:   "Updated daily from live API feeds",
            },
          ].map((k, i) => (
            <div key={i} style={{ paddingLeft: i ? 32 : 0, paddingRight: 32, borderLeft: i ? "1px solid var(--ed-border)" : "none" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ed-text-2)", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 8 }}>{k.kicker.toUpperCase()}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, color: "var(--ed-text-0)", lineHeight: 1.05, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--signal)", fontWeight: 600, marginBottom: 6 }}>{k.sub}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ed-text-1)", lineHeight: 1.4 }}>{k.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          KEY INSIGHTS (editorial)
      ══════════════════════════════════════════════════════════════════════ */}
      <KeyInsights
        countries={countries}
        onSortChange={(s) => { setSort(s); scrollToGrid(); }}
        onRegionChange={(r) => { setRegion(r); scrollToGrid(); }}
        onNavigate={() => {}}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          TWO LENSES
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ed-bg)", padding: "64px 48px", borderTop: "1px solid var(--ed-border)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ed-text-2)", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 12 }}>METHODOLOGY · TWO LENSES</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 400, color: "var(--ed-text-0)", margin: "0 0 28px", letterSpacing: "-0.02em" }}>
          Capacity to build AI, and capacity to <em style={{ fontStyle: "italic" }}>use it.</em>
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            {
              kicker: "READINESS · YOU ARE HERE",
              title: "Can this country build AI?",
              body: "Underlying capacity — infrastructure, talent pipelines, governance, investment, and economic strength. Think of it as the foundation.",
              pillars: ["Infrastructure", "Talent", "Governance", "Investment", "Economic Readiness"],
              active: true,
              href: null,
            },
            {
              kicker: "ADOPTION · NEW",
              title: "Is this country using AI now?",
              body: "Active deployment — government services, enterprise integration, consumer usage, and demand signals from the real economy.",
              pillars: ["Government", "Enterprise", "Consumer", "Talent Demand", "R&D Pipeline"],
              active: false,
              href: "/adoption",
            },
          ].map((lens, i) => {
            const inner = (
              <>
                {lens.active && <div style={{ position: "absolute", top: -1, left: -1, right: -1, height: 3, background: "var(--signal)" }} />}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: lens.active ? "var(--signal)" : "var(--ed-text-2)" }}>{lens.kicker}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--ed-muted)" }}>{String(i + 1).padStart(2, "0")} / 02</span>
                </div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, color: "var(--ed-text-0)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 14px" }}>{lens.title}</h4>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ed-text-1)", lineHeight: 1.55, margin: "0 0 18px" }}>{lens.body}</p>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                  {lens.pillars.map((p) => (
                    <span key={p} style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", padding: "4px 8px", background: lens.active ? "var(--ed-raised)" : "var(--ed-bg)", color: "var(--ed-text-1)", border: "1px solid var(--ed-border)" }}>{p.toUpperCase()}</span>
                  ))}
                </div>
              </>
            );
            const baseStyle: React.CSSProperties = {
              background: lens.active ? "var(--ed-bg)" : "var(--ed-raised)",
              border: lens.active ? "1px solid var(--signal)" : "1px solid var(--ed-border-strong)",
              padding: 28, position: "relative",
              textDecoration: "none", display: "block",
            };
            return lens.href
              ? <Link key={i} href={lens.href} style={baseStyle}>{inner}</Link>
              : <div key={i} style={baseStyle}>{inner}</div>;
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          DATA TERMINAL — dark section begins here
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "var(--dt-bg)", borderTop: "8px solid var(--signal)", padding: "32px 48px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--dt-border)", paddingBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "var(--signal)", marginBottom: 8 }}>SECTION II · DATA TERMINAL</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 400, letterSpacing: "-0.025em", color: "var(--dt-text-0)", margin: 0, lineHeight: 1 }}>
              Explore <em style={{ fontStyle: "italic", color: "var(--signal)" }}>{countries.length} economies.</em>
            </h3>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dt-text-3)", letterSpacing: "0.06em", textAlign: "right" as const, lineHeight: 1.7 }}>
            {fmtDate && <div>LAST FETCH · {fmtDate.toUpperCase()}</div>}
            <div>NEXT REFRESH · 24H · WORLD BANK API</div>
            <div style={{ color: usingLive ? "var(--positive)" : "var(--dt-text-3)" }}>
              {usingLive ? "● LIVE" : "○ CACHED"} · 17 INDICATORS · 24H CACHE
            </div>
          </div>
        </div>
      </div>

      {/* ── Fastest Movers ── */}
      <FastestMovers
        countries={countries}
        onSortClick={() => { setSort("trajectory_gain"); scrollToGrid(); }}
      />

      {/* ── Filter bar ── */}
      <section style={{ background: "var(--dt-bg)", padding: "0 48px 24px" }} ref={gridRef}>
        <FilterBar
          search={search} region={region} sort={sort} tier={tier} trajectoryFilter={trajectoryFilter}
          onSearch={setSearch} onRegion={setRegion} onSort={setSort} onTier={setTier} onTrajectoryFilter={setTrajectory}
          total={countries.length} filtered={filtered.length}
          usingLive={usingLive} liveCount={liveCount}
        />

        {/* View + actions row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" as const }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", letterSpacing: "0.12em", fontWeight: 600 }}>VIEW</span>
          {(["grid", "table"] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? "var(--signal)" : "transparent",
              color: view === v ? "#fff" : "var(--dt-text-2)",
              border: `1px solid ${view === v ? "var(--signal)" : "var(--dt-border)"}`,
              padding: "5px 12px",
              fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
              cursor: "pointer",
            }}>{v === "grid" ? "Cards" : "Table"}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={shareView} style={{ background: "transparent", border: "1px solid var(--dt-border)", color: "var(--dt-text-2)", padding: "5px 12px", fontFamily: "var(--font-sans)", fontSize: 12, cursor: "pointer" }}>
              Share view ↗
            </button>
            <ExportButton countries={filtered} globalRanks={globalRanks} pillarWeights={{ infrastructure: 20, talent: 20, governance: 20, investment: 20, economic_readiness: 20 }} />
          </div>
        </div>
      </section>

      {/* ── Country Grid ── */}
      <section style={{ background: "var(--dt-bg)", padding: "0 48px 40px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : view === "table" ? (
          <RankingsTable countries={filtered} globalRanks={globalRanks} activeRegion={region} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 48, color: "var(--dt-text-3)", marginBottom: 16 }}>—</div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--dt-text-2)", margin: "0 0 8px" }}>No countries found</p>
            {fuzzySuggestion ? (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--dt-text-3)", margin: 0 }}>
                Did you mean{" "}
                <button onClick={() => setSearch(fuzzySuggestion.name)} style={{ color: "var(--signal)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontFamily: "var(--font-sans)" }}>
                  {fuzzySuggestion.flag} {fuzzySuggestion.name}
                </button>?
              </p>
            ) : (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--dt-text-3)", margin: 0 }}>Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <>
            {/* Top 4: leader cards */}
            {filtered.slice(0, 4).length > 0 && (
              <>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 14, paddingTop: 8 }}>
                  TOP {Math.min(4, filtered.length)} · LEADER FORMAT
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--dt-border)", marginBottom: 32 }}>
                  {filtered.slice(0, 4).map((c) => (
                    <CountryCard
                      key={c.slug} country={c} rank={globalRanks[c.slug] ?? 0}
                      variant="leader"
                      isComparing={compareList.includes(c.slug)} onCompareToggle={toggleCompare}
                      isWatchlisted={watchlist.includes(c.slug)} onWatchlistToggle={toggleWatchlist}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Rank 5+: dense cards */}
            {filtered.slice(4).length > 0 && (
              <>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 14 }}>
                  RANKS {Math.min(5, filtered.length + 1)}–{filtered.length} · DENSE FORMAT
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, paddingBottom: compareList.length ? 96 : 0 }}>
                  {filtered.slice(4).map((c) => (
                    <CountryCard
                      key={c.slug} country={c} rank={globalRanks[c.slug] ?? 0}
                      variant="dense"
                      isComparing={compareList.includes(c.slug)} onCompareToggle={toggleCompare}
                      isWatchlisted={watchlist.includes(c.slug)} onWatchlistToggle={toggleWatchlist}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* ── Regional Bands ── */}
      {!loading && (
        <section style={{ background: "var(--dt-bg)", padding: "32px 48px 48px", borderTop: "1px solid var(--dt-border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 48 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--signal)", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 6 }}>REGIONAL AVERAGE</div>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, color: "var(--dt-text-0)", margin: 0, letterSpacing: "-0.015em" }}>
                How regions compare on overall readiness.
              </h4>
            </div>
            <div>
              {REGIONS_DISPLAY.map((r) => {
                const avg = regionalAvg(countries, r);
                return (
                  <div key={r} style={{ display: "grid", gridTemplateColumns: "220px 1fr 56px", gap: 16, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--dt-border)" }}>
                    <button onClick={() => { setRegion(r); scrollToGrid(); }} style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--dt-text-0)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", textAlign: "left" as const, padding: 0 }}>
                      {r}
                    </button>
                    <div style={{ position: "relative", height: 8, background: "var(--dt-raised)" }}>
                      <div style={{ position: "absolute", inset: 0, width: `${avg}%`, background: "var(--signal)" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--dt-text-0)", fontWeight: 500, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{avg}/100</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER — editorial, light
      ══════════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: "var(--ed-bg)", padding: "64px 48px 32px", borderTop: "8px solid var(--signal)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <h5 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, color: "var(--ed-text-0)", margin: "0 0 8px", letterSpacing: "-0.015em" }}>
              The AI Trajectory Index
            </h5>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 15, fontStyle: "italic", color: "var(--ed-text-1)", margin: "0 0 16px", lineHeight: 1.5, maxWidth: 380 }}>
              Tracking which nations are winning the AI race — and why. Built by Ankit Mishra, independent research at the intersection of AI governance and emerging markets.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ed-text-1)", borderBottom: "1px solid var(--ed-text-1)", paddingBottom: 1, textDecoration: "none" }}>ankitmishra.ca ↗</a>
              <a href="https://linkedin.com/in/ankitmishra01" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ed-text-1)", borderBottom: "1px solid var(--ed-text-1)", paddingBottom: 1, textDecoration: "none" }}>LinkedIn ↗</a>
            </div>
          </div>
          {[
            { title: "Sections", items: [{ label: "Index", href: "/" }, { label: "Map", href: "/map" }, { label: "Compare", href: "/compare" }, { label: "Adoption", href: "/adoption" }, { label: "Methodology", href: "/methodology" }] },
            { title: "Regions", items: [{ label: "Americas", href: "/americas" }, { label: "Europe", href: "/europe" }, { label: "Asia-Pacific", href: "/asia-pacific" }, { label: "Middle East", href: "/middle-east" }, { label: "Africa", href: "/africa" }] },
            { title: "Sources", items: [{ label: "World Bank", href: "#" }, { label: "OECD AI Observatory", href: "#" }, { label: "World Governance Indicators", href: "#" }, { label: "OECD AI Policy", href: "#" }, { label: "Anthropic Index", href: "#" }] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--signal)", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 14 }}>{col.title.toUpperCase()}</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {col.items.map((it) => (
                  <Link key={it.label} href={it.href}
                    style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ed-text-1)", textDecoration: "none" }}>
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--ed-border-strong)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ed-text-2)" }}>
            © {new Date().getFullYear()} · INDEPENDENT RESEARCH · MIT LICENCE
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ed-text-2)" }}>
            CITE: <span style={{ color: "var(--ed-text-0)" }}>Mishra, A. ({new Date().getFullYear()}). AI Trajectory Index.</span>
          </div>
        </div>
      </footer>

      {/* ── Comparison Panel ── */}
      <ComparisonPanel
        selected={compareCountries}
        onRemove={(slug) => setCompareList((p) => p.filter((s) => s !== slug))}
        onClear={() => setCompareList([])}
      />

      {/* ── Toasts ── */}
      {shareToast && (
        <div className="fade-up" style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 60, padding: "10px 16px",
          background: "var(--dt-surface)", border: "1px solid var(--signal)",
          color: "var(--dt-text-0)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 24px rgba(0,0,0,.6)", pointerEvents: "none",
        }}>
          Link copied to clipboard.
        </div>
      )}
      {compareToast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 60, padding: "10px 16px",
          background: "var(--dt-surface)", border: "1px solid var(--dt-border)",
          color: "var(--dt-text-0)", fontFamily: "var(--font-sans)", fontSize: 13,
          boxShadow: "0 4px 24px rgba(0,0,0,.6)", pointerEvents: "none",
        }}>
          Max 3 countries in comparison.
        </div>
      )}
    </main>
  );
}
