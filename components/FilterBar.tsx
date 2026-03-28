"use client";

import { useState, useRef, useEffect } from "react";

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
}

const REGIONS: Region[] = ["All", "Americas", "Europe", "Asia-Pacific", "Middle East & Africa"];
const TIERS: TierFilter[] = ["All", "Leading", "Advanced", "Developing", "Nascent"];
const TRAJECTORIES: TrajectoryFilter[] = ["All", "Strong Positive", "Positive", "Neutral", "Negative"];
const SORTS: { value: SortKey; label: string }[] = [
  { value: "total_score",          label: "Current Score"       },
  { value: "trajectory_gain",      label: "Trajectory Momentum" },
  { value: "projected_score_2028", label: "Projected 2028"      },
  { value: "governance_gap",       label: "Governance Gap"      },
  { value: "alphabetical",         label: "A – Z"               },
];

const TIER_COLORS: Record<TierFilter, { bg: string; color: string; border: string }> = {
  All:        { bg: "transparent",          color: "var(--text-3)", border: "var(--border)"           },
  Leading:    { bg: "rgba(34,197,94,.12)",  color: "#4ade80",       border: "rgba(34,197,94,.30)"      },
  Advanced:   { bg: "rgba(96,165,250,.12)", color: "#93c5fd",       border: "rgba(96,165,250,.30)"     },
  Developing: { bg: "rgba(251,191,36,.12)", color: "#fcd34d",       border: "rgba(251,191,36,.30)"     },
  Nascent:    { bg: "rgba(248,113,113,.12)",color: "#fca5a5",       border: "rgba(248,113,113,.30)"    },
};

const TRAJ_COLORS: Record<TrajectoryFilter, { bg: string; color: string; border: string }> = {
  All:              { bg: "transparent",            color: "var(--text-3)", border: "var(--border)"          },
  "Strong Positive":{ bg: "rgba(34,197,94,.12)",    color: "#4ade80",       border: "rgba(34,197,94,.30)"    },
  Positive:         { bg: "rgba(34,197,94,.07)",    color: "#86efac",       border: "rgba(34,197,94,.20)"    },
  Neutral:          { bg: "rgba(148,163,184,.08)",  color: "#94a3b8",       border: "rgba(148,163,184,.22)"  },
  Negative:         { bg: "rgba(251,146,60,.08)",   color: "#fb923c",       border: "rgba(251,146,60,.22)"   },
};

function Chip({ label, active, colors, onClick }: {
  label: string; active: boolean;
  colors: { bg: string; color: string; border: string };
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-150 whitespace-nowrap"
      style={active
        ? { background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`, boxShadow: `0 0 8px ${colors.border}` }
        : { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)" }
      }
    >
      {label}
    </button>
  );
}

export default function FilterBar({
  search, region, sort, tier, trajectoryFilter,
  onSearch, onRegion, onSort, onTier, onTrajectoryFilter,
  total, filtered,
}: FilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeFilters = [region !== "All", tier !== "All", trajectoryFilter !== "All"].filter(Boolean).length;

  // Close panel on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [panelOpen]);

  function clearAll() {
    onRegion("All"); onTier("All"); onTrajectoryFilter("All");
  }

  const trajLabel = (tr: TrajectoryFilter) => {
    if (tr === "Strong Positive") return "↑↑ Strong";
    if (tr === "Positive") return "↑ Positive";
    if (tr === "Neutral") return "→ Neutral";
    if (tr === "Negative") return "↓ Negative";
    return tr;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Main bar ── */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--text-3)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search countries…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="input-base pl-10 pr-8"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors hover:text-white"
              style={{ color: "var(--text-3)" }}
            >×</button>
          )}
        </div>

        {/* Filters button */}
        <button
          onClick={() => setPanelOpen((o) => !o)}
          className="flex items-center gap-1.5 input-base px-3 whitespace-nowrap cursor-pointer"
          style={{
            width: "auto",
            color: activeFilters > 0 ? "var(--accent)" : "var(--text-2)",
            borderColor: activeFilters > 0 ? "rgba(59,130,246,.45)" : undefined,
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4h18M7 8h10M11 12h2M11 16h2" />
          </svg>
          <span className="text-sm">Filters</span>
          {activeFilters > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {activeFilters}
            </span>
          )}
          <svg className={`w-3 h-3 transition-transform duration-150 ${panelOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortKey)}
            className="input-base cursor-pointer pr-7"
            style={{ color: sort !== "total_score" ? "var(--accent)" : "var(--text-1)", background: "var(--raised)", minWidth: 190 }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} style={{ background: "var(--surface)", color: "var(--text-1)" }}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          {sort !== "total_score" && (
            <span className="absolute right-8 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
              style={{ background: "var(--accent)" }} />
          )}
        </div>

        {/* Result count */}
        <span className="text-xs whitespace-nowrap hidden sm:block" style={{ color: "var(--text-3)" }}>
          {filtered === total ? `${total} countries` : `${filtered} of ${total}`}
        </span>
      </div>

      {/* ── Filter panel (dropdown) ── */}
      {panelOpen && (
        <div
          className="absolute top-full left-0 right-0 z-30 mt-2 rounded-2xl p-5 shadow-2xl fade-up"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-mid)",
            boxShadow: "0 16px 48px rgba(0,0,0,.75)",
          }}
        >
          <div className="space-y-4">
            {/* Region */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Region</p>
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRegion(r)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-150 whitespace-nowrap"
                    style={region === r
                      ? { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)", boxShadow: "0 0 10px rgba(59,130,246,.35)" }
                      : { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)" }
                    }
                  >{r}</button>
                ))}
              </div>
            </div>

            {/* Tier */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Tier</p>
              <div className="flex flex-wrap gap-1.5">
                {TIERS.map((t) => (
                  <Chip key={t} label={t} active={tier === t} colors={TIER_COLORS[t]} onClick={() => onTier(t)} />
                ))}
              </div>
            </div>

            {/* Trajectory */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Trajectory</p>
              <div className="flex flex-wrap gap-1.5">
                {TRAJECTORIES.map((tr) => (
                  <Chip key={tr} label={trajLabel(tr)} active={trajectoryFilter === tr}
                    colors={TRAJ_COLORS[tr]} onClick={() => onTrajectoryFilter(tr)} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            {activeFilters > 0
              ? <button onClick={clearAll} className="text-xs transition-colors hover:text-red-400" style={{ color: "var(--text-3)" }}>Clear all ×</button>
              : <span />
            }
            <button
              onClick={() => setPanelOpen(false)}
              className="btn-secondary px-4 py-1.5 text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
