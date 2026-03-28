"use client";

import type { ScoredCountry } from "@/lib/types";

interface Props {
  country: ScoredCountry;
}

// ── Phase classification ────────────────────────────────────────────────────

type Phase = "Foundation" | "Development" | "Acceleration" | "Leadership";

function getPhase(score: number): Phase {
  if (score >= 75) return "Leadership";
  if (score >= 60) return "Acceleration";
  if (score >= 40) return "Development";
  return "Foundation";
}

const PHASE_META: Record<Phase, { color: string; bg: string; border: string; icon: string; desc: string }> = {
  Foundation:    { color: "#f59e0b", bg: "rgba(245,158,11,.08)",  border: "rgba(245,158,11,.25)",  icon: "◈", desc: "Building core digital and institutional capabilities" },
  Development:   { color: "#60a5fa", bg: "rgba(96,165,250,.08)",  border: "rgba(96,165,250,.25)",  icon: "◉", desc: "Scaling infrastructure and talent pipelines" },
  Acceleration:  { color: "#a78bfa", bg: "rgba(167,139,250,.08)", border: "rgba(167,139,250,.25)", icon: "◎", desc: "Deploying AI at scale across key sectors" },
  Leadership:    { color: "#4ade80", bg: "rgba(74,222,128,.08)",  border: "rgba(74,222,128,.25)",  icon: "◉", desc: "Setting global norms and frontier research" },
};

// ── Pillar action library ───────────────────────────────────────────────────

const PILLAR_LABELS: Record<string, string> = {
  infrastructure:    "Digital Infrastructure",
  talent:            "AI Talent",
  governance:        "Governance & Policy",
  investment:        "Investment & R&D",
  economic_readiness: "Economic Readiness",
};

const PILLAR_ICONS: Record<string, string> = {
  infrastructure:    "⬡",
  talent:            "◈",
  governance:        "⬟",
  investment:        "◇",
  economic_readiness: "⬠",
};

function getPillarActions(pillar: string, score: number): { nearTerm: string; midTerm: string } {
  if (pillar === "infrastructure") {
    if (score < 7)  return { nearTerm: "Launch national broadband expansion programme; target 50% fixed-line coverage", midTerm: "Deploy sovereign AI compute infrastructure and edge networks in major cities" };
    if (score < 12) return { nearTerm: "Extend rural connectivity and reduce mobile data costs below $2/GB", midTerm: "Build national data centre capacity and connect to international internet exchanges" };
    return         { nearTerm: "Upgrade backbone to sub-10ms latency for AI inference workloads", midTerm: "Establish distributed GPU cluster available to domestic researchers and startups" };
  }
  if (pillar === "talent") {
    if (score < 7)  return { nearTerm: "Launch emergency AI literacy curriculum across secondary schools", midTerm: "Establish 3 national AI institutes with full-tuition scholarships for STEM graduates" };
    if (score < 12) return { nearTerm: "Create fast-track AI visa pathway; incentivise diaspora return", midTerm: "Fund 500 PhD fellowships in ML, data science, and AI safety per year" };
    return         { nearTerm: "Expand elite research cohorts; partner with top-10 global universities", midTerm: "Develop specialised AI talent in healthcare, agriculture, and climate sectors" };
  }
  if (pillar === "governance") {
    if (score < 7)  return { nearTerm: "Adopt a national AI strategy with measurable 3-year milestones", midTerm: "Establish independent AI regulator with statutory powers and public accountability" };
    if (score < 12) return { nearTerm: "Publish risk-tiered AI regulation framework aligned with EU AI Act principles", midTerm: "Create cross-ministry AI coordination body with dedicated budget line" };
    return         { nearTerm: "Lead multilateral AI safety standards at G20 / GPAI forums", midTerm: "Establish domestic AI audit and certification infrastructure for high-risk systems" };
  }
  if (pillar === "investment") {
    if (score < 7)  return { nearTerm: "Launch government-backed AI seed fund (≥$50M) for domestic startups", midTerm: "Negotiate bilateral R&D agreements with OECD partners; join CERN or equivalent" };
    if (score < 12) return { nearTerm: "Introduce R&D tax credits (≥25%) for AI-related expenditure", midTerm: "Create sovereign AI venture fund targeting deep-tech Series A/B rounds" };
    return         { nearTerm: "Anchor a global AI investment hub with special economic zone incentives", midTerm: "Co-invest with pension funds in frontier AI labs and semiconductor supply chain" };
  }
  // economic_readiness
  if (score < 7)  return { nearTerm: "Expand financial inclusion; target 80% banked population by 2026", midTerm: "Develop AI-driven export diversification strategy beyond primary commodities" };
  if (score < 12) return { nearTerm: "Streamline business registration to under 3 days; digitise government services", midTerm: "Negotiate AI services trade agreements; join WTO plurilateral digital trade talks" };
  return         { nearTerm: "Leverage high productivity base to fund AI adoption subsidies for SMEs", midTerm: "Position as regional AI services hub; target $1B+ in AI-related services exports" };
}

// ── Timeline milestones ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getMilestones(phase: Phase, _projectedScore?: number): string[] {
  const base: Record<Phase, string[]> = {
    Foundation: [
      "National AI strategy adopted",
      "Digital connectivity baseline met",
      "First national AI lab established",
    ],
    Development: [
      "Talent pipeline scaling to 1,000+ AI graduates/yr",
      "AI regulation framework published",
      "Domestic AI investment exceeds 0.5% GDP",
    ],
    Acceleration: [
      "AI deployed across 3+ key sectors",
      "Sovereign AI compute capacity online",
      "International AI partnerships active",
    ],
    Leadership: [
      "Contributing to global AI safety standards",
      "Frontier research output in top 10 globally",
      "AI sector generating >2% of GDP",
    ],
  };
  return base[phase];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CountryRoadmap({ country }: Props) {
  const phase = getPhase(country.total_score);
  const phaseMeta = PHASE_META[phase];
  const projectedPhase = getPhase(country.projected_score_2028);
  const projectedMeta = PHASE_META[projectedPhase];

  // Find 3 weakest pillars
  const pillars = [
    { key: "infrastructure",    score: country.scores.infrastructure.score,    maxPts: 20 },
    { key: "talent",            score: country.scores.talent.score,            maxPts: 20 },
    { key: "governance",        score: country.scores.governance.score,        maxPts: 20 },
    { key: "investment",        score: country.scores.investment.score,        maxPts: 20 },
    { key: "economic_readiness", score: country.scores.economic_readiness.score, maxPts: 20 },
  ] as const;

  const sorted = [...pillars].sort((a, b) => a.score - b.score);
  const weakest = sorted.slice(0, 3);

  const milestones = getMilestones(phase, country.projected_score_2028);
  const phaseAdvancing = phase !== projectedPhase;

  // Timeline steps
  const steps = [
    { label: "Now", sublabel: `Score ${country.total_score}`, active: true },
    { label: "2025–26", sublabel: milestones[0] },
    { label: "2026–27", sublabel: milestones[1] },
    { label: "2028", sublabel: milestones[2] },
  ];

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 py-5 flex items-start justify-between gap-4"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            AI Development Roadmap
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Algorithmic roadmap based on pillar scores · Updated with live data
          </p>
        </div>
        {/* Phase badge */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: phaseMeta.bg, border: `1px solid ${phaseMeta.border}`, color: phaseMeta.color }}>
          <span>{phaseMeta.icon}</span>
          {phase} Phase
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 space-y-7">

        {/* ── Phase description ── */}
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: phaseMeta.bg, border: `1px solid ${phaseMeta.border}` }}>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: phaseMeta.color }}>
              {country.name} is in the {phase} Phase
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              {phaseMeta.desc}.
              {phaseAdvancing && (
                <> On current trajectory, <strong style={{ color: projectedMeta.color }}>{country.name} enters the {projectedPhase} phase by 2028</strong> (projected score: {country.projected_score_2028}/100).</>
              )}
              {!phaseAdvancing && (
                <> Projected score by 2028: <strong style={{ color: phaseMeta.color }}>{country.projected_score_2028}/100</strong>.</>
              )}
            </p>
          </div>
        </div>

        {/* ── Timeline ── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
            2028 Timeline
          </p>
          <div className="relative">
            {/* Track line */}
            <div className="absolute top-3 left-3 right-3 h-px" style={{ background: "var(--border-mid)" }} />
            {/* Progress fill */}
            <div className="absolute top-3 left-3 h-px"
              style={{
                width: "8%",
                background: `linear-gradient(90deg, ${phaseMeta.color}, ${phaseMeta.color}88)`,
              }} />
            <div className="relative flex justify-between">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center" style={{ width: "25%" }}>
                  {/* Node */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black mb-2 relative z-10"
                    style={
                      i === 0
                        ? { background: phaseMeta.color, color: "#000", boxShadow: `0 0 10px ${phaseMeta.color}66` }
                        : i === steps.length - 1
                        ? { background: projectedMeta.bg, border: `2px solid ${projectedMeta.color}`, color: projectedMeta.color }
                        : { background: "var(--raised)", border: "1px solid var(--border-mid)", color: "var(--text-3)" }
                    }>
                    {i === 0 ? "▶" : i + 1}
                  </div>
                  <p className="text-[10px] font-bold text-center" style={{ color: i === 0 ? phaseMeta.color : "var(--text-2)" }}>
                    {step.label}
                  </p>
                  <p className="text-[9px] text-center leading-tight mt-0.5 px-1" style={{ color: "var(--text-3)" }}>
                    {step.sublabel}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Priority actions ── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Priority Actions — 3 Weakest Pillars
          </p>
          <div className="space-y-3">
            {weakest.map(({ key, score, maxPts }) => {
              const actions = getPillarActions(key, score);
              const pct = (score / maxPts) * 100;
              return (
                <div key={key} className="rounded-xl p-4" style={{ background: "var(--raised)", border: "1px solid var(--border)" }}>
                  {/* Pillar header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: "var(--accent)" }}>{PILLAR_ICONS[key]}</span>
                      <span className="text-xs font-bold" style={{ color: "var(--text-1)" }}>{PILLAR_LABELS[key]}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: "var(--text-3)" }}>{score}/{maxPts}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full mb-3" style={{ background: "var(--border-mid)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct < 40 ? "#ef4444" : pct < 65 ? "#f59e0b" : "var(--accent)" }} />
                  </div>
                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(96,165,250,.10)", color: "var(--accent)", border: "1px solid rgba(96,165,250,.20)" }}>
                        Near
                      </span>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{actions.nearTerm}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(167,139,250,.10)", color: "#a78bfa", border: "1px solid rgba(167,139,250,.20)" }}>
                        Mid
                      </span>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{actions.midTerm}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-[10px]" style={{ color: "var(--text-3)", opacity: 0.6 }}>
          Roadmap generated algorithmically from pillar scores and World Bank data. Actions are indicative policy priorities, not official government plans.
        </p>

      </div>
    </div>
  );
}
