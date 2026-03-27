"use client";

interface TrajectoryArrowProps {
  label: string;
  score: number;
  size?: "sm" | "md" | "lg";
}

const CONFIG: Record<
  string,
  { arrow: string; color: string; bg: string; border: string }
> = {
  "Strong Positive": {
    arrow: "↑↑",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  Positive: {
    arrow: "↑",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
  },
  Neutral: {
    arrow: "→",
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/30",
  },
  Negative: {
    arrow: "↓",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
  },
  "Strong Negative": {
    arrow: "↓↓",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
  },
};

export default function TrajectoryArrow({
  label,
  score,
  size = "md",
}: TrajectoryArrowProps) {
  const cfg = CONFIG[label] ?? CONFIG["Neutral"];

  const arrowSize =
    size === "sm" ? "text-base" : size === "lg" ? "text-3xl" : "text-xl";
  const labelSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs";

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.border}`}
    >
      <span className={`${arrowSize} ${cfg.color} font-bold leading-none`}>
        {cfg.arrow}
      </span>
      <span className={`${labelSize} ${cfg.color} font-semibold`}>{label}</span>
      <span className={`${labelSize} text-slate-400`}>
        ({score > 0 ? "+" : ""}
        {score})
      </span>
    </div>
  );
}
