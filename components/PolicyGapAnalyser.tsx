"use client";

import { useState, useMemo } from "react";
import type { ScoredCountry } from "@/lib/types";
import policiesRaw from "@/data/ai-policies.json";

type PolicyData = {
  has_national_ai_strategy: boolean;
  strategy_year: number | null;
  has_ai_regulation: boolean;
  oecd_member: boolean;
};

const PILLARS = [
  { key: "infrastructure",     label: "Infrastructure",     color: "#3b82f6" },
  { key: "talent",             label: "Talent",             color: "#8b5cf6" },
  { key: "governance",         label: "Governance",         color: "#06b6d4" },
  { key: "investment",         label: "Investment",         color: "#f59e0b" },
  { key: "economic_readiness", label: "Economic Readiness", color: "#22c55e" },
] as const;

type PillarKey = typeof PILLARS[number]["key"];

interface Props {
  country: ScoredCountry;
  allCountries: ScoredCountry[];
}

export default function PolicyGapAnalyser({ country, allCountries }: Props) {
  const [open, setOpen] = useState(false);

  const policy = (policiesRaw as Record<string, PolicyData>)[country.slug];

  const regionPeers = useMemo(
    () => allCountries.filter((c) => c.region === country.region && c.slug !== country.slug),
    [allCountries, country.region, country.slug]
  );

  const regionalAvg = useMemo(
    () => Object.fromEntries(
      PILLARS.map((p) => [
        p.key,
        regionPeers.length
          ? Math.round((regionPeers.reduce((s, c) => s + c.scores[p.key as PillarKey].score, 0) / regionPeers.length) * 10) / 10
          : 0,
      ])
    ) as Record<PillarKey, number>,
    [regionPeers]
  );

  const gaps = useMemo(
    () => PILLARS
      .map((p) => ({
        ...p,
        score: country.scores[p.key as PillarKey].score,
        avg: regionalAvg[p.key as PillarKey],
        gap: country.scores[p.key as PillarKey].score - regionalAvg[p.key as PillarKey],
      }))
      .filter((g) => g.gap <= -2)
      .sort((a, b) => a.gap - b.gap),
    [country.scores, regionalAvg]
  );

  const policyFlags = useMemo(() => {
    if (!policy) return [];
    const flags: { label: string; pts: string; detail: string }[] = [];
    if (!policy.has_national_ai_strategy) {
      flags.push({ label: "No national AI strategy", pts: "+3–5 pts", detail: "Adopting a published AI strategy adds up to 5 governance points and unlocks the post-2022 recency bonus." });
    } else if (policy.strategy_year && policy.strategy_year < 2020) {
      flags.push({ label: `AI strategy outdated (${policy.strategy_year})`, pts: "+2 pts", detail: "Updating to a post-2020 strategy unlocks the recency bonus scored in governance." });
    }
    if (!policy.has_ai_regulation) {
      flags.push({ label: "No AI-specific regulation", pts: "+3 pts", detail: "An AI regulation or comprehensive data-protection law adds 3 governance points." });
    }
    if (!policy.oecd_member) {
      flags.push({ label: "Non-OECD member", pts: "+3 pts", detail: "OECD membership (or adherence to OECD AI Principles) is used as a proxy for institutional regulatory capacity." });
    }
    return flags;
  }, [policy]);

  const hasSomethingToShow = gaps.length > 0 || policyFlags.length > 0;
  if (!hasSomethingToShow) return null;

  const govGap = gaps.find((g) => g.key === "governance");

  return (
    <div className="card rounded-2xl overflow-hidden">
      <button
        className="w-full px-6 sm:px-8 py-5 flex items-center justify-between text-left"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Policy Gap Analysis
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(251,191,36,.10)", color: "#fcd34d", border: "1px solid rgba(251,191,36,.25)" }}>
              {gaps.length + policyFlags.length} gap{gaps.length + policyFlags.length !== 1 ? "s" : ""} identified
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Pillars below {country.region} average · actionable policy levers
          </p>
        </div>
        <span className={`text-sm transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-3)" }}>↓</span>
      </button>

      {open && (
        <div className="px-6 sm:px-8 pb-6">

          {/* Pillar gaps vs regional average */}
          {gaps.length > 0 && (
            <div className="space-y-4 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                Below Regional Average
              </p>
              {gaps.map(({ key, label, color, score, avg, gap }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{label}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span style={{ color: "var(--text-3)" }}>Region avg: <span className="font-bold">{avg}/20</span></span>
                      <span className="font-black" style={{ color }}>{score}/20</span>
                      <span className="font-bold" style={{ color: "#f87171" }}>({gap.toFixed(1)})</span>
                    </div>
                  </div>
                  {/* Dual bar: region avg (dim) vs actual (bright) */}
                  <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--raised)" }}>
                    <div className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${(avg / 20) * 100}%`, background: `${color}30` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${(score / 20) * 100}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Policy flags — governance specific */}
          {policyFlags.length > 0 && (
            <div className="mt-5 pt-4" style={{ borderTop: gaps.length > 0 ? "1px solid var(--border)" : "none" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
                Governance Policy Levers
                {govGap && (
                  <span className="ml-2 normal-case font-normal" style={{ color: "#f87171" }}>
                    (governance {govGap.score}/20 vs {govGap.avg}/20 regional avg)
                  </span>
                )}
              </p>
              <div className="space-y-3">
                {policyFlags.map(({ label, pts, detail }) => (
                  <div key={label} className="rounded-xl p-3.5"
                    style={{ background: "rgba(6,182,212,.05)", border: "1px solid rgba(6,182,212,.15)" }}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{label}</span>
                      <span className="text-xs font-black flex-shrink-0 px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(6,182,212,.12)", color: "#67e8f9", border: "1px solid rgba(6,182,212,.25)" }}>
                        {pts}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] mt-4 pt-3" style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
            Gaps shown relative to {country.region} regional average across {regionPeers.length + 1} economies.
            Point estimates are indicative — actual score changes depend on live World Bank data.
          </p>
        </div>
      )}
    </div>
  );
}
