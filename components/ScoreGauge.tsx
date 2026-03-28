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

function getGlowColor(score: number) {
  if (score >= 80) return "rgba(34,197,94,0.5)";
  if (score >= 60) return "rgba(59,130,246,0.5)";
  if (score >= 40) return "rgba(245,158,11,0.5)";
  return "rgba(239,68,68,0.5)";
}

export default function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size * 0.38;
  const strokeWidth = size * 0.075;

  const startAngle = -210;
  const endAngle = 30;
  const totalSpan = endAngle - startAngle;

  const filledEnd = startAngle + (score / 100) * totalSpan;

  const bgPath = arcPath(cx, cy, r, startAngle, endAngle);
  const fillPath = arcPath(cx, cy, r, startAngle, filledEnd);

  const color = getColor(score);
  const glowColor = getGlowColor(score);
  const filterId = `gauge-glow-${size}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="#1a2540"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Glow layer */}
        {score > 0 && (
          <path
            d={fillPath}
            fill="none"
            stroke={glowColor}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            style={{ filter: `blur(6px)` }}
            opacity={0.6}
          />
        )}

        {/* Filled arc */}
        {score > 0 && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Score text */}
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="900"
          fontFamily="Inter, system-ui, sans-serif"
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + size * 0.17}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#475569"
          fontSize={size * 0.08}
          fontFamily="Inter, system-ui, sans-serif"
        >
          / 100
        </text>
      </svg>
    </div>
  );
}
