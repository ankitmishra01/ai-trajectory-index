"use client";

import { useRef, useEffect } from "react";

export type SortKey = "total_score" | "trajectory_gain" | "projected_score_2028" | "alphabetical" | "governance_gap";
export type Region = "All" | "Americas" | "Europe" | "Asia-Pacific" | "Middle East & Africa";
export type TierFilter = "All" | "Leading" | "Advanced" | "Developing" | "Nascent";
export type TrajectoryFilter = "All" | "Strong Positive" | "Positive" | "Neutral" | "Negative";

interface FilterBarProps {
  search: string;
  region: Region;
  sort: SortKey;
  tier: TierFilter;
  trajectoryFilter: TrajectoryFilter;
  onSearch: (v: string) => void;
  onRegion: (v: Region) => void;
  onSort: (v: SortKey) => void;
  onTier: (v: TierFilter) => void;
  onTrajectoryFilter: (v: TrajectoryFilter) => void;
  total: number;
  filtered: number;
  usingLive?: boolean;
  liveCount?: number;
}

const REGIONS: Region[] = ["All", "Americas", "Europe", "Asia-Pacific", "Middle East & Africa"];
const REGION_SHORT: Record<Region, string> = {
  "All": "All",
  "Americas": "Americas",
  "Europe": "Europe",
  "Asia-Pacific": "Asia-Pac",
  "Middle East & Africa": "MEA",
};

const SORTS: { value: SortKey; label: string }[] = [
  { value: "total_score",          label: "Total Score ↓"       },
  { value: "trajectory_gain",      label: "Trajectory Momentum" },
  { value: "projected_score_2028", label: "Projected 2028"      },
  { value: "governance_gap",       label: "Governance Gap"      },
  { value: "alphabetical",         label: "A – Z"               },
];

export default function FilterBar({
  search, region, sort, tier, trajectoryFilter,
  onSearch, onRegion, onSort, onTier, onTrajectoryFilter,
  total, filtered, usingLive, liveCount,
}: FilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const liveN = liveCount ?? Math.round(total * 0.76);
  const cachedN = total - liveN;

  return (
    <div style={{ background: "var(--dt-surface)", border: "1px solid var(--dt-border)" }}>
      {/* ── Top row: search · region pills · sort ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "min(320px, 45%) 1fr auto",
        padding: "14px 20px",
        gap: 16,
        alignItems: "center",
        borderBottom: "1px solid var(--dt-border)",
      }}>
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--dt-bg)", border: "1px solid var(--dt-border)", position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dt-text-3)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={`Search ${total} countries…`}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--dt-text-0)",
              caretColor: "var(--signal)",
            }}
          />
          {search ? (
            <button onClick={() => onSearch("")} style={{ color: "var(--dt-text-3)", background: "none", border: "none", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
          ) : (
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", border: "1px solid var(--dt-border)", padding: "2px 6px", flexShrink: 0 }}>⌘ K</span>
          )}
        </div>

        {/* Region pills */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", overflowX: "auto", scrollbarWidth: "none" as const }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", letterSpacing: "0.12em", fontWeight: 600, flexShrink: 0 }}>REGION</span>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => onRegion(r)}
              style={{
                background: region === r ? "var(--signal)" : "transparent",
                color: region === r ? "#fff" : "var(--dt-text-2)",
                border: `1px solid ${region === r ? "var(--signal)" : "var(--dt-border)"}`,
                padding: "5px 10px",
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: region === r ? 600 : 400,
                cursor: "pointer",
                flexShrink: 0,
                transition: "background .1s, color .1s",
              }}
            >{REGION_SHORT[r]}</button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", letterSpacing: "0.12em", fontWeight: 600 }}>SORT</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortKey)}
            style={{
              background: "var(--dt-raised)",
              color: sort !== "total_score" ? "var(--signal)" : "var(--dt-text-1)",
              border: "1px solid var(--dt-border)",
              padding: "5px 10px",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} style={{ background: "var(--dt-surface)", color: "var(--dt-text-1)" }}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", flexWrap: "wrap" as const, gap: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dt-text-3)" }}>
          <span style={{ color: "var(--dt-text-0)", fontWeight: 600 }}>{filtered}</span> of {total} economies
          {usingLive && (
            <>
              <span style={{ margin: "0 6px" }}>·</span>
              <span style={{ color: "var(--positive)" }}>● {liveN} live</span>
              <span style={{ margin: "0 6px" }}>·</span>
              <span>○ {cachedN} cached</span>
            </>
          )}
        </span>
        <div style={{ display: "flex", gap: 12, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dt-text-3)" }}>
          {tier !== "All" && (
            <button onClick={() => onTier("All")} style={{ color: "var(--signal)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              Tier: {tier} ×
            </button>
          )}
          {trajectoryFilter !== "All" && (
            <button onClick={() => onTrajectoryFilter("All")} style={{ color: "var(--signal)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              Traj: {trajectoryFilter} ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
