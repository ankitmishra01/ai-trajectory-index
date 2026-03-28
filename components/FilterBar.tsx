"use client";

export type SortKey = "total_score" | "trajectory_score" | "projected_score_2028";
export type Region = "All" | "Americas" | "Europe" | "Asia-Pacific" | "Middle East & Africa";

interface FilterBarProps {
  search: string;
  region: Region;
  sort: SortKey;
  onSearch: (v: string) => void;
  onRegion: (v: Region) => void;
  onSort: (v: SortKey) => void;
  total: number;
  filtered: number;
}

const REGIONS: Region[] = ["All", "Americas", "Europe", "Asia-Pacific", "Middle East & Africa"];
const SORTS: { value: SortKey; label: string }[] = [
  { value: "total_score",          label: "Current Score" },
  { value: "trajectory_score",     label: "Trajectory"    },
  { value: "projected_score_2028", label: "Projected 2028"},
];

export default function FilterBar({
  search, region, sort,
  onSearch, onRegion, onSort,
  total, filtered,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 mb-8">
      {/* Search + Sort */}
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
          className="input-base min-w-[190px] cursor-pointer"
          style={{ color: "var(--text-1)", background: "var(--raised)" }}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} style={{ background: "var(--surface)" }}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Region pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => onRegion(r)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={
              region === r
                ? {
                    background: "var(--accent)",
                    color: "#fff",
                    border: "1px solid var(--accent)",
                    boxShadow: "0 0 12px rgba(59,130,246,.35)",
                  }
                : {
                    background: "transparent",
                    color: "var(--text-3)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            {r}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>
          {filtered === total ? `${total} countries` : `${filtered} of ${total}`}
        </span>
      </div>
    </div>
  );
}
