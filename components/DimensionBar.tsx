"use client";

interface DimensionBarProps {
  label: string;
  score: number;
  maxScore?: number;
  showScore?: boolean;
  height?: number;
}

const COLORS: Record<string, { fill: string; glow: string }> = {
  Infrastructure:     { fill: "#3b82f6", glow: "rgba(59,130,246,.50)"  },
  Talent:             { fill: "#8b5cf6", glow: "rgba(139,92,246,.50)"  },
  Governance:         { fill: "#06b6d4", glow: "rgba(6,182,212,.50)"   },
  Investment:         { fill: "#f59e0b", glow: "rgba(245,158,11,.50)"  },
  "Economic Readiness":{ fill: "#22c55e", glow: "rgba(34,197,94,.50)"  },
};

export default function DimensionBar({
  label,
  score,
  maxScore = 20,
  showScore = true,
  height = 8,
}: DimensionBarProps) {
  const pct = (score / maxScore) * 100;
  const { fill, glow } = COLORS[label] ?? { fill: "#3b82f6", glow: "rgba(59,130,246,.50)" };

  return (
    <div className="w-full">
      {showScore && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{label}</span>
          <span className="text-xs font-bold" style={{ color: fill }}>
            {score}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>/{maxScore}</span>
          </span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: "var(--raised)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: fill, boxShadow: `0 0 10px ${glow}` }}
        />
      </div>
    </div>
  );
}
