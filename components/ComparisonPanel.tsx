"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from "recharts";
import type { ScoredCountry } from "@/lib/types";

interface Props {
  selected: ScoredCountry[];
  onRemove: (slug: string) => void;
  onClear: () => void;
}

const PALETTE = ["#3b82f6", "#8b5cf6", "#22c55e"];

const PILLAR_LABELS: Record<string, string> = {
  infrastructure:    "Infrastructure",
  talent:            "Talent",
  governance:        "Governance",
  investment:        "Investment",
  economic_readiness:"Econ. Readiness",
};

function scoreBand(score: number) {
  if (score >= 75) return { label: "Leading",    color: "#4ade80" };
  if (score >= 55) return { label: "Advanced",   color: "#93c5fd" };
  if (score >= 40) return { label: "Developing", color: "#fcd34d" };
  return                   { label: "Nascent",   color: "#fca5a5" };
}

export default function ComparisonPanel({ selected, onRemove, onClear }: Props) {
  const [expanded, setExpanded] = useState(false);
  const prevLengthRef = useRef(0);

  // Auto-expand the panel only when the first country is added (0 → 1)
  useEffect(() => {
    if (prevLengthRef.current === 0 && selected.length === 1) {
      setExpanded(true);
    }
    prevLengthRef.current = selected.length;
  }, [selected.length]);

  // Nothing selected — no DOM at all
  if (selected.length === 0) return null;

  const radarData = Object.keys(PILLAR_LABELS).map((key) => {
    const entry: Record<string, number | string> = { pillar: PILLAR_LABELS[key] };
    selected.forEach((c) => {
      entry[c.name] = c.scores[key as keyof typeof c.scores].score;
    });
    return entry;
  });

  // ── Collapsed / Floating pill ─────────────────────────────────────────────
  if (!expanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(6,11,20,.97)",
            border: "1px solid rgba(59,130,246,.50)",
            color: "var(--text-1)",
            boxShadow: "0 8px 32px rgba(0,0,0,.75), 0 0 20px rgba(59,130,246,.18)",
          }}
        >
          <span className="flex gap-0.5">
            {selected.map((c) => (
              <span key={c.slug} className="text-lg leading-none">{c.flag}</span>
            ))}
          </span>
          <span>
            Comparing <span style={{ color: "var(--accent)" }}>{selected.length}</span>/3
          </span>
          <svg className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // ── Expanded panel ────────────────────────────────────────────────────────
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(6,11,20,.97)",
        borderTop: "1px solid rgba(59,130,246,.35)",
        boxShadow: "0 -8px 40px rgba(0,0,0,.7), 0 -1px 0 rgba(59,130,246,.15)",
        backdropFilter: "blur(12px)",
        animation: "slideUp .3s cubic-bezier(.22,1,.36,1) both",
      }}
    >
      {/* Header bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Comparing {selected.length}/3
          </span>
          {selected.length < 2 && (
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              · Add {2 - selected.length} more to compare
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onClear}
            className="text-xs transition-colors hover:text-red-400"
            style={{ color: "var(--text-3)" }}
          >
            Clear all ×
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 text-xs transition-colors hover:text-blue-400"
            style={{ color: "var(--text-3)" }}
          >
            Minimise
            <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {selected.length < 2 ? (
        // Single country — waiting prompt
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="text-2xl">{selected[0].flag}</span>
            <div>
              <p className="text-xs font-bold" style={{ color: "var(--text-1)" }}>{selected[0].name}</p>
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{selected[0].total_score}/100</p>
            </div>
            <button onClick={() => onRemove(selected[0].slug)}
              className="ml-2 text-xs hover:text-red-400 transition-colors" style={{ color: "var(--text-3)" }}>×</button>
          </div>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Click <span style={{ color: "var(--accent)" }}>+</span> on another country card to start comparing
          </p>
        </div>
      ) : (
        // 2–3 countries — full comparison
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Radar Chart */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
                Pillar Comparison (0–20)
              </p>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="rgba(59,130,246,.15)" />
                    <PolarAngleAxis
                      dataKey="pillar"
                      tick={{ fill: "rgba(184,204,228,.8)", fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                      angle={90} domain={[0, 20]}
                      tick={{ fill: "var(--text-3)", fontSize: 9 }}
                      tickCount={5} axisLine={false}
                    />
                    {selected.map((c, i) => (
                      <Radar
                        key={c.slug} name={c.name} dataKey={c.name}
                        stroke={PALETTE[i]} fill={PALETTE[i]}
                        fillOpacity={0.12} strokeWidth={2}
                      />
                    ))}
                    <Legend iconType="circle" iconSize={8}
                      wrapperStyle={{ fontSize: 11, color: "var(--text-2)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: 8, fontSize: 11, color: "var(--text-1)",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Score cards */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
                Score Summary
              </p>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
                {selected.map((c, i) => {
                  const band  = scoreBand(c.total_score);
                  const delta = c.projected_score_2028 - c.total_score;
                  return (
                    <div key={c.slug} className="rounded-xl p-3 relative"
                      style={{ background: "var(--surface)", border: `1px solid ${PALETTE[i]}33` }}>
                      <div className="h-0.5 rounded-full mb-3" style={{ background: PALETTE[i], opacity: 0.6 }} />
                      <button
                        onClick={() => onRemove(c.slug)}
                        className="absolute top-2 right-2 text-xs transition-colors hover:text-red-400"
                        style={{ color: "var(--text-3)" }} title="Remove"
                      >×</button>

                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xl">{c.flag}</span>
                        <div>
                          <p className="text-xs font-bold leading-tight" style={{ color: "var(--text-1)" }}>{c.name}</p>
                          <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{c.region}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black" style={{ color: PALETTE[i] }}>{c.total_score}</span>
                          <span className="text-xs" style={{ color: "var(--text-3)" }}>/100</span>
                        </div>
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: `${band.color}18`, color: band.color, border: `1px solid ${band.color}33` }}>
                          {band.label}
                        </span>
                        <p className="text-xs" style={{ color: "var(--text-3)" }}>{c.trajectory_label}</p>
                        <p className="text-xs font-semibold"
                          style={{ color: delta >= 0 ? "#4ade80" : "#f87171" }}>
                          2028: {c.projected_score_2028} ({delta > 0 ? "+" : ""}{delta} pts)
                        </p>
                      </div>

                      <Link
                        href={`/country/${c.slug}`}
                        className="mt-3 flex items-center gap-1 text-[10px] font-semibold transition-colors hover:text-blue-300"
                        style={{ color: "var(--accent)" }}
                      >
                        View profile →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
