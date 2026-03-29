"use client";

import { useState } from "react";

export type Weights = {
  infrastructure: number;
  talent: number;
  governance: number;
  investment: number;
  economic_readiness: number;
};

export const DEFAULT_WEIGHTS: Weights = {
  infrastructure: 20,
  talent: 20,
  governance: 20,
  investment: 20,
  economic_readiness: 20,
};

const PILLARS: { key: keyof Weights; label: string; color: string }[] = [
  { key: "infrastructure",     label: "Infrastructure",     color: "#3b82f6" },
  { key: "talent",             label: "Talent",             color: "#8b5cf6" },
  { key: "governance",         label: "Governance",         color: "#06b6d4" },
  { key: "investment",         label: "Investment",         color: "#f59e0b" },
  { key: "economic_readiness", label: "Econ Readiness",     color: "#22c55e" },
];

interface Props {
  weights: Weights;
  onChange: (w: Weights) => void;
}

function isDefault(w: Weights) {
  return Object.values(w).every((v) => v === 20);
}

export function weightedScore(
  scores: { infrastructure: { score: number }; talent: { score: number }; governance: { score: number }; investment: { score: number }; economic_readiness: { score: number } },
  weights: Weights
): number {
  const total = Object.values(weights).reduce((s, v) => s + v, 0) || 1;
  const raw =
    scores.infrastructure.score * weights.infrastructure +
    scores.talent.score * weights.talent +
    scores.governance.score * weights.governance +
    scores.investment.score * weights.investment +
    scores.economic_readiness.score * weights.economic_readiness;
  // Scale so equal weights (20×5=100 total) produce original score
  return Math.round((raw / total) * 5);
}

export default function PillarWeights({ weights, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const dirty = !isDefault(weights);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 input-base px-3 whitespace-nowrap cursor-pointer"
        style={{
          width: "auto",
          color: dirty ? "#fcd34d" : "var(--text-2)",
          borderColor: dirty ? "rgba(251,191,36,.45)" : undefined,
        }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 6h18M6 12h12M10 18h4" />
        </svg>
        <span className="text-sm">Weights</span>
        {dirty && (
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#fbbf24" }} />
        )}
        <svg className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-30 mt-2 w-80 rounded-2xl p-5 shadow-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-mid)",
            boxShadow: "0 16px 48px rgba(0,0,0,.75)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              Custom Pillar Weights
            </p>
            {dirty && (
              <button
                onClick={() => onChange(DEFAULT_WEIGHTS)}
                className="text-xs transition-colors hover:text-red-400"
                style={{ color: "var(--text-3)" }}
              >
                Reset ×
              </button>
            )}
          </div>

          <div className="space-y-4">
            {PILLARS.map(({ key, label, color }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{label}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color }}>{weights[key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights[key]}
                  onChange={(e) => onChange({ ...weights, [key]: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${weights[key]}%, var(--raised) ${weights[key]}%, var(--raised) 100%)`,
                    accentColor: color,
                  }}
                />
              </div>
            ))}
          </div>

          {dirty && (
            <p className="text-[10px] mt-4 pt-3" style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
              Rankings re-computed using your weights. A weight of 0% removes a pillar from scoring.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
