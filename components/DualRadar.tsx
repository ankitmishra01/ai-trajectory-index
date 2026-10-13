"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Legend, ResponsiveContainer, Tooltip,
} from "recharts";
import type { ScoredCountry } from "@/lib/types";
import type { AdoptionEntry } from "@/lib/adoption";

interface Props {
  country: ScoredCountry;
  adoption: AdoptionEntry;
}

export default function DualRadar({ country, adoption }: Props) {
  // Each axis pairs the closest conceptual readiness↔adoption dimension.
  // Labels show both sides so the comparison is legible.
  const data = [
    {
      subject: "Infra / Gov",          // Infrastructure readiness vs Government deployment
      readiness: country.scores.infrastructure.score,
      adoption: adoption.adoption_scores.government,
    },
    {
      subject: "Talent / Demand",      // Talent readiness vs Talent demand in labour market
      readiness: country.scores.talent.score,
      adoption: adoption.adoption_scores.talent_demand,
    },
    {
      subject: "Governance / Enterprise", // Policy governance vs Enterprise AI adoption
      readiness: country.scores.governance.score,
      adoption: adoption.adoption_scores.enterprise,
    },
    {
      subject: "Investment / Pipeline", // Investment readiness vs R&D-to-product pipeline
      readiness: country.scores.investment.score,
      adoption: adoption.adoption_scores.pipeline,
    },
    {
      subject: "Economy / Consumer",   // Economic readiness vs Consumer AI usage
      readiness: country.scores.economic_readiness.score,
      adoption: adoption.adoption_scores.consumer,
    },
  ];
  const chartAvailable = data.every((item) => Number.isFinite(item.readiness) && Number.isFinite(item.adoption));
  const chartLabel = `${country.name} readiness and adoption comparison. Readiness scores range from ${Math.min(...data.map((item) => item.readiness))} to ${Math.max(...data.map((item) => item.readiness))} out of 20. Adoption scores range from ${Math.min(...data.map((item) => item.adoption))} to ${Math.max(...data.map((item) => item.adoption))} out of 20.`;

  return (
    <div className="card rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Readiness vs Adoption: Radar
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
          Blue = readiness capacity · Green = active adoption · Each axis pairs the closest dimension from each framework
        </p>
      </div>
      <div className="dual-radar-frame" role="img" aria-label={chartLabel}>
        {chartAvailable ? (
          <ResponsiveContainer width="100%" height={280} minWidth={260} minHeight={280}>
          <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="rgba(59,130,246,.12)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: "var(--text-3)" }}
            />
            <Radar
              name="Readiness"
              dataKey="readiness"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Radar
              name="Adoption"
              dataKey="adoption"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 11, color: "var(--text-2)" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--text-1)",
              }}
            />
          </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="dual-radar-unavailable">Radar data is not available. Use the table below for the published pillar values.</div>
        )}
      </div>
      <table className="sr-only">
        <caption>{country.name} readiness and adoption comparison</caption>
        <thead><tr><th scope="col">Dimension pair</th><th scope="col">Readiness</th><th scope="col">Adoption</th></tr></thead>
        <tbody>{data.map((item) => <tr key={item.subject}><th scope="row">{item.subject}</th><td>{item.readiness}/20</td><td>{item.adoption}/20</td></tr>)}</tbody>
      </table>
    </div>
  );
}
