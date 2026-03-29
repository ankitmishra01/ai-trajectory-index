"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ScoredCountry } from "@/lib/types";

interface Props {
  countries: ScoredCountry[];
}

function scoreColor(s: number) {
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#93c5fd";
  if (s >= 40) return "#fcd34d";
  return "#fca5a5";
}

export default function GovernanceGapPanel({ countries }: Props) {
  const top = useMemo(() =>
    [...countries]
      .map((c) => ({
        ...c,
        avgPillar: Math.round((c.total_score / 5) * 10) / 10,
        govScore: c.scores.governance.score,
        gap: Math.round((c.total_score / 5 - c.scores.governance.score) * 10) / 10,
      }))
      .filter((c) => c.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 10),
    [countries]
  );

  if (!top.length) return null;

  return (
    <div className="card rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Governance Gap Leaderboard
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ background: "rgba(6,182,212,.08)", color: "#67e8f9", border: "1px solid rgba(6,182,212,.18)" }}>
          Capabilities outpace policy
        </span>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
        Countries where AI capabilities exceed governance maturity — highest policy risk.
      </p>

      <div className="space-y-3">
        {top.map((c, i) => {
          const expectedPct = (c.avgPillar / 20) * 100;
          const actualPct   = (c.govScore   / 20) * 100;
          return (
            <Link key={c.slug} href={`/country/${c.slug}`}
              className="block group transition-opacity hover:opacity-90">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] w-4 text-right flex-shrink-0 tabular-nums"
                  style={{ color: "var(--text-3)" }}>#{i + 1}</span>
                <span className="text-base">{c.flag}</span>
                <span className="text-sm font-semibold flex-1 truncate group-hover:text-blue-300 transition-colors"
                  style={{ color: "var(--text-1)" }}>{c.name}</span>
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  <span style={{ color: "var(--text-3)" }}>
                    Avg <span className="font-bold" style={{ color: scoreColor(c.total_score) }}>{c.avgPillar}</span>
                  </span>
                  <span style={{ color: "var(--text-3)" }}>vs Gov</span>
                  <span className="font-bold" style={{ color: "#f87171" }}>{c.govScore}</span>
                  <span className="font-black text-[11px] px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(239,68,68,.08)", color: "#f87171", border: "1px solid rgba(239,68,68,.20)" }}>
                    −{c.gap}
                  </span>
                </div>
              </div>
              {/* Dual bar */}
              <div className="relative ml-7 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--raised)" }}>
                {/* Expected (avg pillar) */}
                <div className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${expectedPct}%`, background: "rgba(59,130,246,.30)" }} />
                {/* Actual governance */}
                <div className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${actualPct}%`, background: "#06b6d4" }} />
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-[10px] mt-4 pt-3" style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
        Gap = average pillar score (total÷5) minus governance pillar score.
        Blue bar = capabilities baseline · Teal bar = actual governance.
      </p>
    </div>
  );
}
