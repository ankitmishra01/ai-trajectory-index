"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import staticData from "@/data/countries.json";

const AXES = [
  { key: "total_score",       label: "Total Readiness Score", max: 100 },
  { key: "infrastructure",    label: "Infrastructure",         max: 20  },
  { key: "talent",            label: "Talent",                 max: 20  },
  { key: "governance",        label: "Governance",             max: 20  },
  { key: "investment",        label: "Investment",             max: 20  },
  { key: "economic_readiness",label: "Economic Readiness",     max: 20  },
] as const;

type AxisKey = typeof AXES[number]["key"];

const REGION_COLORS: Record<string, string> = {
  "Americas":            "#3b82f6",
  "Europe":              "#8b5cf6",
  "Asia-Pacific":        "#22c55e",
  "Middle East & Africa":"#f59e0b",
};

function getValue(country: typeof staticData.countries[0], key: AxisKey): number {
  if (key === "total_score") return country.total_score;
  return country.scores[key as keyof typeof country.scores].score;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const color = REGION_COLORS[payload.region] ?? "#94a3b8";
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={1} />
      <text x={cx + 7} y={cy + 4} fontSize={9} fill={color} fillOpacity={0.85}>{payload.flag}</text>
    </g>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-2xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
      <p className="font-bold mb-1" style={{ color: "var(--text-1)" }}>{d.flag} {d.name}</p>
      <p>{d.xLabel}: <span className="font-semibold">{d.xVal}</span></p>
      <p>{d.yLabel}: <span className="font-semibold">{d.yVal}</span></p>
      <p style={{ color: "var(--text-3)" }}>{d.region}</p>
    </div>
  );
}

export default function ExplorePage() {
  const [xKey, setXKey] = useState<AxisKey>("total_score");
  const [yKey, setYKey] = useState<AxisKey>("governance");
  const [hovered, setHovered] = useState<string | null>(null);
  const [region, setRegion] = useState<string>("All");

  const xAxis = AXES.find((a) => a.key === xKey)!;
  const yAxis = AXES.find((a) => a.key === yKey)!;

  const data = useMemo(() =>
    staticData.countries
      .filter((c) => region === "All" || c.region === region)
      .map((c) => ({
        slug:   c.slug,
        name:   c.name,
        flag:   c.flag,
        region: c.region,
        xVal:   getValue(c, xKey),
        yVal:   getValue(c, yKey),
        xLabel: xAxis.label,
        yLabel: yAxis.label,
      })),
    [xKey, yKey, region, xAxis.label, yAxis.label]
  );

  const xMid = xAxis.max / 2;
  const yMid = yAxis.max / 2;

  const regions = ["All", ...Array.from(new Set(staticData.countries.map((c) => c.region)))];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="page-glow" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.92)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: "var(--text-3)" }}>← Index</Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Scatter Explorer
          </span>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Controls */}
        <div className="card rounded-2xl p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>X Axis</p>
              <select value={xKey} onChange={(e) => setXKey(e.target.value as AxisKey)}
                className="input-base w-full cursor-pointer"
                style={{ background: "var(--raised)", color: "var(--text-1)" }}>
                {AXES.filter((a) => a.key !== yKey).map((a) => (
                  <option key={a.key} value={a.key} style={{ background: "var(--surface)" }}>{a.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Y Axis</p>
              <select value={yKey} onChange={(e) => setYKey(e.target.value as AxisKey)}
                className="input-base w-full cursor-pointer"
                style={{ background: "var(--raised)", color: "var(--text-1)" }}>
                {AXES.filter((a) => a.key !== xKey).map((a) => (
                  <option key={a.key} value={a.key} style={{ background: "var(--surface)" }}>{a.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Region</p>
              <select value={region} onChange={(e) => setRegion(e.target.value)}
                className="input-base w-full cursor-pointer"
                style={{ background: "var(--raised)", color: "var(--text-1)" }}>
                {regions.map((r) => (
                  <option key={r} value={r} style={{ background: "var(--surface)" }}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Region legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            {Object.entries(REGION_COLORS).map(([r, color]) => (
              <div key={r} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plot */}
        <div className="card rounded-2xl p-5">
          <p className="text-xs mb-4 text-center" style={{ color: "var(--text-3)" }}>
            {data.length} countries · click a dot to open its profile
          </p>
          <ResponsiveContainer width="100%" height={480}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis
                type="number" dataKey="xVal" name={xAxis.label}
                domain={[0, xAxis.max]}
                tick={{ fill: "var(--text-3)", fontSize: 11 }}
                label={{ value: xAxis.label, position: "insideBottom", offset: -10, fill: "var(--text-3)", fontSize: 11 }}
              />
              <YAxis
                type="number" dataKey="yVal" name={yAxis.label}
                domain={[0, yAxis.max]}
                tick={{ fill: "var(--text-3)", fontSize: 11 }}
                label={{ value: yAxis.label, angle: -90, position: "insideLeft", fill: "var(--text-3)", fontSize: 11 }}
              />
              <ReferenceLine x={xMid} stroke="rgba(255,255,255,.08)" strokeDasharray="4 4" />
              <ReferenceLine y={yMid} stroke="rgba(255,255,255,.08)" strokeDasharray="4 4" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={data}
                shape={<CustomDot />}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(d: any) => { if (d?.slug) window.open(`/country/${d.slug}`, "_self"); }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onMouseEnter={(d: any) => setHovered(d?.slug ?? null)}
                onMouseLeave={() => setHovered(null)}
              />
            </ScatterChart>
          </ResponsiveContainer>
          {hovered && (() => {
            const c = staticData.countries.find((x) => x.slug === hovered);
            if (!c) return null;
            return (
              <p className="text-center text-xs mt-2" style={{ color: "var(--text-3)" }}>
                {c.flag} <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{c.name}</span> — click to view profile
              </p>
            );
          })()}
        </div>
      </div>
    </main>
  );
}
