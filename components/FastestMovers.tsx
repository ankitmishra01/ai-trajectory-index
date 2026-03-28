"use client";

import Link from "next/link";
import { ScoredCountry } from "@/lib/types";

interface FastestMoversProps {
  countries: ScoredCountry[];
  onSortClick: () => void;
}

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#cd7c3a", "#7a96b8", "#7a96b8"];

export default function FastestMovers({ countries, onSortClick }: FastestMoversProps) {
  const top5 =
    countries.length > 0
      ? [...countries]
          .sort((a, b) =>
            (b.projected_score_2028 - b.total_score) -
            (a.projected_score_2028 - a.total_score)
          )
          .slice(0, 5)
      : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Countries to Watch in 2026
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Ranked by projected 2028 score gain
          </p>
        </div>
        <button
          onClick={onSortClick}
          className="text-xs transition-colors hover:opacity-80 whitespace-nowrap"
          style={{ color: "var(--accent)" }}
        >
          See all →
        </button>
      </div>

      {/* Scroll row */}
      <div
        className="flex gap-2.5 pb-1"
        style={{ overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {top5 === null
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton rounded-2xl flex-shrink-0"
                style={{ width: 148, height: 180 }}
              />
            ))
          : top5.map((c, i) => {
              const delta = Math.round(c.projected_score_2028 - c.total_score);
              return (
                <Link
                  key={c.slug}
                  href={`/country/${c.slug}`}
                  className="flex-shrink-0 rounded-2xl p-4 flex flex-col transition-all duration-200"
                  style={{
                    width: 148,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,.4)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {/* Rank + trajectory row */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[11px] font-black"
                      style={{ color: RANK_COLORS[i] }}
                    >
                      #{i + 1}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "rgba(34,197,94,.10)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,.20)",
                      }}
                    >
                      {c.trajectory_label === "Strong Positive" ? "↑↑" : "↑"}
                    </span>
                  </div>

                  {/* Flag */}
                  <span className="text-4xl leading-none mb-2.5">{c.flag}</span>

                  {/* Name */}
                  <p
                    className="text-xs font-bold leading-tight mb-auto"
                    style={{ color: "var(--text-1)" }}
                  >
                    {c.name}
                  </p>

                  {/* Delta — the hero number */}
                  <div className="mt-3">
                    <p
                      className="text-xl font-black leading-none"
                      style={{ color: "#4ade80" }}
                    >
                      +{delta}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
                      pts by 2028
                    </p>
                    <p className="text-[10px] mt-1.5 font-medium" style={{ color: "var(--text-3)" }}>
                      {c.total_score}
                      <span style={{ color: "var(--accent)" }}> → </span>
                      {c.projected_score_2028}
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
