"use client";

interface TrajectoryArrowProps {
  label: string;
  score: number;
  size?: "sm" | "md" | "lg";
}

interface Config {
  arrow: string;
  color: string;
  bg: string;
  border: string;
  extraClass?: string;
}

const CONFIG: Record<string, Config> = {
  "Strong Positive": {
    arrow: "↑↑",
    color: "#4ade80",
    bg: "rgba(34,197,94,.15)",
    border: "rgba(34,197,94,.40)",
    extraClass: "traj-glow-positive",
  },
  Positive: {
    arrow: "↑",
    color: "#86efac",
    bg: "rgba(34,197,94,.09)",
    border: "rgba(34,197,94,.28)",
  },
  Neutral: {
    arrow: "→",
    color: "#94a3b8",
    bg: "rgba(148,163,184,.08)",
    border: "rgba(148,163,184,.22)",
  },
  Negative: {
    arrow: "↓",
    color: "#fb923c",
    bg: "rgba(251,146,60,.09)",
    border: "rgba(251,146,60,.28)",
  },
  "Strong Negative": {
    arrow: "↓↓",
    color: "#f87171",
    bg: "rgba(239,68,68,.15)",
    border: "rgba(239,68,68,.40)",
    extraClass: "traj-glow-negative",
  },
};

export default function TrajectoryArrow({ label, score, size = "md" }: TrajectoryArrowProps) {
  const cfg = CONFIG[label] ?? CONFIG["Neutral"];

  const arrowSize = size === "sm" ? "text-sm"  : size === "lg" ? "text-2xl" : "text-lg";
  const textSize  = size === "sm" ? "text-xs"  : size === "lg" ? "text-sm"  : "text-xs";
  const pad       = size === "sm" ? "px-2.5 py-1" : size === "lg" ? "px-4 py-2" : "px-3 py-1.5";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full ${pad} ${cfg.extraClass ?? ""}`}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className={`${arrowSize} font-black leading-none`} style={{ color: cfg.color }}>
        {cfg.arrow}
      </span>
      <span className={`${textSize} font-semibold`} style={{ color: cfg.color }}>
        {label}
      </span>
      <span className={`${textSize}`} style={{ color: "var(--text-3)" }}>
        ({score > 0 ? "+" : ""}{score})
      </span>
    </div>
  );
}
