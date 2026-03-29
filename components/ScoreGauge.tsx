"use client";

import { useCountUp } from "@/hooks/useCountUp";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, a1: number, a2: number) {
  const s = polar(cx, cy, r, a2);
  const e = polar(cx, cy, r, a1);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${a2 - a1 <= 180 ? "0" : "1"} 0 ${e.x} ${e.y}`;
}

function colors(score: number) {
  if (score >= 80) return { stroke: "#22c55e", glow: "rgba(34,197,94,.55)",  text: "#4ade80" };
  if (score >= 60) return { stroke: "#3b82f6", glow: "rgba(59,130,246,.55)", text: "#93c5fd" };
  if (score >= 40) return { stroke: "#f59e0b", glow: "rgba(245,158,11,.55)", text: "#fcd34d" };
  return               { stroke: "#ef4444", glow: "rgba(239,68,68,.55)",  text: "#fca5a5" };
}

export default function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  const animated = useCountUp(score, 900);
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r  = size * 0.38;
  const sw = size * 0.075;
  const a1 = -210, a2 = 30;
  const filled = a1 + (animated / 100) * (a2 - a1);
  const { stroke, glow, text } = colors(animated);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Track */}
        <path d={arc(cx, cy, r, a1, a2)} fill="none" stroke="var(--raised)" strokeWidth={sw} strokeLinecap="round" />

        {/* Glow layer */}
        {score > 0 && (
          <path d={arc(cx, cy, r, a1, filled)} fill="none" stroke={glow}
            strokeWidth={sw + 6} strokeLinecap="round" style={{ filter: "blur(6px)" }} opacity={0.7} />
        )}

        {/* Main arc */}
        {score > 0 && (
          <path d={arc(cx, cy, r, a1, filled)} fill="none" stroke={stroke}
            strokeWidth={sw} strokeLinecap="round" />
        )}

        {/* Score */}
        <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle"
          fill={text} fontSize={size * 0.22} fontWeight="900"
          fontFamily="Inter, system-ui, sans-serif"
          style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
          {animated}
        </text>
        <text x={cx} y={cy + size * 0.17} textAnchor="middle" dominantBaseline="middle"
          fill="var(--text-3)" fontSize={size * 0.08} fontFamily="Inter, system-ui, sans-serif">
          / 100
        </text>
      </svg>
    </div>
  );
}
