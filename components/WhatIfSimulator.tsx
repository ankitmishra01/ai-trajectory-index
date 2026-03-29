"use client";

import { useState, useMemo, useEffect } from "react";
import type { ScoredCountry } from "@/lib/types";

const PILLARS = [
  { key: "infrastructure",     label: "Infrastructure",     color: "#3b82f6", max: 20 },
  { key: "talent",             label: "Talent",             color: "#8b5cf6", max: 20 },
  { key: "governance",         label: "Governance",         color: "#06b6d4", max: 20 },
  { key: "investment",         label: "Investment",         color: "#f59e0b", max: 20 },
  { key: "economic_readiness", label: "Economic Readiness", color: "#22c55e", max: 20 },
] as const;

interface Props {
  country: ScoredCountry;
  allCountries: ScoredCountry[];
}

function scoreColor(s: number) {
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#93c5fd";
  if (s >= 40) return "#fcd34d";
  return "#fca5a5";
}

export default function WhatIfSimulator({ country, allCountries }: Props) {
  const [open, setOpen] = useState(false);

  const initialScores = useMemo(() => ({
    infrastructure:     country.scores.infrastructure.score,
    talent:             country.scores.talent.score,
    governance:         country.scores.governance.score,
    investment:         country.scores.investment.score,
    economic_readiness: country.scores.economic_readiness.score,
  }), [country]);

  const [scores, setScores] = useState(initialScores);

  // Reset when country changes
  useEffect(() => { setScores(initialScores); }, [initialScores]);

  const hypotheticalTotal = Math.min(100, Math.max(0,
    scores.infrastructure + scores.talent + scores.governance + scores.investment + scores.economic_readiness
  ));

  const ranked = useMemo(
    () => [...allCountries].sort((a, b) => b.total_score - a.total_score),
    [allCountries]
  );
  const currentRank  = ranked.findIndex((c) => c.slug === country.slug) + 1;
  const hypotheticalRank = useMemo(() => {
    const inserted = ranked
      .filter((c) => c.slug !== country.slug)
      .filter((c) => c.total_score > hypotheticalTotal).length + 1;
    return inserted;
  }, [ranked, country.slug, hypotheticalTotal]);

  const scoreDelta = hypotheticalTotal - country.total_score;
  const rankDelta  = currentRank - hypotheticalRank;
  const isDirty    = scoreDelta !== 0;

  function reset() { setScores(initialScores); }

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* Header toggle */}
      <button
        className="w-full px-6 sm:px-8 py-5 flex items-center justify-between text-left"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              What-If Simulator
            </h2>
            {isDirty && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(59,130,246,.12)", color: "var(--accent)", border: "1px solid rgba(59,130,246,.25)" }}>
                Active
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Drag pillars to see how {country.name}&apos;s score and rank would change
          </p>
        </div>
        <span className={`text-sm transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-3)" }}>↓</span>
      </button>

      {open && (
        <div className="px-6 sm:px-8 pb-6">
          {/* Score preview */}
          <div className="flex items-center gap-4 py-4 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Hypothetical Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black" style={{ color: scoreColor(hypotheticalTotal) }}>
                  {hypotheticalTotal}
                </span>
                <span className="text-sm" style={{ color: "var(--text-3)" }}>/100</span>
                {isDirty && (
                  <span className="text-sm font-bold" style={{ color: scoreDelta > 0 ? "#4ade80" : "#f87171" }}>
                    ({scoreDelta > 0 ? "+" : ""}{scoreDelta} pts)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Global Rank</p>
              <div className="flex items-baseline gap-2 justify-end">
                <span className="text-2xl font-black" style={{ color: "var(--text-1)" }}>#{hypotheticalRank}</span>
                {isDirty && rankDelta !== 0 && (
                  <span className="text-sm font-bold" style={{ color: rankDelta > 0 ? "#4ade80" : "#f87171" }}>
                    ({rankDelta > 0 ? "↑" : "↓"}{Math.abs(rankDelta)} places)
                  </span>
                )}
              </div>
            </div>
            {isDirty && (
              <button onClick={reset}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:text-red-400"
                style={{ color: "var(--text-3)", background: "var(--raised)", border: "1px solid var(--border)" }}>
                Reset
              </button>
            )}
          </div>

          {/* Pillar sliders */}
          <div className="space-y-5">
            {PILLARS.map(({ key, label, color }) => {
              const current = initialScores[key];
              const hypo    = scores[key];
              const delta   = hypo - current;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{label}</span>
                    <div className="flex items-center gap-2">
                      {delta !== 0 && (
                        <span className="text-xs font-semibold" style={{ color: delta > 0 ? "#4ade80" : "#f87171" }}>
                          {delta > 0 ? "+" : ""}{delta}
                        </span>
                      )}
                      <span className="text-sm font-black tabular-nums" style={{ color }}>{hypo}/20</span>
                    </div>
                  </div>
                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={hypo}
                      onChange={(e) => setScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${color} 0%, ${color} ${(hypo / 20) * 100}%, var(--raised) ${(hypo / 20) * 100}%, var(--raised) 100%)`,
                        accentColor: color,
                      }}
                    />
                    {/* Current marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 pointer-events-none"
                      style={{
                        left: `calc(${(current / 20) * 100}% - 1px)`,
                        background: "rgba(255,255,255,.3)",
                      }}
                      title={`Current: ${current}`}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5 text-[9px]" style={{ color: "var(--text-3)" }}>
                    <span>0</span>
                    <span style={{ color: "rgba(255,255,255,.3)" }}>current: {current}</span>
                    <span>20</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] mt-4 pt-3" style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
            Hypothetical only — does not modify published scores. Rank computed against current live dataset.
          </p>
        </div>
      )}
    </div>
  );
}
