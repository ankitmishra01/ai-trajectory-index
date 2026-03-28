"use client";

import { useState, useCallback } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from "recharts";
import type { EnrichedAdoption } from "@/lib/adoption";

interface Props {
  data: EnrichedAdoption[];
}

function quadrant(readiness: number, adoption: number) {
  if (readiness >= 50 && adoption >= 50) return "leaders";
  if (readiness < 50  && adoption >= 50) return "leapfroggers";
  if (readiness >= 50 && adoption < 50)  return "underutilisers";
  return "laggards";
}

const QUAD_COLORS: Record<string, string> = {
  leaders:       "#4ade80",
  leapfroggers:  "#60a5fa",
  underutilisers:"#f59e0b",
  laggards:      "#f87171",
};

const QUAD_LABELS: Record<string, string> = {
  leaders:       "AI Leaders",
  leapfroggers:  "Leapfroggers",
  underutilisers:"Underutilisers",
  laggards:      "Laggards",
};

// Custom dot renderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload, activeSlug } = props;
  if (cx == null || cy == null) return null;
  const q = quadrant(payload.readiness_total, payload.adoption_total);
  const color = QUAD_COLORS[q];
  const isActive = payload.slug === activeSlug;
  return (
    <circle
      cx={cx} cy={cy}
      r={isActive ? 7 : 4}
      fill={color}
      fillOpacity={isActive ? 1 : 0.7}
      stroke={isActive ? "#fff" : "none"}
      strokeWidth={isActive ? 1.5 : 0}
      style={{ cursor: "pointer" }}
    />
  );
}

// Custom tooltip
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: EnrichedAdoption = payload[0]?.payload;
  if (!d) return null;
  const q = quadrant(d.readiness_total, d.adoption_total);
  const color = QUAD_COLORS[q];
  const gapLabel = d.adoption_gap > 2
    ? `+${d.adoption_gap} pts above readiness`
    : d.adoption_gap < -2
    ? `${d.adoption_gap} pts below readiness`
    : "Aligned with readiness";
  return (
    <div className="rounded-xl p-3 text-xs shadow-2xl"
      style={{ background: "var(--surface)", border: `1px solid ${color}44`, minWidth: 180 }}>
      <p className="font-black text-sm mb-1">{d.flag} {d.name}</p>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
          {QUAD_LABELS[q]}
        </span>
      </div>
      <div className="space-y-0.5" style={{ color: "var(--text-2)" }}>
        <p>Readiness: <strong style={{ color: "var(--text-1)" }}>{d.readiness_total}/100</strong></p>
        <p>Adoption: <strong style={{ color: "var(--text-1)" }}>{d.adoption_total}/100</strong></p>
        <p className="mt-1 text-[10px]" style={{ color: d.adoption_gap >= 0 ? "#4ade80" : "#f59e0b" }}>
          {gapLabel}
        </p>
      </div>
    </div>
  );
}

export default function GapMatrix({ data }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const chartData = data.map((d) => ({
    ...d,
    x: d.readiness_total,
    y: d.adoption_total,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback((payload: any) => {
    if (payload?.activePayload?.[0]?.payload?.slug) {
      window.location.href = `/country/${payload.activePayload[0].payload.slug}`;
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback((payload: any) => {
    const slug = payload?.activePayload?.[0]?.payload?.slug ?? null;
    setActiveSlug(slug);
  }, []);

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)" }}>
          The Gap Matrix
        </h2>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Readiness vs Adoption — where each country actually sits · Click any dot to open country profile
        </p>
      </div>

      {/* Quadrant legend */}
      <div className="px-6 sm:px-8 pt-4 flex flex-wrap gap-3">
        {Object.entries(QUAD_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-2)" }}>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: QUAD_COLORS[key] }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs ml-auto" style={{ color: "var(--text-3)" }}>
          <span className="w-8 h-px border-t border-dashed" style={{ borderColor: "rgba(148,163,184,.4)" }} />
          Parity line
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 sm:px-6 pt-2 pb-6" style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 30, bottom: 30, left: 10 }}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,.08)" />
            <XAxis
              type="number" dataKey="x" domain={[0, 100]} name="Readiness"
              tick={{ fontSize: 11, fill: "var(--text-3)" }}
              tickLine={false} axisLine={{ stroke: "var(--border)" }}
            >
              <Label value="Readiness Score →" position="insideBottom" offset={-15}
                style={{ fontSize: 11, fill: "var(--text-3)" }} />
            </XAxis>
            <YAxis
              type="number" dataKey="y" domain={[0, 100]} name="Adoption"
              tick={{ fontSize: 11, fill: "var(--text-3)" }}
              tickLine={false} axisLine={{ stroke: "var(--border)" }}
            >
              <Label value="Adoption Score →" angle={-90} position="insideLeft" offset={20}
                style={{ fontSize: 11, fill: "var(--text-3)" }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={false} />

            {/* Parity line (y = x) */}
            <ReferenceLine
              segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
              stroke="rgba(148,163,184,.35)"
              strokeDasharray="4 4"
            />
            {/* Quadrant dividers */}
            <ReferenceLine x={50} stroke="rgba(59,130,246,.12)" />
            <ReferenceLine y={50} stroke="rgba(59,130,246,.12)" />

            {/* Quadrant labels at corners */}
            <ReferenceLine x={0} stroke="none">
              <Label value="◀ Low Readiness" position="insideTopLeft"
                style={{ fontSize: 9, fill: "rgba(148,163,184,.4)" }} />
            </ReferenceLine>

            <Scatter
              data={chartData}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              shape={(props: any) => <CustomDot {...props} activeSlug={activeSlug} />}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Quadrant summary pills */}
      <div className="px-6 sm:px-8 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "leaders", label: "AI Leaders", desc: "High readiness + High adoption", q: [50, 100, 50, 100] },
          { key: "leapfroggers", label: "Leapfroggers", desc: "Low readiness + High adoption", q: [0, 50, 50, 100] },
          { key: "underutilisers", label: "Underutilisers", desc: "High readiness + Low adoption", q: [50, 100, 0, 50] },
          { key: "laggards", label: "Laggards", desc: "Low readiness + Low adoption", q: [0, 50, 0, 50] },
        ].map(({ key, label, desc, q }) => {
          const count = data.filter((d) => {
            const rLow = q[0], rHigh = q[1], aLow = q[2], aHigh = q[3];
            return d.readiness_total >= rLow && d.readiness_total < rHigh &&
                   d.adoption_total >= aLow && d.adoption_total < aHigh;
          }).length;
          const color = QUAD_COLORS[key];
          return (
            <div key={key} className="rounded-xl p-3"
              style={{ background: `${color}0d`, border: `1px solid ${color}33` }}>
              <p className="text-xs font-bold mb-0.5" style={{ color }}>{label}</p>
              <p className="text-lg font-black mb-0.5" style={{ color: "var(--text-1)" }}>{count}</p>
              <p className="text-[10px] leading-tight" style={{ color: "var(--text-3)" }}>{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
