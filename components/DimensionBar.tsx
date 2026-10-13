"use client";

interface DimensionBarProps {
  label: string;
  score: number;
  maxScore?: number;
  showScore?: boolean;
  height?: number;
}

const COLORS: Record<string, { fill: string; glow: string }> = {
  Infrastructure:     { fill: "#3B5BA5", glow: "rgba(59,91,165,.24)"  },
  Talent:             { fill: "#7A4F8C", glow: "rgba(122,79,140,.24)"  },
  Governance:         { fill: "#3F7A4D", glow: "rgba(63,122,77,.24)"   },
  Investment:         { fill: "#B58A2E", glow: "rgba(181,138,46,.24)"  },
  "Economic Readiness":{ fill: "#8B4A3F", glow: "rgba(139,74,63,.24)"  },
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
