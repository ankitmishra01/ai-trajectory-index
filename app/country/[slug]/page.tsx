"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import ScoreGauge from "@/components/ScoreGauge";
import DimensionBar from "@/components/DimensionBar";
import TrajectoryArrow from "@/components/TrajectoryArrow";
import staticData from "@/data/countries.json";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";

const DIMENSION_LABELS: Record<string, string> = {
  infrastructure: "Infrastructure",
  talent: "Talent",
  governance: "Governance",
  investment: "Investment",
  economic_readiness: "Economic Readiness",
};

const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  infrastructure: "Physical and digital infrastructure: data centres, connectivity, compute capacity.",
  talent: "AI talent pipeline: researchers, engineers, and the university ecosystem supplying them.",
  governance: "AI policy frameworks, regulatory clarity, and government strategy maturity.",
  investment: "Public and private capital flowing into AI — VC, government spending, and R&D.",
  economic_readiness: "Economy's capacity to adopt and commercialise AI across sectors.",
};

interface NarrativeState {
  status: "idle" | "loading" | "done" | "error";
  paragraphs: string[];
  generatedAt?: string;
  error?: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CountryPage({ params }: PageProps) {
  const { slug } = use(params);
  const [openDimension, setOpenDimension] = useState<string | null>(null);

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
      .catch(() => {/* keep static fallback */});
  }, [slug]);

  const generateNarrative = async () => {
    setNarrative({ status: "loading", paragraphs: [] });
    try {
      const res = await fetch(`/api/narrative/${slug}`);
      const data = await res.json();
      if (data.error) {
        setNarrative({ status: "error", paragraphs: [], error: data.error });
      } else {
        setNarrative({
          status: "done",
          paragraphs: data.paragraphs,
          generatedAt: data.generatedAt,
        });
      }
    } catch {
      setNarrative({
        status: "error",
        paragraphs: [],
        error: "Network error — please try again.",
      });
    }
  };

  if (!country) {
    return (
      <main className="min-h-screen bg-[#060b14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🌐</p>
          <h1 className="text-2xl font-bold text-white mb-2">Country not found</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to index
          </Link>
        </div>
      </main>
    );
  }

  const comparables = country.comparable_countries
    .map((s) => allCountries.find((c) => c.slug === s))
    .filter(Boolean) as ScoredCountry[];

  const rankedAll = [...allCountries].sort((a, b) => b.total_score - a.total_score);
  const rank = rankedAll.findIndex((c) => c.slug === slug) + 1;

  const scoreDelta = country.projected_score_2028 - country.total_score;

  return (
    <main className="min-h-screen bg-[#060b14]">
      {/* Header */}
      <header className="border-b border-[#1a2540] sticky top-0 z-50 bg-[#060b14]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
          <Link
            href="/"
            className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-1.5"
          >
            ← Index
          </Link>
          <span className="text-[#1a2540]">|</span>
          <span className="text-xs text-slate-600 font-medium uppercase tracking-wider">
            Country Profile
          </span>
          {country.data_source === "live" && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live data
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Hero card */}
        <div className="relative bg-[#0c1322] border border-[#1a2540] rounded-2xl p-6 sm:p-8 overflow-hidden">
          <div className="absolute inset-0 hero-glow pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/25 to-transparent" />

          <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-6xl">{country.flag}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-black text-white font-display">
                      {country.name}
                    </h1>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a2540] text-slate-400 border border-[#243360]">
                      #{rank} globally
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{country.region}</p>
                </div>
              </div>
              <div className="mt-4">
                <TrajectoryArrow
                  label={country.trajectory_label}
                  score={country.trajectory_score}
                  size="md"
                />
              </div>
            </div>
            <div className="flex-shrink-0">
              <ScoreGauge score={country.total_score} size={180} />
              <p className="text-center text-xs text-slate-600 mt-1">AI Readiness Score</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-[#0c1322] border border-[#1a2540] rounded-2xl p-6 sm:p-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
            Score Breakdown
          </h2>
          <div className="space-y-5">
            {Object.entries(country.scores).map(([key, val]) => (
              <DimensionBar
                key={key}
                label={DIMENSION_LABELS[key]}
                score={val.score}
                height={12}
                showScore
              />
            ))}
          </div>
        </div>

        {/* Trajectory + Accelerator/Risk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Projected */}
          <div className="bg-[#0c1322] border border-[#1a2540] rounded-2xl p-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Trajectory Outlook
            </h2>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-black text-blue-400 leading-none">
                {country.projected_score_2028}
              </span>
              <div>
                <span className="text-slate-500 text-sm">/100</span>
                <p className="text-xs text-slate-600">by 2028</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">{country.total_score} now</span>
              <span className="text-blue-500">→</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  scoreDelta > 0
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : scoreDelta < 0
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                }`}
              >
                {scoreDelta > 0 ? "+" : ""}{scoreDelta} pts
              </span>
            </div>
          </div>

          {/* Accelerator / Risk */}
          <div className="space-y-3">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-400">▲</span>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Top Accelerator
                </h3>
              </div>
              <p className="text-sm text-emerald-300/80 leading-relaxed">
                {country.top_accelerator}
              </p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400">▼</span>
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Top Risk
                </h3>
              </div>
              <p className="text-sm text-red-300/80 leading-relaxed">
                {country.top_risk}
              </p>
            </div>
          </div>
        </div>

        {/* Dimension Detail Accordions */}
        <div className="bg-[#0c1322] border border-[#1a2540] rounded-2xl overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-[#1a2540]">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dimension Detail</h2>
            <p className="text-xs text-slate-600 mt-1">
              Click any dimension to see the supporting evidence
            </p>
          </div>
          <div className="divide-y divide-[#1a2540]">
            {Object.entries(country.scores).map(([key, val]) => {
              const isOpen = openDimension === key;
              return (
                <div key={key}>
                  <button
                    className="w-full px-6 sm:px-8 py-4 flex items-center gap-4 hover:bg-[#0e1929] transition-colors text-left"
                    onClick={() => setOpenDimension(isOpen ? null : key)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">
                          {DIMENSION_LABELS[key]}
                        </span>
                        <span className="text-sm font-bold text-blue-400 mr-8">
                          {val.score}/20
                        </span>
                      </div>
                      <DimensionBar
                        label={DIMENSION_LABELS[key]}
                        score={val.score}
                        height={6}
                        showScore={false}
                      />
                    </div>
                    <span
                      className={`text-slate-600 text-sm transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ↓
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 sm:px-8 pb-5 bg-[#060b14]/60">
                      <p className="text-xs text-slate-600 mb-3 italic">
                        {DIMENSION_DESCRIPTIONS[key]}
                      </p>
                      <ul className="space-y-2">
                        {val.reasons.map((reason, i) => (
                          <li
                            key={i}
                            className="flex gap-3 items-start text-sm text-slate-300"
                          >
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">·</span>
                            {reason}
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
        <div className="bg-[#0c1322] border border-[#1a2540] rounded-2xl overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-[#1a2540] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">AI Analysis</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                  Gemini via OpenRouter
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Current State · Trajectory · Outlook
              </p>
            </div>
            {narrative.status === "idle" || narrative.status === "error" ? (
              <button
                onClick={generateNarrative}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all border border-blue-500 hover:border-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.3)]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate AI Analysis
              </button>
            ) : narrative.status === "loading" ? (
              <div className="flex items-center gap-2 text-xs text-blue-400 px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.4s]" />
                <span className="ml-1">Analysing {country.name}…</span>
              </div>
            ) : null}
          </div>

          <div className="px-6 sm:px-8 py-6">
            {narrative.status === "idle" && (
              <p className="text-sm text-slate-600 text-center py-4">
                Click &ldquo;Generate AI Analysis&rdquo; for a strategic assessment of {country.name}&apos;s AI trajectory.
              </p>
            )}

            {narrative.status === "loading" && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-[#1a2540] rounded-full w-full" />
                <div className="h-4 bg-[#1a2540] rounded-full w-5/6" />
                <div className="h-4 bg-[#1a2540] rounded-full w-4/5" />
              </div>
            )}

            {narrative.status === "error" && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <span className="text-amber-400 mt-0.5">⚠</span>
                <p className="text-sm text-amber-400/90">
                  Analysis temporarily unavailable. Check back shortly.
                </p>
              </div>
            )}

            {narrative.status === "done" && narrative.paragraphs.length > 0 && (
              <div className="space-y-6">
                {[
                  { label: "Current State", index: 0 },
                  { label: "Trajectory", index: 1 },
                  { label: "Outlook", index: 2 },
                ]
                  .filter(({ index }) => narrative.paragraphs[index])
                  .map(({ label, index }) => (
                    <div key={label} className="border-l-2 border-blue-500/40 pl-4">
                      <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-widest mb-2">
                        {label}
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {narrative.paragraphs[index]}
                      </p>
                    </div>
                  ))}
                <p className="text-[11px] text-slate-700 pt-2 border-t border-[#1a2540]">
                  Analysis generated by AI based on World Bank and OECD data. Updated weekly.
                  {narrative.generatedAt && (
                    <span className="ml-1">
                      Generated{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(narrative.generatedAt))}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Comparable Countries */}
        {comparables.length > 0 && (
          <div className="bg-[#0c1322] border border-[#1a2540] rounded-2xl p-6 sm:p-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Similar Trajectory
            </h2>
            <p className="text-xs text-slate-600 mb-5">
              Countries on a comparable AI development path
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {comparables.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/country/${comp.slug}`}
                  className="flex items-center gap-4 p-4 bg-[#060b14] border border-[#1a2540] rounded-xl hover:border-blue-500/40 hover:bg-[#0e1929] transition-all duration-200 group"
                >
                  <span className="text-3xl">{comp.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                      {comp.name}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {comp.total_score}/100 · {comp.trajectory_label}
                    </p>
                  </div>
                  <span className="text-slate-700 group-hover:text-blue-400 transition-colors text-sm">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="max-w-4xl mx-auto px-4 sm:px-6 py-8 mt-4 border-t border-[#1a2540] text-center space-y-1">
        <p className="text-xs text-slate-600">
          Data: World Bank API · OECD AI Policy Observatory · Scores updated daily.
        </p>
        <p className="text-xs text-slate-700">
          AI Trajectory Index · Built by{" "}
          <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-400 transition-colors">
            Ankit Mishra
          </a>
        </p>
      </footer>
    </main>
  );
}
