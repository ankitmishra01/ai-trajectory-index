"use client";

import Link from "next/link";
import { ScoredCountry } from "@/lib/types";

interface FastestMoversProps {
  countries: ScoredCountry[];
  onSortClick: () => void;
}

export default function FastestMovers({ countries, onSortClick }: FastestMoversProps) {
  const top5 =
    countries.length > 0
      ? [...countries]
          .sort(
            (a, b) =>
              b.projected_score_2028 - b.total_score -
              (a.projected_score_2028 - a.total_score)
          )
          .slice(0, 5)
      : null;

  return (
    <div className="mb-6">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Countries to Watch in 2026
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Ranked by projected 2028 gain
          </p>
        </div>
        <button
          onClick={onSortClick}
          className="text-xs transition-colors hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          See all →
        </button>
      </div>

      {/* Horizontal scroll container */}
      <div
        className="flex gap-3 pb-2"
        style={{ overflowX: "auto", scrollbarWidth: "none" }}
      >
        {top5 === null
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton rounded-2xl"
                style={{ minWidth: "180px", flexShrink: 0, height: "160px" }}
              />
            ))
          : top5.map((c) => {
              const delta = Math.round(c.projected_score_2028 - c.total_score);
              return (
                <Link
                  key={c.slug}
                  href={`/country/${c.slug}`}
                  style={{ textDecoration: "none", flexShrink: 0 }}
                >
                  <div
                    className="card rounded-2xl p-4 transition hover:border-[var(--border-mid)]"
                    style={{ minWidth: "180px" }}
                  >
                    {/* Flag */}
                    <p className="text-3xl leading-none mb-2">{c.flag}</p>

                    {/* Country name */}
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: "var(--text-1)" }}
                    >
                      {c.name}
                    </p>

                    {/* Delta */}
                    <p className="text-xs font-bold" style={{ color: "#4ade80" }}>
                      +{delta} pts by 2028
                    </p>

                    {/* Score row */}
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      {c.total_score}{" "}
                      <span style={{ color: "var(--accent)" }}>→</span>{" "}
                      {c.projected_score_2028}
                    </p>

                    {/* Trajectory badge */}
                    <span
                      className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1"
                      style={{
                        background: "rgba(34,197,94,0.10)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.20)",
                      }}
                    >
                      {c.trajectory_label}
                    </span>

                    {/* Top accelerator */}
                    <p
                      className="text-[10px] mt-2 truncate"
                      style={{ color: "var(--text-3)" }}
                    >
                      ↑ {c.top_accelerator}
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
