"use client";

import { useState } from "react";
import type { ScoredCountry } from "@/lib/types";

interface Props {
  countries: ScoredCountry[];
  globalRanks: Record<string, number>;
}

function scoreBandLabel(score: number): string {
  if (score >= 80) return "Leading";
  if (score >= 60) return "Advanced";
  if (score >= 40) return "Developing";
  return "Nascent";
}

function buildCSV(countries: ScoredCountry[], globalRanks: Record<string, number>): string {
  const headers = [
    "Rank", "Country", "Flag", "Region",
    "Score", "Infrastructure", "Talent", "Governance", "Investment", "Economic_Readiness",
    "Tier", "Trajectory", "Trajectory_Score",
    "Projected_2028", "Point_Change",
  ];

  const rows = [...countries]
    .sort((a, b) => (globalRanks[a.slug] ?? 999) - (globalRanks[b.slug] ?? 999))
    .map((c) => [
      globalRanks[c.slug] ?? "",
      `"${c.name}"`,
      c.flag,
      `"${c.region}"`,
      c.total_score,
      c.scores.infrastructure.score,
      c.scores.talent.score,
      c.scores.governance.score,
      c.scores.investment.score,
      c.scores.economic_readiness.score,
      scoreBandLabel(c.total_score),
      `"${c.trajectory_label}"`,
      c.trajectory_score,
      c.projected_score_2028,
      c.projected_score_2028 - c.total_score,
    ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function buildJSON(countries: ScoredCountry[], globalRanks: Record<string, number>) {
  return JSON.stringify(
    {
      title: "AI Trajectory Index 2026",
      source: "https://ai-index.ankitmishra.ca",
      generated: new Date().toISOString(),
      countries: [...countries]
        .sort((a, b) => (globalRanks[a.slug] ?? 999) - (globalRanks[b.slug] ?? 999))
        .map((c) => ({
          rank: globalRanks[c.slug] ?? null,
          slug: c.slug,
          name: c.name,
          flag: c.flag,
          region: c.region,
          total_score: c.total_score,
          tier: scoreBandLabel(c.total_score),
          scores: {
            infrastructure: c.scores.infrastructure.score,
            talent: c.scores.talent.score,
            governance: c.scores.governance.score,
            investment: c.scores.investment.score,
            economic_readiness: c.scores.economic_readiness.score,
          },
          trajectory: {
            label: c.trajectory_label,
            score: c.trajectory_score,
            projected_2028: c.projected_score_2028,
            point_change: c.projected_score_2028 - c.total_score,
          },
        })),
    },
    null,
    2
  );
}

function triggerDownload(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton({ countries, globalRanks }: Props) {
  const [open, setOpen] = useState(false);

  function downloadCSV() {
    triggerDownload(buildCSV(countries, globalRanks), "ai_trajectory_index_2026_data.csv", "text/csv");
    setOpen(false);
  }

  function downloadJSON() {
    triggerDownload(buildJSON(countries, globalRanks), "ai_trajectory_index_2026_data.json", "application/json");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: 160 }}>
            <button
              onClick={downloadCSV}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-left transition-colors"
              style={{ color: "var(--text-1)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--raised)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV
            </button>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <button
              onClick={downloadJSON}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-left transition-colors"
              style={{ color: "var(--text-1)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--raised)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Download JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
