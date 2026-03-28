"use client";

import { useState } from "react";
import Link from "next/link";
import type { EnrichedAdoption } from "@/lib/adoption";
import { TIER_COLORS, DIM_COLORS } from "@/lib/adoption";

interface Props {
  countries: EnrichedAdoption[];
  globalRanks: Record<string, number>;
}

type Col = "rank" | "adoption_total" | "adoption_gap" | "government" | "enterprise" | "talent_demand" | "consumer" | "pipeline";

const COLS: { key: Col; label: string; short: string }[] = [
  { key: "rank",           label: "Rank",       short: "#"      },
  { key: "adoption_total", label: "Score",      short: "Score"  },
  { key: "adoption_gap",   label: "Gap",        short: "Gap"    },
  { key: "government",     label: "Government", short: "Gov"    },
  { key: "enterprise",     label: "Enterprise", short: "Biz"    },
  { key: "talent_demand",  label: "Talent",     short: "Talent" },
  { key: "consumer",       label: "Consumer",   short: "Users"  },
  { key: "pipeline",       label: "R&D",        short: "R&D"    },
];

function getValue(c: EnrichedAdoption, rank: number, col: Col): number {
  if (col === "rank") return rank;
  if (col === "adoption_total") return c.adoption_total;
  if (col === "adoption_gap") return c.adoption_gap;
  return c.adoption_scores[col as keyof typeof c.adoption_scores];
}

export default function AdoptionTable({ countries, globalRanks }: Props) {
  const [sortCol, setSortCol] = useState<Col>("rank");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  function handleSort(col: Col) {
    if (sortCol === col) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortCol(col); setSortDir(col === "rank" ? 1 : -1); }
  }

  const sorted = [...countries].sort((a, b) => {
    const av = getValue(a, globalRanks[a.slug] ?? 999, sortCol);
    const bv = getValue(b, globalRanks[b.slug] ?? 999, sortCol);
    return (av - bv) * sortDir;
  });

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <th className="text-left px-4 py-3 font-bold sticky left-0 z-10"
                style={{ color: "var(--text-3)", background: "var(--surface)", minWidth: 180 }}>
                Country
              </th>
              <th className="text-left px-3 py-3 font-bold"
                style={{ color: "var(--text-3)", minWidth: 100 }}>
                Tier
              </th>
              {COLS.map((col) => (
                <th key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-3 font-bold cursor-pointer select-none whitespace-nowrap transition-colors hover:text-white"
                  style={{ color: sortCol === col.key ? "var(--text-1)" : "var(--text-3)", textAlign: "right" }}>
                  {col.short}
                  {sortCol === col.key && (
                    <span className="ml-1">{sortDir === -1 ? "↓" : "↑"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const rank = globalRanks[c.slug] ?? 0;
              const tierStyle = TIER_COLORS[c.adoption_tier] ?? TIER_COLORS["Nascent Adoption"];
              const gap = c.adoption_gap;
              return (
                <tr key={c.slug}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.015)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--raised)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,.015)")}
                >
                  {/* Country name — sticky */}
                  <td className="px-4 py-3 sticky left-0 z-10" style={{ background: "inherit" }}>
                    <Link href={`/country/${c.slug}`}
                      className="flex items-center gap-2.5 group"
                      style={{ textDecoration: "none" }}>
                      <span className="text-lg leading-none">{c.flag}</span>
                      <div>
                        <p className="font-semibold transition-colors group-hover:text-white"
                          style={{ color: "var(--text-1)" }}>{c.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{c.region}</p>
                      </div>
                    </Link>
                  </td>

                  {/* Tier */}
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                      style={{ background: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}` }}>
                      {c.adoption_tier.replace(" Adoption", "")}
                    </span>
                  </td>

                  {/* Rank */}
                  <td className="px-3 py-3 text-right tabular-nums font-bold"
                    style={{ color: "var(--text-3)" }}>#{rank}</td>

                  {/* Score */}
                  <td className="px-3 py-3 text-right tabular-nums font-black"
                    style={{ color: tierStyle.color }}>{c.adoption_total}</td>

                  {/* Gap */}
                  <td className="px-3 py-3 text-right tabular-nums font-semibold"
                    style={{ color: gap > 2 ? "#4ade80" : gap < -2 ? "#f59e0b" : "var(--text-3)" }}>
                    {gap > 0 ? "+" : ""}{gap}
                  </td>

                  {/* 5 dimension scores */}
                  {(["government", "enterprise", "talent_demand", "consumer", "pipeline"] as const).map((key) => (
                    <td key={key} className="px-3 py-3 text-right tabular-nums"
                      style={{ color: DIM_COLORS[key] }}>
                      {c.adoption_scores[key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 flex items-center gap-4 text-[10px]"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
        <span>{sorted.length} countries</span>
        <span>·</span>
        <span>Click column header to sort</span>
        <span>·</span>
        <span>Gap = Adoption minus Readiness score</span>
      </div>
    </div>
  );
}
