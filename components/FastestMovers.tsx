"use client";

import Link from "next/link";
import { ScoredCountry } from "@/lib/types";

interface FastestMoversProps {
  countries: ScoredCountry[];
  onSortClick: () => void;
}

const RANK_COLORS   = ["#f59e0b", "#94a3b8", "#cd7c3a", "#7a96b8", "#7a96b8"];
const RANK_BG       = ["rgba(245,158,11,.08)", "rgba(148,163,184,.06)", "rgba(205,124,58,.07)", "rgba(122,150,184,.05)", "rgba(122,150,184,.05)"];
const RANK_LABELS   = ["🥇", "🥈", "🥉", "#4", "#5"];

export default function FastestMovers({ countries, onSortClick }: FastestMoversProps) {
  const top5 =
    countries.length > 0
      ? [...countries]
          .sort(
            (a, b) =>
              (b.projected_score_2028 - b.total_score) -
              (a.projected_score_2028 - a.total_score)
          )
          .slice(0, 5)
      : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Countries to Watch in 2026
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Ranked by projected 2028 score gain
          </p>
        </div>
        <button
          onClick={onSortClick}
          className="text-xs transition-opacity hover:opacity-70 whitespace-nowrap"
          style={{ color: "var(--accent)" }}
        >
          See all →
        </button>
      </div>

      {/* Card row */}
      <div
        className="flex gap-3 pb-1"
        style={{ overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {top5 === null
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton rounded-2xl flex-shrink-0"
                style={{ width: 164, height: 196 }}
              />
            ))
          : top5.map((c, i) => {
              const delta    = Math.round(c.projected_score_2028 - c.total_score);
              const pct      = Math.round((c.total_score / 100) * 100);
              const pctProj  = Math.round((c.projected_score_2028 / 100) * 100);

              return (
                <Link
                  key={c.slug}
                  href={`/country/${c.slug}`}
                  className="flex-shrink-0 rounded-2xl flex flex-col transition-all duration-200 overflow-hidden"
                  style={{
                    width: 164,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(59,130,246,.4)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Rank colour accent bar */}
                  <div style={{ height: 3, background: RANK_COLORS[i], flexShrink: 0 }} />

                  <div className="p-4 flex flex-col flex-1">
                    {/* Rank + region row */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[11px] font-black"
                        style={{ color: RANK_COLORS[i] }}
                      >
                        {i < 3 ? RANK_LABELS[i] : `#${i + 1}`}
                      </span>
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full truncate max-w-[80px]"
                        style={{
                          background: RANK_BG[i],
                          color: "var(--text-3)",
                        }}
                      >
                        {c.region}
                      </span>
                    </div>

                    {/* Flag + name */}
                    <span className="text-[38px] leading-none mb-2">{c.flag}</span>
                    <p
                      className="text-xs font-bold leading-snug mb-3"
                      style={{ color: "var(--text-1)", minHeight: "2.4em" }}
                    >
                      {c.name}
                    </p>

                    {/* Score progress bar */}
                    <div className="mb-3">
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 4, background: "var(--raised)" }}
                      >
                        {/* base score fill */}
                        <div
                          className="h-full rounded-full relative"
                          style={{
                            width: `${pctProj}%`,
                            background: `linear-gradient(90deg, rgba(59,130,246,.35) ${Math.round((pct / pctProj) * 100)}%, #4ade80 ${Math.round((pct / pctProj) * 100)}%)`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px]" style={{ color: "var(--text-3)" }}>
                          {c.total_score}
                        </span>
                        <span className="text-[9px]" style={{ color: "#4ade80" }}>
                          {c.projected_score_2028}
                        </span>
                      </div>
                    </div>

                    {/* Delta — hero number */}
                    <div
                      className="mt-auto flex items-baseline gap-1.5 rounded-xl px-2.5 py-1.5"
                      style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.15)" }}
                    >
                      <span
                        className="text-lg font-black leading-none"
                        style={{ color: "#4ade80" }}
                      >
                        +{delta}
                      </span>
                      <span className="text-[10px]" style={{ color: "#86efac" }}>
                        pts by 2028
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
