"use client";

interface DimensionBarProps {
  label: string;
  score: number;
  maxScore?: number;
  showScore?: boolean;
  height?: number;
}

const DIMENSION_COLORS: Record<string, string> = {
  Infrastructure: "#3b82f6",
  Talent: "#8b5cf6",
  Governance: "#06b6d4",
  Investment: "#f59e0b",
  "Economic Readiness": "#22c55e",
};

export default function DimensionBar({
  label,
  score,
  maxScore = 20,
  showScore = true,
  height = 8,
}: DimensionBarProps) {
  const pct = (score / maxScore) * 100;
  const color = DIMENSION_COLORS[label] ?? "#3b82f6";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        {showScore && (
          <span className="text-sm font-bold" style={{ color }}>
            {score}
            <span className="text-slate-500 font-normal">/{maxScore}</span>
          </span>
        )}
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: "#1c2847" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}
