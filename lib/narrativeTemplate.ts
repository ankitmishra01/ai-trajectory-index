// Deterministic per-country narrative generator.
//
// This is both (a) the fallback content when every OpenRouter model is
// unavailable, and (b) the "shape contract" the AI prompt in lib/openrouter.ts
// targets — five headed sections, each grounded in real numbers already on
// the ScoredCountry object (static evidence bullets, live World Bank
// indicators when present, policy metadata). No network call, no cost,
// always returns something. Modelled on how g20-economic-dashboard builds
// its per-country brief from data rather than a live LLM call.

import type { ScoredCountry, NarrativeSection } from "./types";

export interface PolicyFacts {
  has_national_ai_strategy?: boolean;
  strategy_year?: number | null;
  has_ai_regulation?: boolean;
  oecd_member?: boolean;
}

function tierLabel(score: number): string {
  if (score >= 80) return "Leading";
  if (score >= 60) return "Advanced";
  if (score >= 40) return "Developing";
  return "Nascent";
}

function fmt(n: number | null | undefined, digits = 1): string | null {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  return n.toFixed(digits).replace(/\.0$/, "");
}

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function pillarMedian(all: ScoredCountry[], key: keyof ScoredCountry["scores"]): number {
  const vals = all.map((c) => c.scores[key].score).sort((a, b) => a - b);
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

/** Build the fact pack used by both the template and the AI prompt. */
export function buildFactPack(
  country: ScoredCountry,
  allCountries: ScoredCountry[],
  policy: PolicyFacts
) {
  const ranked = [...allCountries].sort((a, b) => b.total_score - a.total_score);
  const rank = ranked.findIndex((c) => c.slug === country.slug) + 1;
  const regionPeers = allCountries.filter((c) => c.region === country.region);

  const pillarKeys = ["infrastructure", "talent", "governance", "investment", "economic_readiness"] as const;
  const globalMedians = Object.fromEntries(
    pillarKeys.map((k) => [k, pillarMedian(allCountries, k)])
  ) as Record<(typeof pillarKeys)[number], number>;
  const regionMedians = Object.fromEntries(
    pillarKeys.map((k) => [k, pillarMedian(regionPeers.length ? regionPeers : allCountries, k)])
  ) as Record<(typeof pillarKeys)[number], number>;

  const comparable = (country.comparable_countries ?? [])
    .map((slug) => allCountries.find((c) => c.slug === slug))
    .filter((c): c is ScoredCountry => !!c);

  return {
    country,
    rank,
    totalCountries: allCountries.length,
    tier: tierLabel(country.total_score),
    globalMedians,
    regionMedians,
    regionPeerCount: regionPeers.length,
    comparable,
    policy,
    raw: country.raw_indicators ?? null,
  };
}

export type FactPack = ReturnType<typeof buildFactPack>;

/** Compact bullet-list rendering of the fact pack, fed to the AI prompt so
 *  the model's prose is grounded in the same numbers the template uses. */
export function summarizeFactPack(pack: FactPack): string {
  const { country, rank, totalCountries, tier, globalMedians, comparable, policy, raw } = pack;
  const lines: string[] = [
    `Country: ${country.name} (${country.region})`,
    `Total score: ${country.total_score}/100, rank ${rank} of ${totalCountries}, tier "${tier}"`,
    `Trajectory: ${country.trajectory_label} (${country.trajectory_score}), projected 2028 score ${country.projected_score_2028}/100`,
    `Pillar scores (0-20, global median in parentheses): Infrastructure ${country.scores.infrastructure.score} (${fmt(globalMedians.infrastructure)}), Talent ${country.scores.talent.score} (${fmt(globalMedians.talent)}), Governance ${country.scores.governance.score} (${fmt(globalMedians.governance)}), Investment ${country.scores.investment.score} (${fmt(globalMedians.investment)}), Economic Readiness ${country.scores.economic_readiness.score} (${fmt(globalMedians.economic_readiness)})`,
    `Top accelerator: ${country.top_accelerator}`,
    `Top risk: ${country.top_risk}`,
    `Evidence bullets — Infrastructure: ${country.scores.infrastructure.reasons.join("; ")}`,
    `Evidence bullets — Talent: ${country.scores.talent.reasons.join("; ")}`,
    `Evidence bullets — Governance: ${country.scores.governance.reasons.join("; ")}`,
    `Evidence bullets — Investment: ${country.scores.investment.reasons.join("; ")}`,
    `Evidence bullets — Economic Readiness: ${country.scores.economic_readiness.reasons.join("; ")}`,
    `Policy: national AI strategy ${policy.has_national_ai_strategy ? `yes (${policy.strategy_year ?? "year unknown"})` : "no"}, binding AI regulation ${policy.has_ai_regulation ? "yes" : "no"}, OECD member ${policy.oecd_member ? "yes" : "no"}`,
  ];
  if (comparable.length) {
    lines.push(`Comparable countries: ${comparable.map((c) => `${c.name} (${c.total_score}/100)`).join(", ")}`);
  }
  if (raw) {
    const rawLines = Object.entries(raw)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k}=${typeof v === "number" ? fmt(v, 2) : v}`);
    if (rawLines.length) lines.push(`Live World Bank indicators: ${rawLines.join(", ")}`);
  }
  return lines.join("\n");
}

/** Deterministic 5-section narrative — the fallback and shape contract. */
export function generateStructuredNarrative(pack: FactPack): NarrativeSection[] {
  const { country, rank, totalCountries, tier, globalMedians, regionMedians, comparable, policy, raw } = pack;
  const delta = country.projected_score_2028 - country.total_score;
  const deltaStr = `${delta >= 0 ? "+" : ""}${delta}`;

  // ── 1. Standing & Trajectory ──────────────────────────────────────────
  const compLine = comparable.length
    ? ` It sits closest in overall standing to ${comparable
        .map((c) => `${c.name} (${c.total_score}/100)`)
        .join(" and ")}.`
    : "";
  const standing = `${country.name} scores ${country.total_score}/100 on the AI Trajectory Index, ranking ${ordinal(
    rank
  )} of ${totalCountries} economies tracked and placing it in the "${tier}" tier. Its trajectory is rated "${country.trajectory_label}" (${
    country.trajectory_score >= 0 ? "+" : ""
  }${country.trajectory_score} on a -10 to +10 scale), putting the projected 2028 score at ${
    country.projected_score_2028
  }/100 — a ${deltaStr}-point move from today.${compLine}`;

  // ── 2. Infrastructure & Talent ────────────────────────────────────────
  const infra = country.scores.infrastructure;
  const talent = country.scores.talent;
  const infraVsMedian = infra.score - globalMedians.infrastructure;
  const infraBits: string[] = [];
  if (raw?.broadband_per_100 !== null && raw?.broadband_per_100 !== undefined) {
    infraBits.push(`${fmt(raw.broadband_per_100)} fixed-broadband subscriptions per 100 people`);
  }
  if (raw?.internet_pct !== null && raw?.internet_pct !== undefined) {
    infraBits.push(`${fmt(raw.internet_pct)}% internet penetration`);
  }
  const infraStat = infraBits.length ? ` Current World Bank figures put it at ${infraBits.join(" and ")}.` : "";
  const talentBits: string[] = [];
  if (raw?.tertiary_enrollment_pct !== null && raw?.tertiary_enrollment_pct !== undefined) {
    talentBits.push(`tertiary enrollment of ${fmt(raw.tertiary_enrollment_pct)}%`);
  }
  if (raw?.labor_productivity_ppp !== null && raw?.labor_productivity_ppp !== undefined) {
    talentBits.push(`labour productivity of $${Math.round(raw.labor_productivity_ppp).toLocaleString()} PPP per worker`);
  }
  const talentStat = talentBits.length ? ` On talent, it reports ${talentBits.join(" and ")}.` : "";
  const infraTalent = `Infrastructure scores ${infra.score}/20 (${
    infraVsMedian >= 0 ? "above" : "below"
  } the ${fmt(globalMedians.infrastructure, 1)}/20 global median). ${
    infra.reasons[0] ?? "Its digital access base underpins this score."
  }.${infraStat} Talent scores ${talent.score}/20. ${
    talent.reasons[0] ?? "Its research and education pipeline underpins this score."
  }.${talentStat}`;

  // ── 3. Governance & Policy ────────────────────────────────────────────
  const gov = country.scores.governance;
  const strategyLine = policy.has_national_ai_strategy
    ? `It has a formal national AI strategy in place${policy.strategy_year ? ` (dated ${policy.strategy_year})` : ""}`
    : "It has not yet published a formal national AI strategy";
  const regLine = policy.has_ai_regulation
    ? "and has moved to binding AI-specific regulation, ahead of most peers"
    : "and AI activity is not yet governed by dedicated binding regulation";
  const wgiBits: string[] = [];
  if (raw?.rule_of_law_wgi !== null && raw?.rule_of_law_wgi !== undefined) {
    wgiBits.push(`Rule of Law estimate ${fmt(raw.rule_of_law_wgi, 2)}`);
  }
  if (raw?.gov_effectiveness_wgi !== null && raw?.gov_effectiveness_wgi !== undefined) {
    wgiBits.push(`Government Effectiveness ${fmt(raw.gov_effectiveness_wgi, 2)}`);
  }
  const wgiStat = wgiBits.length ? ` World Governance Indicators score it at ${wgiBits.join(", ")} (range -2.5 to +2.5).` : "";
  const governance = `Governance scores ${gov.score}/20, ${
    gov.score - globalMedians.governance >= 0 ? "above" : "below"
  } the ${fmt(globalMedians.governance, 1)}/20 median. ${strategyLine} ${regLine}. ${
    gov.reasons[0] ?? "Its policy institutions underpin this score."
  }.${wgiStat}`;

  // ── 4. Investment & Capital ───────────────────────────────────────────
  const invest = country.scores.investment;
  const investBits: string[] = [];
  if (raw?.rd_spend_pct_gdp !== null && raw?.rd_spend_pct_gdp !== undefined) {
    investBits.push(`R&D spend at ${fmt(raw.rd_spend_pct_gdp)}% of GDP`);
  }
  if (raw?.fdi_pct_gdp !== null && raw?.fdi_pct_gdp !== undefined) {
    investBits.push(`FDI net inflows of ${fmt(raw.fdi_pct_gdp)}% of GDP`);
  }
  const investStat = investBits.length ? ` Live indicators show ${investBits.join(" and ")}.` : "";
  const investment = `Investment scores ${invest.score}/20 (${
    invest.score - globalMedians.investment >= 0 ? "above" : "below"
  } the ${fmt(globalMedians.investment, 1)}/20 global median). ${
    invest.reasons[0] ?? "Its capital base for AI underpins this score."
  }.${investStat} Top accelerator: ${country.top_accelerator}.`;

  // ── 5. Economic Readiness & Outlook ───────────────────────────────────
  const econ = country.scores.economic_readiness;
  const econBits: string[] = [];
  if (raw?.gdp_per_capita_ppp !== null && raw?.gdp_per_capita_ppp !== undefined) {
    econBits.push(`GDP per capita (PPP) of $${Math.round(raw.gdp_per_capita_ppp).toLocaleString()}`);
  }
  if (raw?.services_share_pct_gdp !== null && raw?.services_share_pct_gdp !== undefined) {
    econBits.push(`services at ${fmt(raw.services_share_pct_gdp)}% of GDP`);
  }
  const econStat = econBits.length ? ` It reports ${econBits.join(" and ")}.` : "";
  const regionCompare = `Within ${country.region}, its pillar average sits ${
    (infra.score + talent.score + gov.score + invest.score + econ.score) / 5 -
      (regionMedians.infrastructure + regionMedians.talent + regionMedians.governance + regionMedians.investment + regionMedians.economic_readiness) / 5 >=
    0
      ? "above"
      : "below"
  } the regional median.`;
  const outlook = `Economic Readiness scores ${econ.score}/20. ${
    econ.reasons[0] ?? "Its capacity to commercialise AI underpins this score."
  }.${econStat} ${regionCompare} The primary risk to the ${
    country.trajectory_label
  } trajectory holding through 2028: ${country.top_risk}.`;

  return [
    { heading: "Standing & Trajectory", body: standing },
    { heading: "Infrastructure & Talent", body: infraTalent },
    { heading: "Governance & Policy", body: governance },
    { heading: "Investment & Capital", body: investment },
    { heading: "Economic Readiness & Outlook", body: outlook },
  ];
}
