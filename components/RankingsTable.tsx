"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import TrajectoryArrow from "./TrajectoryArrow";
import type { ScoredCountry } from "@/lib/types";

interface Props {
  countries: ScoredCountry[];
  globalRanks: Record<string, number>;
  activeRegion?: string;
}

const DIMS = [
  { key: "infrastructure",     short: "Infra",  full: "Infrastructure"    },
  { key: "talent",             short: "Talent", full: "Talent"            },
  { key: "governance",         short: "Gov",    full: "Governance"        },
  { key: "investment",         short: "Invest", full: "Investment"        },
  { key: "economic_readiness", short: "Econ",   full: "Economic Readiness"},
] as const;

const DIM_COLORS: Record<string, string> = {
  infrastructure:    "#3b82f6",
  talent:            "#8b5cf6",
  governance:        "#06b6d4",
  investment:        "#f59e0b",
  economic_readiness:"#22c55e",
};

type SortCol = "rank" | "total_score" | "trajectory_score" | "projected_score_2028"
             | "infrastructure" | "talent" | "governance" | "investment" | "economic_readiness";

function cellBg(score: number, max = 20): string {
  const pct = score / max;
  if (pct >= 0.8) return "rgba(74,222,128,.10)";
  if (pct >= 0.6) return "rgba(96,165,250,.08)";
  if (pct >= 0.4) return "rgba(251,191,36,.06)";
  return "rgba(248,113,113,.06)";
}

function cellTextColor(score: number, max = 20): string {
  const pct = score / max;
  if (pct >= 0.8) return "#4ade80";
  if (pct >= 0.6) return "#93c5fd";
  if (pct >= 0.4) return "#fcd34d";
  return "#fca5a5";
}

function totalScoreColor(score: number) {
  if (score >= 80) return { color: "#4ade80", glow: "rgba(34,197,94,.5)" };
  if (score >= 60) return { color: "#93c5fd", glow: "rgba(96,165,250,.5)" };
  if (score >= 40) return { color: "#fcd34d", glow: "rgba(251,191,36,.5)" };
  return              { color: "#fca5a5", glow: "rgba(248,113,113,.5)" };
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <span className="ml-1 opacity-60" style={{ opacity: active ? 1 : 0.35 }}>
      {active ? (dir === "desc" ? "↓" : "↑") : "↕"}
    </span>
  );
}

export default function RankingsTable({ countries, globalRanks, activeRegion }: Props) {
  const [sortCol, setSortCol]   = useState<SortCol>("rank");
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("asc");

  function handleHeaderClick(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "rank" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    return [...countries].sort((a, b) => {
      let av: number, bv: number;
      if (sortCol === "rank") {
        av = globalRanks[a.slug] ?? 999;
        bv = globalRanks[b.slug] ?? 999;
      } else if (["infrastructure","talent","governance","investment","economic_readiness"].includes(sortCol)) {
        av = a.scores[sortCol as keyof typeof a.scores].score;
        bv = b.scores[sortCol as keyof typeof b.scores].score;
      } else {
        av = a[sortCol as keyof ScoredCountry] as number;
        bv = b[sortCol as keyof ScoredCountry] as number;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [countries, globalRanks, sortCol, sortDir]);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-20 fade-up">
        <p className="text-4xl mb-4">🌐</p>
        <p className="text-lg font-semibold" style={{ color: "var(--text-2)" }}>No countries found</p>
        <p className="text-sm mt-2" style={{ color: "var(--text-3)" }}>Try adjusting your search or filters</p>
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "var(--raised)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div className="rounded-2xl border" style={{ border: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}>
      <div className="overflow-x-auto">
        <table className="rankings-table">
          <thead>
            <tr>
              <th style={{ ...thStyle, minWidth: 52, paddingLeft: "1.25rem", textAlign: "center" }}
                onClick={() => handleHeaderClick("rank")}>
                # <SortIcon active={sortCol === "rank"} dir={sortDir} />
              </th>
              <th style={{ ...thStyle, minWidth: 180 }}>Country</th>
              <th style={{ ...thStyle, minWidth: 88, textAlign: "center" }}
                onClick={() => handleHeaderClick("total_score")}>
                Score <SortIcon active={sortCol === "total_score"} dir={sortDir} />
              </th>
              {DIMS.map((d) => (
                <th key={d.key} style={{ ...thStyle, minWidth: 92, textAlign: "center" }}
                  onClick={() => handleHeaderClick(d.key as SortCol)}
                  title={d.full}>
                  {d.short} <SortIcon active={sortCol === d.key} dir={sortDir} />
                </th>
              ))}
              <th style={{ ...thStyle, minWidth: 160 }}>Trajectory</th>
              <th style={{ ...thStyle, minWidth: 80, textAlign: "center" }}
                onClick={() => handleHeaderClick("projected_score_2028")}>
                2028 <SortIcon active={sortCol === "projected_score_2028"} dir={sortDir} />
              </th>
              <th style={{ ...thStyle, minWidth: 60, paddingRight: "1.25rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const rank = globalRanks[c.slug] ?? "—";
              const { color, glow } = totalScoreColor(c.total_score);
              const isRegionActive = activeRegion && activeRegion !== "All" && c.region === activeRegion;

              return (
                <tr key={c.slug} className="group"
                  style={isRegionActive ? { background: "rgba(59,130,246,.04)" } : {}}>
                  <td className="pl-5 text-center w-12">
                    <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-3)" }}>
                      {rank}
                    </span>
                  </td>

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

                  <td className="text-center">
                    <span className="text-lg font-black tabular-nums"
                      style={{ color, textShadow: `0 0 14px ${glow}` }}>
                      {c.total_score}
                    </span>
                    <span className="text-xs ml-0.5" style={{ color: "var(--text-3)" }}>/100</span>
                  </td>

                  {DIMS.map((d) => {
                    const score = c.scores[d.key].score;
                    const pct = (score / 20) * 100;
                    return (
                      <td key={d.key} className="px-2 py-3" style={{ minWidth: 92, background: cellBg(score) }}>
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-10 h-1.5 rounded-full overflow-hidden flex-shrink-0"
                            style={{ background: "var(--raised)" }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: DIM_COLORS[d.key] }} />
                          </div>
                          <span className="text-xs font-semibold tabular-nums"
                            style={{ color: cellTextColor(score) }}>{score}</span>
                        </div>
                      </td>
                    );
                  })}

                  <td>
                    <TrajectoryArrow label={c.trajectory_label} score={c.trajectory_score} size="sm" />
                  </td>

                  <td className="text-center">
                    <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                      {c.projected_score_2028}
                    </span>
                    {(() => {
                      const delta = c.projected_score_2028 - c.total_score;
                      return (
                        <span className="text-[10px] ml-1" style={{ color: delta > 0 ? "#4ade80" : delta < 0 ? "#f87171" : "var(--text-3)" }}>
                          {delta > 0 ? "+" : ""}{delta}
                        </span>
                      );
                    })()}
                  </td>

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
