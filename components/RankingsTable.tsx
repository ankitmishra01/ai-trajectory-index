"use client";

import Link from "next/link";
import TrajectoryArrow from "./TrajectoryArrow";
import type { ScoredCountry } from "@/lib/types";

interface Props {
  countries: ScoredCountry[];
  globalRanks: Record<string, number>;
}

const DIMS = [
  { key: "infrastructure",    short: "Infra" },
  { key: "talent",            short: "Talent" },
  { key: "governance",        short: "Gov" },
  { key: "investment",        short: "Invest" },
  { key: "economic_readiness",short: "Econ" },
] as const;

const DIM_COLORS: Record<string, string> = {
  infrastructure:    "#3b82f6",
  talent:            "#8b5cf6",
  governance:        "#06b6d4",
  investment:        "#f59e0b",
  economic_readiness:"#22c55e",
};

function ScoreCell({ score, max = 20, color }: { score: number; max?: number; color: string }) {
  const pct = (score / max) * 100;
  return (
    <td className="px-3 py-3" style={{ minWidth: 72 }}>
      <div className="flex items-center gap-1.5">
        <div className="w-12 h-1.5 rounded-full overflow-hidden flex-shrink-0"
          style={{ background: "var(--raised)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="text-xs font-semibold tabular-nums" style={{ color }}>{score}</span>
      </div>
    </td>
  );
}

function scoreColorCls(score: number) {
  if (score >= 80) return { color: "#4ade80", glow: "rgba(34,197,94,.5)" };
  if (score >= 60) return { color: "#93c5fd", glow: "rgba(96,165,250,.5)" };
  if (score >= 40) return { color: "#fcd34d", glow: "rgba(251,191,36,.5)" };
  return              { color: "#fca5a5", glow: "rgba(248,113,113,.5)" };
}

export default function RankingsTable({ countries, globalRanks }: Props) {
  if (countries.length === 0) {
    return (
      <div className="text-center py-20 fade-up">
        <p className="text-4xl mb-4">🌐</p>
        <p className="text-lg font-semibold" style={{ color: "var(--text-2)" }}>No countries found</p>
        <p className="text-sm mt-2" style={{ color: "var(--text-3)" }}>Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* Column header row */}
      <div className="overflow-x-auto">
        <table className="rankings-table">
          <thead>
            <tr>
              <th className="pl-5 w-12 text-center">#</th>
              <th>Country</th>
              <th className="text-center" style={{ minWidth: 80 }}>Score</th>
              {DIMS.map((d) => (
                <th key={d.key} className="text-center" style={{ minWidth: 90 }}>{d.short}</th>
              ))}
              <th style={{ minWidth: 160 }}>Trajectory</th>
              <th className="text-center" style={{ minWidth: 80 }}>2028</th>
              <th className="pr-5" style={{ minWidth: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => {
              const rank = globalRanks[c.slug] ?? "—";
              const { color, glow } = scoreColorCls(c.total_score);
              return (
                <tr key={c.slug} className="group">
                  {/* Rank */}
                  <td className="pl-5 text-center w-12">
                    <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-3)" }}>
                      {rank}
                    </span>
                  </td>

                  {/* Country */}
                  <td style={{ minWidth: 180 }}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl flex-shrink-0">{c.flag}</span>
                      <div>
                        <p className="text-sm font-semibold leading-none mb-0.5" style={{ color: "var(--text-1)" }}>
                          {c.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-3)" }}>{c.region}</p>
                      </div>
                    </div>
                  </td>

                  {/* Total score */}
                  <td className="text-center">
                    <span
                      className="text-lg font-black tabular-nums"
                      style={{ color, textShadow: `0 0 14px ${glow}` }}
                    >
                      {c.total_score}
                    </span>
                    <span className="text-xs ml-0.5" style={{ color: "var(--text-3)" }}>/100</span>
                  </td>

                  {/* Dimension mini-bars */}
                  {DIMS.map((d) => (
                    <ScoreCell
                      key={d.key}
                      score={c.scores[d.key].score}
                      color={DIM_COLORS[d.key]}
                    />
                  ))}

                  {/* Trajectory */}
                  <td>
                    <TrajectoryArrow label={c.trajectory_label} score={c.trajectory_score} size="sm" />
                  </td>

                  {/* Projected 2028 */}
                  <td className="text-center">
                    <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                      {c.projected_score_2028}
                    </span>
                  </td>

                  {/* CTA */}
                  <td className="pr-5">
                    <Link
                      href={`/country/${c.slug}`}
                      className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg"
                      style={{ color: "var(--accent)", background: "rgba(59,130,246,.10)", border: "1px solid rgba(59,130,246,.20)" }}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
