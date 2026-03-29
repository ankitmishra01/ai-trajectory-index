"use client";

// Renders a mini sparkline of estimated score trend over the past 5 quarters.
// Points are extrapolated backward from the current score using the trajectory score.

interface Props {
  score: number;       // current total score (0–100)
  trajectory: number;  // trajectory score (–10 to +10)
  width?: number;
  height?: number;
}

function generatePoints(score: number, trajectory: number, n = 5): number[] {
  // Extrapolate backward: start ~0.4 trajectory-units ago
  const start = Math.max(0, Math.min(100, score - trajectory * 0.4));
  return Array.from({ length: n }, (_, i) =>
    Math.round(start + (score - start) * (i / (n - 1)))
  );
}

export default function ScoreSparkline({ score, trajectory, width = 80, height = 28 }: Props) {
  const pts = generatePoints(score, trajectory);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;

  // Map to SVG coordinates
  const pad = 2;
  const xs = pts.map((_, i) => pad + (i / (pts.length - 1)) * (width - 2 * pad));
  const ys = pts.map((v) => pad + (1 - (v - min) / range) * (height - 2 * pad));

  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(" ");

  // Area fill path
  const areaPath =
    `M ${xs[0]},${ys[0]} ` +
    xs.slice(1).map((x, i) => `L ${x},${ys[i + 1]}`).join(" ") +
    ` L ${xs[xs.length - 1]},${height} L ${xs[0]},${height} Z`;

  const isFlat = Math.abs(trajectory) < 0.5;
  const lineColor = isFlat ? "rgba(148,163,184,.5)" : trajectory > 0 ? "#4ade80" : "#f87171";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`spark-grad-${score}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaPath} fill={`url(#spark-grad-${score})`} />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={2} fill={lineColor} />
    </svg>
  );
}
