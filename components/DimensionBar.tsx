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

const DIMENSION_GLOWS: Record<string, string> = {
  Infrastructure: "rgba(59,130,246,0.45)",
  Talent: "rgba(139,92,246,0.45)",
  Governance: "rgba(6,182,212,0.45)",
  Investment: "rgba(245,158,11,0.45)",
  "Economic Readiness": "rgba(34,197,94,0.45)",
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
  const glow = DIMENSION_GLOWS[label] ?? "rgba(59,130,246,0.45)";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {showScore && (
          <span className="text-xs font-bold" style={{ color }}>
            {score}
            <span className="text-slate-600 font-normal">/{maxScore}</span>
          </span>
        )}
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: "#1a2540" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />
      </div>
    </div>
  );
}
