"use client";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function getColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size * 0.38;
  const strokeWidth = size * 0.08;

  // Arc spans from -210° to 30° (240° sweep) centred on bottom
  const startAngle = -210;
  const endAngle = 30;
  const totalSpan = endAngle - startAngle; // 240

  const filledEnd = startAngle + (score / 100) * totalSpan;

  const bgPath = arcPath(cx, cy, r, startAngle, endAngle);
  const fillPath = arcPath(cx, cy, r, startAngle, filledEnd);

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="#1c2847"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {score > 0 && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size * 0.2}
          fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + size * 0.16}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#64748b"
          fontSize={size * 0.08}
          fontFamily="Inter, system-ui, sans-serif"
        >
          / 100
        </text>
      </svg>
    </div>
  );
}
