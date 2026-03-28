"use client";

export type SortKey = "total_score" | "trajectory_gain" | "projected_score_2028" | "alphabetical";
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
  { value: "total_score",          label: "Current Score"   },
  { value: "trajectory_gain",      label: "Trajectory Gain" },
  { value: "projected_score_2028", label: "Projected 2028"  },
  { value: "alphabetical",         label: "A – Z"           },
];

const TIER_COLORS: Record<TierFilter, { bg: string; color: string; border: string }> = {
  All:        { bg: "transparent",           color: "var(--text-3)",  border: "var(--border)"           },
  Leading:    { bg: "rgba(34,197,94,.12)",    color: "#4ade80",        border: "rgba(34,197,94,.30)"     },
  Advanced:   { bg: "rgba(96,165,250,.12)",   color: "#93c5fd",        border: "rgba(96,165,250,.30)"    },
  Developing: { bg: "rgba(251,191,36,.12)",   color: "#fcd34d",        border: "rgba(251,191,36,.30)"    },
  Nascent:    { bg: "rgba(248,113,113,.12)",  color: "#fca5a5",        border: "rgba(248,113,113,.30)"   },
};

const TRAJ_COLORS: Record<TrajectoryFilter, { bg: string; color: string; border: string }> = {
  All:             { bg: "transparent",          color: "var(--text-3)",  border: "var(--border)"         },
  "Strong Positive":{ bg: "rgba(34,197,94,.12)", color: "#4ade80",        border: "rgba(34,197,94,.30)"   },
  Positive:        { bg: "rgba(34,197,94,.07)",  color: "#86efac",        border: "rgba(34,197,94,.20)"   },
  Neutral:         { bg: "rgba(148,163,184,.08)",color: "#94a3b8",        border: "rgba(148,163,184,.22)" },
  Negative:        { bg: "rgba(251,146,60,.08)", color: "#fb923c",        border: "rgba(251,146,60,.22)"  },
};

function Chip({
  label, active, colors, onClick,
}: {
  label: string;
  active: boolean;
  colors: { bg: string; color: string; border: string };
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 whitespace-nowrap"
      style={
        active
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
  const activeFilters = [
    region !== "All",
    tier !== "All",
    trajectoryFilter !== "All",
    search !== "",
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Row 1: Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search countries…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="input-base pl-10"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          className="input-base min-w-[200px] cursor-pointer"
          style={{ color: "var(--text-1)", background: "var(--raised)" }}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} style={{ background: "var(--surface)" }}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Row 2: Region pills */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest mr-1" style={{ color: "var(--text-3)" }}>Region</span>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => onRegion(r)}
            className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 whitespace-nowrap"
            style={
              region === r
                ? { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)", boxShadow: "0 0 10px rgba(59,130,246,.35)" }
                : { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)" }
            }
          >
            {r}
          </button>
        ))}
      </div>

      {/* Row 3: Tier + Trajectory chips */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest mr-1" style={{ color: "var(--text-3)" }}>Tier</span>
          {TIERS.map((t) => (
            <Chip
              key={t}
              label={t}
              active={tier === t}
              colors={TIER_COLORS[t]}
              onClick={() => onTier(t)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest mr-1" style={{ color: "var(--text-3)" }}>Trajectory</span>
          {TRAJECTORIES.map((tr) => (
            <Chip
              key={tr}
              label={tr === "Strong Positive" ? "↑↑ Strong" : tr === "Positive" ? "↑ Positive" : tr === "Neutral" ? "→ Neutral" : tr === "Negative" ? "↓ Negative" : tr}
              active={trajectoryFilter === tr}
              colors={TRAJ_COLORS[tr]}
              onClick={() => onTrajectoryFilter(tr)}
            />
          ))}
        </div>
      </div>

      {/* Row 4: Result count + clear */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-3)" }}>
          {filtered === total ? `${total} countries` : `${filtered} of ${total} countries`}
          {activeFilters > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: "rgba(59,130,246,.12)", color: "var(--accent)", border: "1px solid rgba(59,130,246,.22)" }}>
              {activeFilters} filter{activeFilters > 1 ? "s" : ""} active
            </span>
          )}
        </span>
        {activeFilters > 0 && (
          <button
            onClick={() => { onRegion("All"); onTier("All"); onTrajectoryFilter("All"); onSearch(""); }}
            className="text-xs transition-colors hover:text-blue-400"
            style={{ color: "var(--text-3)" }}
          >
            Clear all ×
          </button>
        )}
      </div>
    </div>
  );
}
