"use client";

interface TrajectoryArrowProps {
  label: string;
  score: number;
  size?: "sm" | "md" | "lg";
}

const CONFIG: Record<
  string,
  {
    arrow: string;
    color: string;
    bg: string;
    border: string;
    glow?: string;
    shadow?: string;
  }
> = {
  "Strong Positive": {
    arrow: "↑↑",
    color: "text-emerald-400",
    bg: "bg-emerald-400/15",
    border: "border-emerald-400/40",
    glow: "trajectory-glow-positive",
    shadow: "shadow-[0_0_16px_rgba(34,197,94,0.35)]",
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
    bg: "bg-slate-400/8",
    border: "border-slate-400/25",
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
    bg: "bg-red-400/15",
    border: "border-red-400/40",
    glow: "trajectory-glow-negative",
    shadow: "shadow-[0_0_16px_rgba(239,68,68,0.35)]",
  },
};

export default function TrajectoryArrow({
  label,
  score,
  size = "md",
}: TrajectoryArrowProps) {
  const cfg = CONFIG[label] ?? CONFIG["Neutral"];

  const arrowSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  const labelSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs";
  const px =
    size === "sm" ? "px-2.5 py-1" : size === "lg" ? "px-4 py-2" : "px-3 py-1.5";

  return (
    <div
      className={`inline-flex items-center gap-2 ${px} rounded-full border ${cfg.bg} ${cfg.border} ${cfg.shadow ?? ""}`}
    >
      <span className={`${arrowSize} ${cfg.color} font-black leading-none`}>
        {cfg.arrow}
      </span>
      <span className={`${labelSize} ${cfg.color} font-semibold`}>{label}</span>
      <span className={`${labelSize} text-slate-400/80`}>
        ({score > 0 ? "+" : ""}
        {score})
      </span>
    </div>
  );
}
