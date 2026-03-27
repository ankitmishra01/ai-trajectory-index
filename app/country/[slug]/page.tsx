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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CountryPage({ params }: PageProps) {
  const { slug } = use(params);
  const [openDimension, setOpenDimension] = useState<string | null>(null);

  // Start with static data for instant render, then upgrade to live scores
  const staticCountry = staticData.countries.find((c) => c.slug === slug);
  const [country, setCountry] = useState<ScoredCountry | null>(
    staticCountry ? { ...staticCountry, data_source: "fallback" as const } : null
  );
  const [allCountries, setAllCountries] = useState<ScoredCountry[]>(
    staticData.countries.map((c) => ({ ...c, data_source: "fallback" as const }))
  );

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

  if (!country) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
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

  return (
    <main className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <header className="border-b border-[#1c2847] sticky top-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Back
          </Link>
          <span className="text-[#1c2847]">|</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            AI Trajectory Index
          </span>
          {country.data_source === "live" && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live data
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Hero: Country name + score */}
        <div className="bg-[#0f1628] border border-[#1c2847] rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl">{country.flag}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-black text-white">
                      {country.name}
                    </h1>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1c2847] text-slate-400 border border-[#1c2847]">
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
              <p className="text-center text-xs text-slate-500 mt-1">
                Current Score
              </p>
            </div>
          </div>
        </div>

        {/* Dimension Breakdown */}
        <div className="bg-[#0f1628] border border-[#1c2847] rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white mb-6">
            Score Breakdown
          </h2>
          <div className="space-y-5">
            {Object.entries(country.scores).map(([key, val]) => (
              <DimensionBar
                key={key}
                label={DIMENSION_LABELS[key]}
                score={val.score}
                height={10}
                showScore
              />
            ))}
          </div>
        </div>

        {/* Trajectory Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Projected */}
          <div className="bg-[#0f1628] border border-[#1c2847] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Trajectory Outlook
            </h2>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-black text-blue-400">
                {country.projected_score_2028}
              </span>
              <span className="text-slate-500 mb-1">/ 100 by 2028</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>From {country.total_score}</span>
              <span className="text-blue-500">→</span>
              <span className="text-blue-400 font-semibold">
                {country.projected_score_2028}
              </span>
              <span className="text-xs ml-auto px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                {country.projected_score_2028 > country.total_score ? "+" : ""}
                {country.projected_score_2028 - country.total_score} pts
              </span>
            </div>
          </div>

          {/* Accelerator / Risk */}
          <div className="space-y-4">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-400 text-lg">▲</span>
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  Top Accelerator
                </h3>
              </div>
              <p className="text-sm text-emerald-300/90 leading-relaxed">
                {country.top_accelerator}
              </p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400 text-lg">▼</span>
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                  Top Risk
                </h3>
              </div>
              <p className="text-sm text-red-300/90 leading-relaxed">
                {country.top_risk}
              </p>
            </div>
          </div>
        </div>

        {/* Dimension Detail Accordions */}
        <div className="bg-[#0f1628] border border-[#1c2847] rounded-2xl overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-[#1c2847]">
            <h2 className="text-lg font-bold text-white">Dimension Detail</h2>
            <p className="text-xs text-slate-500 mt-1">
              Click any dimension to see the supporting evidence
            </p>
          </div>
          <div className="divide-y divide-[#1c2847]">
            {Object.entries(country.scores).map(([key, val]) => {
              const isOpen = openDimension === key;
              return (
                <div key={key}>
                  <button
                    className="w-full px-6 sm:px-8 py-4 flex items-center gap-4 hover:bg-[#111827] transition-colors text-left"
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
                      className={`text-slate-500 text-lg transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ↓
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 sm:px-8 pb-5 bg-[#0a0f1e]/40">
                      <p className="text-xs text-slate-500 mb-3 italic">
                        {DIMENSION_DESCRIPTIONS[key]}
                      </p>
                      <ul className="space-y-2">
                        {val.reasons.map((reason, i) => (
                          <li
                            key={i}
                            className="flex gap-3 items-start text-sm text-slate-300"
                          >
                            <span className="text-blue-400 mt-0.5 flex-shrink-0">
                              ·
                            </span>
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

        {/* Comparable Countries */}
        {comparables.length > 0 && (
          <div className="bg-[#0f1628] border border-[#1c2847] rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-2">
              Similar Trajectory
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Countries on a comparable AI development path
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {comparables.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/country/${comp.slug}`}
                  className="flex items-center gap-4 p-4 bg-[#0a0f1e] border border-[#1c2847] rounded-xl hover:border-blue-500/40 hover:bg-[#0f1628] transition-all duration-200 group"
                >
                  <span className="text-3xl">{comp.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      {comp.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Score: {comp.total_score}/100 · Trajectory:{" "}
                      {comp.trajectory_label}
                    </p>
                  </div>
                  <span className="text-slate-600 group-hover:text-blue-400 transition-colors">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Narrative — Phase 3 Placeholder */}
        <div className="bg-[#0f1628] border border-[#1c2847] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                Coming in Phase 3
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">AI Narrative</h2>
            <p className="text-sm text-slate-400 mb-5">
              A real-time AI-generated strategic analysis of this country&apos;s
              AI trajectory — powered by Gemini via OpenRouter.
            </p>
            <button
              disabled
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1c2847] text-slate-500 text-sm font-semibold cursor-not-allowed border border-[#1c2847] opacity-60"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate Analysis
            </button>
          </div>
        </div>
      </div>

      <footer className="max-w-4xl mx-auto px-4 sm:px-6 py-8 mt-4 border-t border-[#1c2847] text-center space-y-1">
        <p className="text-xs text-slate-500">
          Data: World Bank API · OECD AI Policy Observatory · Scores updated daily.
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
    </main>
  );
}
