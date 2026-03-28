"use client";

import { useEffect, useState } from "react";
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
  if (score >= 80) return { label: "Leading",    color: "#4ade80" };
  if (score >= 60) return { label: "Advanced",   color: "#93c5fd" };
  if (score >= 40) return { label: "Developing", color: "#fcd34d" };
  return                   { label: "Nascent",   color: "#fca5a5" };
}

export default function ComparisonPanel({ selected, onRemove, onClear }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(selected.length >= 2);
  }, [selected.length]);

  const radarData = Object.keys(PILLAR_LABELS).map((key) => {
    const entry: Record<string, number | string> = { pillar: PILLAR_LABELS[key] };
    selected.forEach((c) => {
      entry[c.name] = c.scores[key as keyof typeof c.scores].score;
    });
    return entry;
  });

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-400"
      style={{
        transform: visible ? "translateY(0)" : "translateY(110%)",
        background: "rgba(6,11,20,.97)",
        borderTop: "1px solid rgba(59,130,246,.35)",
        boxShadow: "0 -8px 40px rgba(0,0,0,.7), 0 -1px 0 rgba(59,130,246,.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Comparing {selected.length} {selected.length === 1 ? "country" : "countries"}
          </span>
          {selected.length < 3 && (
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              · Select {3 - selected.length} more to fill comparison
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClear} className="text-xs transition-colors hover:text-red-400"
            style={{ color: "var(--text-3)" }}>
            Clear all ×
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Radar Chart */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
              Pillar Comparison (0–20)
            </p>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="rgba(59,130,246,.15)" />
                  <PolarAngleAxis
                    dataKey="pillar"
                    tick={{ fill: "rgba(139,163,199,.7)", fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 20]}
                    tick={{ fill: "var(--text-3)", fontSize: 9 }}
                    tickCount={5}
                    axisLine={false}
                  />
                  {selected.map((c, i) => (
                    <Radar
                      key={c.slug}
                      name={c.name}
                      dataKey={c.name}
                      stroke={PALETTE[i]}
                      fill={PALETTE[i]}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: "var(--text-2)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "var(--text-1)",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Side-by-side stats */}
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
                      style={{ color: "var(--text-3)" }}
                      title="Remove"
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
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
                        {c.trajectory_label}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: delta >= 0 ? "#4ade80" : "#f87171" }}>
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
    </div>
  );
}
