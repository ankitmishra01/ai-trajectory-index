"use client";

export type SortKey = "total_score" | "trajectory_score" | "projected_score_2028";
export type Region =
  | "All"
  | "Americas"
  | "Europe"
  | "Asia-Pacific"
  | "Middle East & Africa";

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

const REGIONS: Region[] = [
  "All",
  "Americas",
  "Europe",
  "Asia-Pacific",
  "Middle East & Africa",
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "total_score", label: "Current Score" },
  { value: "trajectory_score", label: "Trajectory" },
  { value: "projected_score_2028", label: "Projected 2028" },
];

export default function FilterBar({
  search,
  region,
  sort,
  onSearch,
  onRegion,
  onSort,
  total,
  filtered,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search countries..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f1628] border border-[#1c2847] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          className="px-4 py-2.5 bg-[#0f1628] border border-[#1c2847] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors text-sm cursor-pointer min-w-[180px]"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Region filter pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => onRegion(r)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              region === r
                ? "bg-blue-500 border-blue-500 text-white"
                : "bg-transparent border-[#1c2847] text-slate-400 hover:border-blue-500/50 hover:text-slate-200"
            }`}
          >
            {r}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          {filtered === total
            ? `${total} countries`
            : `${filtered} of ${total} countries`}
        </span>
      </div>
    </div>
  );
}
