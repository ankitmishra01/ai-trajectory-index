"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import ScoreGauge from "@/components/ScoreGauge";
import DimensionBar from "@/components/DimensionBar";
import TrajectoryArrow from "@/components/TrajectoryArrow";
import staticData from "@/data/countries.json";
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

export default function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [openDim, setOpenDim] = useState<string | null>(null);

  const staticCountry = staticData.countries.find((c) => c.slug === slug);
  const [country, setCountry] = useState<ScoredCountry | null>(
    staticCountry ? { ...staticCountry, data_source: "fallback" as const } : null
  );
  const [allCountries, setAllCountries] = useState<ScoredCountry[]>(
    staticData.countries.map((c) => ({ ...c, data_source: "fallback" as const }))
  );
  const [narrative, setNarrative] = useState<NarrativeState>({ status: "idle", paragraphs: [] });

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

  if (!country) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <p className="text-6xl mb-4">🌐</p>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-1)" }}>Country not found</h1>
          <Link href="/" className="text-sm hover:text-blue-300 transition-colors" style={{ color: "var(--accent)" }}>
            ← Back to index
          </Link>
        </div>
      </main>
    );
  }

  const comparables = country.comparable_countries
    .map((s) => allCountries.find((c) => c.slug === s))
    .filter(Boolean) as ScoredCountry[];

  const ranked = [...allCountries].sort((a, b) => b.total_score - a.total_score);
  const rank   = ranked.findIndex((c) => c.slug === slug) + 1;
  const delta  = country.projected_score_2028 - country.total_score;

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
          {country.data_source === "live" && (
            <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: "rgba(74,222,128,.7)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live data
            </span>
          )}
        </div>
      </header>

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
                      #{rank} globally
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>{country.region}</p>
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

        {/* Score Breakdown */}
        <div className="card rounded-2xl p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: "var(--text-3)" }}>
            Pillar Scores
          </h2>
          <div className="space-y-5">
            {Object.entries(country.scores).map(([key, val]) => (
              <DimensionBar key={key} label={DIM_LABELS[key]} score={val.score} height={12} showScore />
            ))}
          </div>
        </div>

        {/* Trajectory + Accelerator/Risk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
              Trajectory Outlook
            </h2>
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
        </div>

        {/* Dimension Detail */}
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
        </div>

        {/* AI Narrative */}
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
                  Gemini via OpenRouter
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
                <p className="text-sm text-amber-400/90">Analysis temporarily unavailable. Check back shortly.</p>
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
        </div>

        {/* Comparable Countries */}
        {comparables.length > 0 && (
          <div className="card rounded-2xl p-6 sm:p-8">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
              Similar Trajectory
            </h2>
            <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
              Countries on a comparable AI development path
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
