"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import ScoreGauge from "@/components/ScoreGauge";
import DimensionBar from "@/components/DimensionBar";
import TrajectoryArrow from "@/components/TrajectoryArrow";
import CountryNewsFeed from "@/components/CountryNewsFeed";
import CountryRoadmap from "@/components/CountryRoadmap";
import ScoreSparkline from "@/components/ScoreSparkline";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import CountryChat from "@/components/CountryChat";
import PolicyGapAnalyser from "@/components/PolicyGapAnalyser";
import DualRadar from "@/components/DualRadar";
import staticData from "@/data/countries.json";
import adoptionData from "@/data/adoption.json";
import { TIER_COLORS, DIM_LABELS as ADOPT_DIM_LABELS, DIM_COLORS as ADOPT_DIM_COLORS } from "@/lib/adoption";
import type { AdoptionEntry } from "@/lib/adoption";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";

const DIM_LABELS: Record<string, string> = {
  infrastructure:    "Infrastructure",
  talent:            "Talent",
  governance:        "Governance",
  investment:        "Investment",
  economic_readiness:"Economic Readiness",
};
const DIM_DESC: Record<string, string> = {
  infrastructure:    "Physical and digital infrastructure: data centres, connectivity, compute capacity.",
  talent:            "AI talent pipeline: researchers, engineers, and the university ecosystem supplying them.",
  governance:        "AI policy frameworks, regulatory clarity, and government strategy maturity.",
  investment:        "Public and private capital flowing into AI — VC, government spending, and R&D.",
  economic_readiness:"Economy's capacity to adopt and commercialise AI across sectors.",
};

interface NarrativeState {
  status: "idle" | "loading" | "done" | "error";
  paragraphs: string[];
  generatedAt?: string;
  error?: string;
}

type PageTab = "readiness" | "adoption" | "combined";

interface Props {
  slug: string;
  initialCountry: ScoredCountry;
}

export default function CountryPageClient({ slug, initialCountry }: Props) {
  const [openDim, setOpenDim]   = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PageTab>("combined");
  const [country, setCountry]   = useState<ScoredCountry>(initialCountry);
  const urlInitRef = useRef(false);

  const adoption = (adoptionData.countries as AdoptionEntry[]).find((a) => a.slug === slug) ?? null;
  const [allCountries, setAllCountries] = useState<ScoredCountry[]>(
    staticData.countries.map((c) => ({ ...c, data_source: "fallback" as const, wb_data_year: null }))
  );
  const [narrative, setNarrative] = useState<NarrativeState>({ status: "idle", paragraphs: [] });
  const [copied, setCopied]       = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  // Read tab from URL on mount
  useEffect(() => {
    if (typeof window === "undefined" || urlInitRef.current) return;
    urlInitRef.current = true;
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "readiness" || t === "adoption" || t === "combined") setActiveTab(t);
  }, []);

  // Write tab to URL on change
  useEffect(() => {
    if (!urlInitRef.current) return;
    const p = new URLSearchParams(window.location.search);
    if (activeTab === "combined") p.delete("tab");
    else p.set("tab", activeTab);
    const qs = p.toString();
    window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
  }, [activeTab]);

  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then((data: ScoresResponse) => {
        setAllCountries(data.countries);
        const live = data.countries.find((c) => c.slug === slug);
        if (live) setCountry(live);
      })
      .catch(() => {});
  }, [slug]);

  const fetchNarrative = async () => {
    setNarrative({ status: "loading", paragraphs: [] });
    try {
      const res  = await fetch(`/api/narrative/${slug}`);
      const data = await res.json();
      if (data.error) setNarrative({ status: "error", paragraphs: [], error: data.error });
      else setNarrative({ status: "done", paragraphs: data.paragraphs, generatedAt: data.generatedAt });
    } catch {
      setNarrative({ status: "error", paragraphs: [], error: "Network error — please try again." });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Dynamic comparable countries by 5-dimension Euclidean distance
  const comparables = useMemo(() => {
    const keys = ["infrastructure", "talent", "governance", "investment", "economic_readiness"] as const;
    function dist(a: ScoredCountry, b: ScoredCountry) {
      return Math.sqrt(keys.reduce((sum, k) => sum + (a.scores[k].score - b.scores[k].score) ** 2, 0));
    }
    return [...allCountries]
      .filter((c) => c.slug !== slug)
      .sort((a, b) => dist(country, a) - dist(country, b))
      .slice(0, 4);
  }, [allCountries, country, slug]);

  const ranked       = [...allCountries].sort((a, b) => b.total_score - a.total_score);
  const globalRank   = ranked.findIndex((c) => c.slug === slug) + 1;
  const regionPeers  = ranked.filter((c) => c.region === country.region);
  const regionRank   = regionPeers.findIndex((c) => c.slug === slug) + 1;
  const delta        = country.projected_score_2028 - country.total_score;
  const liveScoreDelta = country.data_source === "live" ? country.total_score - initialCountry.total_score : 0;
  const liveChanged    = country.data_source === "live" && liveScoreDelta !== 0;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="page-glow" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.92)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="text-sm flex items-center gap-1.5 transition-colors hover:text-white"
            style={{ color: "var(--text-3)" }}>
            ← Index
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Country Profile
          </span>
          <div className="ml-auto flex items-center gap-3">
            {country.data_source === "live" && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(74,222,128,.7)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live data
              </span>
            )}
            <Link href={`/compare/${slug}/usa`}
              className="no-print hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "var(--raised)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              ⚔ Compare
            </Link>
            <button
              onClick={() => window.print()}
              className="no-print hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "var(--raised)", color: "var(--text-2)", border: "1px solid var(--border)" }}
              title="Print / Export PDF"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={() => setEmbedOpen((o) => !o)}
              className="no-print hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "var(--raised)", color: "var(--text-2)", border: "1px solid var(--border)" }}
            >
              {"</>"}  Embed
            </button>
            <button
              onClick={handleCopyLink}
              className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                copied
                  ? { background: "rgba(34,197,94,.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,.25)" }
                  : { background: "var(--raised)", color: "var(--text-2)", border: "1px solid var(--border)" }
              }
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>
      </header>

      {/* Embed modal */}
      {embedOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEmbedOpen(false); }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border-mid)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>Embed Widget</h3>
              <button onClick={() => setEmbedOpen(false)} className="text-sm transition-colors hover:text-white"
                style={{ color: "var(--text-3)" }}>×</button>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
              Copy this code to embed the {country.name} live scorecard on any webpage.
            </p>
            <div className="rounded-xl p-3 mb-4 font-mono text-xs overflow-x-auto"
              style={{ background: "var(--raised)", border: "1px solid var(--border)", color: "#93c5fd", whiteSpace: "pre-wrap" }}>
              {`<iframe\n  src="https://ai-index.ankitmishra.ca/widget/${slug}"\n  width="320"\n  height="280"\n  frameborder="0"\n  style="border-radius:12px;"\n  title="${country.name} — AI Trajectory Index"\n></iframe>`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe\n  src="https://ai-index.ankitmishra.ca/widget/${slug}"\n  width="320"\n  height="280"\n  frameborder="0"\n  style="border-radius:12px;"\n  title="${country.name} — AI Trajectory Index"\n></iframe>`);
                  setEmbedOpen(false);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "var(--accent)", color: "#fff" }}>
                Copy code
              </button>
              <a href={`/widget/${slug}`} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "var(--raised)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                Preview ↗
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-5">

        {/* Hero */}
        <div className="card shine-on-hover rounded-2xl p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,.3), transparent)" }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(59,130,246,.07) 0%, transparent 70%)" }} />

          <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-6xl">{country.flag}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-black font-serif-display" style={{ color: "var(--text-1)" }}>
                      {country.name}
                    </h1>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--raised)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
                      #{globalRank} globally
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-sm" style={{ color: "var(--text-3)" }}>{country.region}</p>
                    {regionRank > 0 && (
                      <>
                        <span style={{ color: "var(--border)" }}>·</span>
                        <p className="text-sm" style={{ color: "var(--text-3)" }}>
                          #{regionRank} in {country.region}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <TrajectoryArrow label={country.trajectory_label} score={country.trajectory_score} size="md" />
            </div>
            <div className="flex-shrink-0">
              <ScoreGauge score={country.total_score} size={180} />
              <p className="text-center text-xs mt-1" style={{ color: "var(--text-3)" }}>AI Readiness Score</p>
            </div>
          </div>
        </div>

        {/* What changed banner */}
        {liveChanged && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3 text-sm fade-up"
            style={{
              background: liveScoreDelta > 0 ? "rgba(34,197,94,.06)" : "rgba(245,158,11,.06)",
              border: `1px solid ${liveScoreDelta > 0 ? "rgba(34,197,94,.22)" : "rgba(245,158,11,.22)"}`,
            }}>
            <span className="text-base flex-shrink-0" style={{ color: liveScoreDelta > 0 ? "#4ade80" : "#f59e0b" }}>
              {liveScoreDelta > 0 ? "▲" : "▼"}
            </span>
            <span style={{ color: "var(--text-2)" }}>
              Live World Bank data refreshed this score:{" "}
              <span className="font-semibold" style={{ color: "var(--text-1)" }}>
                {initialCountry.total_score} → {country.total_score}
              </span>{" "}
              <span className="font-bold" style={{ color: liveScoreDelta > 0 ? "#4ade80" : "#f59e0b" }}>
                ({liveScoreDelta > 0 ? "+" : ""}{liveScoreDelta} pts)
              </span>
            </span>
          </div>
        )}

        {/* Tab toggle */}
        {adoption && (
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex rounded-2xl p-1 gap-1"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {([
                { key: "combined",  label: "Combined View" },
                { key: "readiness", label: "Readiness" },
                { key: "adoption",  label: "Adoption" },
              ] as { key: PageTab; label: string }[]).map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={activeTab === key
                    ? { background: "var(--accent)", color: "#fff" }
                    : { color: "var(--text-3)", background: "transparent" }
                  }>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
              {activeTab === "combined"  && "Readiness = capacity to build AI · Adoption = AI actually in use today"}
              {activeTab === "readiness" && "Infrastructure, talent, governance, investment & economic capacity"}
              {activeTab === "adoption"  && "Government deployment, enterprise, consumer usage, talent demand & R&D pipeline"}
            </p>
          </div>
        )}

        {/* Combined view: side-by-side score cards */}
        {adoption && (activeTab === "combined") && (() => {
          const gap = adoption.adoption_gap;
          const tierStyle = TIER_COLORS[adoption.adoption_tier] ?? TIER_COLORS["Nascent Adoption"];
          const gapStatement = Math.abs(gap) <= 2
            ? `${country.name} is deploying AI roughly in line with its readiness capacity.`
            : gap > 0
            ? `${country.name}'s adoption score (${adoption.adoption_total}) is ${gap} points above its readiness score (${country.total_score}) — deploying AI faster than its capacity would predict.`
            : `${country.name}'s adoption score (${adoption.adoption_total}) is ${Math.abs(gap)} points below its readiness score (${country.total_score}) — significant untapped capacity not yet being deployed.`;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Readiness card */}
                <div className="card rounded-2xl p-5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">📊</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Readiness Score</p>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>Can this country build AI?</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black" style={{ color: "var(--accent)" }}>{country.total_score}</span>
                    <span className="text-sm pb-1" style={{ color: "var(--text-3)" }}>/100</span>
                  </div>
                  <TrajectoryArrow label={country.trajectory_label} score={country.trajectory_score} size="sm" />
                </div>
                {/* Adoption card */}
                <div className="card rounded-2xl p-5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">🚀</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Adoption Score</p>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>Is this country using AI now?</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black" style={{ color: tierStyle.color }}>{adoption.adoption_total}</span>
                    <span className="text-sm pb-1" style={{ color: "var(--text-3)" }}>/100</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                    style={{ background: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}` }}>
                    {adoption.adoption_tier}
                  </span>
                </div>
              </div>
              {/* Gap statement */}
              <div className="rounded-2xl p-4"
                style={{
                  background: Math.abs(gap) <= 2 ? "rgba(148,163,184,.05)" : gap > 0 ? "rgba(74,222,128,.05)" : "rgba(245,158,11,.05)",
                  border: `1px solid ${Math.abs(gap) <= 2 ? "rgba(148,163,184,.18)" : gap > 0 ? "rgba(74,222,128,.22)" : "rgba(245,158,11,.22)"}`,
                }}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{gapStatement}</p>
              </div>
              <DualRadar country={country} adoption={adoption} />
            </div>
          );
        })()}

        {/* Score Breakdown — hidden on pure adoption tab */}
        {(!adoption || activeTab !== "adoption") && (
          <div className="card rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Pillar Scores
              </h2>
              {country.wb_data_year && (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--raised)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
                  WB data through {country.wb_data_year}
                </span>
              )}
            </div>
            <div className="space-y-5">
              {Object.entries(country.scores).map(([key, val]) => (
                <DimensionBar key={key} label={DIM_LABELS[key]} score={val.score} height={12} showScore />
              ))}
            </div>
          </div>
        )}

        {/* Adoption dimension breakdown — shown on adoption + combined tabs */}
        {adoption && activeTab !== "readiness" && (() => {
          const dims = Object.entries(adoption.adoption_scores) as [keyof typeof adoption.adoption_scores, number][];
          const tierStyle = TIER_COLORS[adoption.adoption_tier] ?? TIER_COLORS["Nascent Adoption"];
          const maxScore = Math.max(...dims.map(([, v]) => v));
          const minScore = Math.min(...dims.map(([, v]) => v));
          return (
            <div className="card rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  Adoption Dimension Breakdown
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}` }}>
                  {adoption.adoption_tier}
                </span>
              </div>
              <div className="space-y-4">
                {dims.map(([key, score]) => {
                  const isMax = score === maxScore;
                  const isMin = score === minScore;
                  const color = ADOPT_DIM_COLORS[key];
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                            {ADOPT_DIM_LABELS[key]}
                          </span>
                          {isMax && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(74,222,128,.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,.25)" }}>Strongest</span>}
                          {isMin && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(245,158,11,.10)", color: "#f59e0b", border: "1px solid rgba(245,158,11,.25)" }}>Weakest</span>}
                        </div>
                        <span className="text-sm font-black" style={{ color: "var(--text-1)" }}>{score}/20</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--raised)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(score / 20) * 100}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] mt-4 pt-3" style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
                {adoption.top_adoption_driver}
              </p>
            </div>
          );
        })()}

        {/* Trajectory + Accelerator/Risk — hidden on pure adoption tab */}
        {(!adoption || activeTab !== "adoption") && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Trajectory Outlook
              </h2>
              <ScoreSparkline score={country.total_score} trajectory={country.trajectory_score} width={72} height={24} />
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-black leading-none" style={{ color: "var(--accent)" }}>
                {country.projected_score_2028}
              </span>
              <div>
                <span className="text-sm" style={{ color: "var(--text-3)" }}>/100</span>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>by 2028</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: "var(--text-3)" }}>{country.total_score} now</span>
              <span style={{ color: "var(--accent)" }}>→</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={
                  delta > 0
                    ? { background: "rgba(34,197,94,.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,.25)" }
                    : delta < 0
                    ? { background: "rgba(239,68,68,.10)", color: "#f87171", border: "1px solid rgba(239,68,68,.25)" }
                    : { background: "var(--raised)", color: "var(--text-3)", border: "1px solid var(--border)" }
                }>
                {delta > 0 ? "+" : ""}{delta} pts
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl p-5" style={{ background: "rgba(34,197,94,.05)", border: "1px solid rgba(34,197,94,.20)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-400">▲</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Top Accelerator</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(134,239,172,.85)" }}>
                {country.top_accelerator}
              </p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.20)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400">▼</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Top Risk</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(252,165,165,.85)" }}>
                {country.top_risk}
              </p>
            </div>
          </div>
        </div>}

        {/* Dimension Detail — hidden on adoption tab */}
        {(!adoption || activeTab !== "adoption") &&
        <div className="card rounded-2xl overflow-hidden">
          <div className="px-6 sm:px-8 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Pillar Detail
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
              Click any pillar to see supporting indicators and evidence
            </p>
          </div>
          <div>
            {Object.entries(country.scores).map(([key, val]) => {
              const isOpen = openDim === key;
              return (
                <div key={key} style={{ borderBottom: "1px solid var(--border)" }}>
                  <button
                    className="w-full px-6 sm:px-8 py-4 flex items-center gap-4 text-left transition-colors"
                    style={{ background: isOpen ? "rgba(59,130,246,.04)" : "transparent" }}
                    onMouseEnter={(e) => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "var(--raised)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isOpen ? "rgba(59,130,246,.04)" : "transparent"; }}
                    onClick={() => setOpenDim(isOpen ? null : key)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                          {DIM_LABELS[key]}
                        </span>
                        <span className="text-sm font-bold mr-8" style={{ color: "var(--accent)" }}>
                          {val.score}/20
                        </span>
                      </div>
                      <DimensionBar label={DIM_LABELS[key]} score={val.score} height={6} showScore={false} />
                    </div>
                    <span className={`text-sm flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      style={{ color: "var(--text-3)" }}>↓</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 sm:px-8 pb-5" style={{ background: "rgba(6,11,20,.5)" }}>
                      <p className="text-xs italic mb-3" style={{ color: "var(--text-3)" }}>{DIM_DESC[key]}</p>
                      <ul className="space-y-2">
                        {val.reasons.map((r, i) => (
                          <li key={i} className="flex gap-3 items-start text-sm" style={{ color: "var(--text-2)" }}>
                            <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }}>·</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>}

        {/* What-If Simulator — hidden on adoption tab */}
        {(!adoption || activeTab !== "adoption") && (
          <WhatIfSimulator country={country} allCountries={allCountries} />
        )}

        {/* Policy Gap Analyser — hidden on adoption tab */}
        {(!adoption || activeTab !== "adoption") && (
          <PolicyGapAnalyser country={country} allCountries={allCountries} />
        )}

        {/* AI Narrative — hidden on adoption tab */}
        {(!adoption || activeTab !== "adoption") &&
        <div className="card rounded-2xl overflow-hidden">
          <div className="px-6 sm:px-8 py-5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  AI Analysis
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(59,130,246,.10)", border: "1px solid rgba(59,130,246,.22)", color: "var(--accent)" }}>
                  via OpenRouter
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                Current State · Trajectory · Outlook
              </p>
            </div>
            {(narrative.status === "idle" || narrative.status === "error") && (
              <button onClick={fetchNarrative} className="btn-primary flex items-center gap-2 px-4 py-2 text-xs rounded-xl">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate AI Analysis
              </button>
            )}
            {narrative.status === "loading" && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-2" style={{ color: "var(--accent)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.4s]" />
                <span className="ml-1">Analysing {country.name}…</span>
              </div>
            )}
          </div>

          <div className="px-6 sm:px-8 py-6">
            {narrative.status === "idle" && (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-3)" }}>
                Click &ldquo;Generate AI Analysis&rdquo; for a strategic assessment of {country.name}&apos;s AI trajectory.
              </p>
            )}
            {narrative.status === "loading" && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 rounded-full w-full skeleton" />
                <div className="h-4 rounded-full w-5/6 skeleton" />
                <div className="h-4 rounded-full w-4/5 skeleton" />
              </div>
            )}
            {narrative.status === "error" && (
              <div className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.22)" }}>
                <span className="text-amber-400 mt-0.5">⚠</span>
                <div>
                  <p className="text-sm text-amber-400/90 mb-1">
                    {narrative.error?.includes("not configured")
                      ? "OpenRouter API key is not set — add OPENROUTER_API_KEY to your Vercel environment variables."
                      : narrative.error?.includes("All models")
                      ? "All free AI models are currently rate-limited. Try again in a few minutes."
                      : (narrative.error ?? "Analysis temporarily unavailable.")}
                  </p>
                  {narrative.error && !narrative.error.includes("not configured") && (
                    <p className="text-[10px] text-amber-400/50">Detail: {narrative.error}</p>
                  )}
                </div>
              </div>
            )}
            {narrative.status === "done" && narrative.paragraphs.length > 0 && (
              <div className="space-y-6 fade-up">
                {[
                  { label: "Current State", i: 0 },
                  { label: "Trajectory",    i: 1 },
                  { label: "Outlook",       i: 2 },
                ]
                  .filter(({ i }) => narrative.paragraphs[i])
                  .map(({ label, i }) => (
                    <div key={label} className="pl-4" style={{ borderLeft: "2px solid rgba(59,130,246,.40)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: "rgba(96,165,250,.7)" }}>{label}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                        {narrative.paragraphs[i]}
                      </p>
                    </div>
                  ))}
                <p className="text-[11px] pt-2" style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
                  Analysis generated by AI based on World Bank and OECD data. Updated weekly.
                  {narrative.generatedAt && (
                    <> · Generated {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
                      .format(new Date(narrative.generatedAt))}</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>}

        {/* AI Development Roadmap — hidden on adoption tab */}
        {(!adoption || activeTab !== "adoption") && <CountryRoadmap country={country} />}

        {/* Live News Feed */}
        <CountryNewsFeed slug={slug} countryName={country.name} />

        {/* AI Q&A Chat */}
        <CountryChat country={country} />

        {/* Comparable Countries */}
        {comparables.length > 0 && (
          <div className="card rounded-2xl p-6 sm:p-8">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
              Most Similar Countries
            </h2>
            <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
              Nearest neighbours by 5-pillar Euclidean distance
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {comparables.map((comp) => (
                <Link key={comp.slug} href={`/country/${comp.slug}`}
                  className="card shine-on-hover flex items-center gap-4 p-4 rounded-xl group transition-all duration-200">
                  <span className="text-3xl">{comp.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate transition-colors group-hover:text-blue-300"
                      style={{ color: "var(--text-1)" }}>
                      {comp.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                      {comp.total_score}/100 · {comp.trajectory_label}
                    </p>
                  </div>
                  <span className="text-sm transition-colors group-hover:text-blue-400" style={{ color: "var(--text-3)" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 mt-4 text-center space-y-1"
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
