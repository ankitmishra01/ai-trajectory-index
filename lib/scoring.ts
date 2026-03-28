import type { Country, ScoredCountry } from "./types";
import type { WorldBankData } from "./worldbank";

export interface PolicyData {
  has_national_ai_strategy: boolean;
  strategy_year: number | null;
  has_ai_regulation: boolean;
  oecd_member: boolean;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ─── Infrastructure (0-20) ──────────────────────────────────────────────────

function scoreInfrastructure(
  internet: number | null,
  mobile: number | null,
  electricity: number | null,
  staticScore: number
): number {
  const hasAny =
    internet !== null || mobile !== null || electricity !== null;
  if (!hasAny) return staticScore;

  let points = 0;

  if (internet !== null) {
    if (internet > 80) points += 8;
    else if (internet > 50) points += 6;
    else if (internet > 20) points += 4;
    else points += 2;
  } else {
    // Proportional share of internet sub-component from static score
    points += (staticScore / 20) * 8;
  }

  if (mobile !== null) {
    if (mobile > 100) points += 5;
    else if (mobile > 50) points += 3;
    else points += 1;
  } else {
    points += (staticScore / 20) * 5;
  }

  if (electricity !== null) {
    if (electricity > 95) points += 5;
    else if (electricity > 70) points += 3;
    else points += 1;
  } else {
    points += (staticScore / 20) * 5;
  }

  // Max raw = 18; scale to 20
  return clamp(Math.round((points / 18) * 20), 0, 20);
}

// ─── Talent (0-20) ──────────────────────────────────────────────────────────
//
// Re-weighted to include labor productivity (GDP per employed person, 2017 PPP$):
//   Tertiary enrollment:  6 pts  (was 8)
//   R&D spend:            6 pts  (was 8)
//   Labor productivity:   4 pts  (new) — captures whether talent is productively deployed
//   Quality proxy:        4 pts  (static sub-score)
//   Total max:           20 pts
//
// Rationale: a country can have high enrollment and R&D spend but still struggle to
// adopt AI efficiently if underlying labor productivity is low or declining. Canada is
// a canonical example — strong institutions, but GDP per worker trails OECD peers and
// is on a declining trend, signalling structural friction in technology absorption.

function scoreLaborProductivity(laborProd: number | null): number {
  if (laborProd === null) return null as unknown as number; // handled by caller
  // Thresholds in constant 2017 PPP$ per employed person
  if (laborProd > 85_000) return 4;   // Top tier: Norway, Ireland, US, Switzerland
  if (laborProd > 65_000) return 3;   // Strong: Germany, Netherlands, France, Canada, Australia
  if (laborProd > 40_000) return 2;   // Mid: South Korea, Poland, Czech Republic, China
  if (laborProd > 18_000) return 1;   // Developing: India, Brazil, Mexico, Indonesia
  return 0.5;                          // Frontier markets: sub-Saharan Africa, low-income
}

function scoreTalent(
  tertiary: number | null,
  rd: number | null,
  laborProd: number | null,
  staticScore: number
): number {
  const hasAny = tertiary !== null || rd !== null || laborProd !== null;
  if (!hasAny) return staticScore;

  let points = 0;

  // Tertiary enrollment (6 pts)
  if (tertiary !== null) {
    if (tertiary > 60) points += 6;
    else if (tertiary > 40) points += 4.5;
    else if (tertiary > 20) points += 3;
    else points += 1.5;
  } else {
    points += (staticScore / 20) * 6;
  }

  // R&D spend (6 pts)
  if (rd !== null) {
    if (rd > 2) points += 6;
    else if (rd > 1) points += 4.5;
    else if (rd > 0.5) points += 3;
    else points += 1.5;
  } else {
    points += (staticScore / 20) * 6;
  }

  // Labor productivity (4 pts) — GDP per employed person (constant 2017 PPP$)
  if (laborProd !== null) {
    points += scoreLaborProductivity(laborProd);
  } else {
    // Fall back to static score as proxy (preserves existing scores when WB data missing)
    points += (staticScore / 20) * 4;
  }

  // Researcher-quality / institutional proxy (4 pts static)
  points += (staticScore / 20) * 4;

  // Max raw = 20 (6+6+4+4)
  return clamp(Math.round(points), 0, 20);
}

// ─── Governance (0-20) ──────────────────────────────────────────────────────

function scoreGovernance(policy: PolicyData, staticScore: number): number {
  let points = 0;

  if (policy.has_national_ai_strategy) {
    points += 8;
    if (policy.strategy_year && policy.strategy_year >= 2022) points += 2;
  }

  if (policy.has_ai_regulation) points += 5;
  if (policy.oecd_member) points += 3;

  // Remaining 2 points: normalise static score
  points += (staticScore / 20) * 2;

  // Max raw = 20 (8+2+5+3+2)
  return clamp(Math.round(points), 0, 20);
}

// ─── Investment (0-20) ──────────────────────────────────────────────────────

function scoreInvestment(
  rd: number | null,
  gdp: number | null,
  staticScore: number
): number {
  const hasAny = rd !== null || gdp !== null;
  if (!hasAny) return staticScore;

  let points = 0;

  // R&D spend
  if (rd !== null) {
    if (rd > 2) points += 6;
    else if (rd > 1) points += 4;
    else if (rd > 0.5) points += 2;
    else points += 1;
  } else {
    points += (staticScore / 20) * 6;
  }

  // GDP per capita as economic capacity proxy
  if (gdp !== null) {
    if (gdp > 40000) points += 6;
    else if (gdp > 15000) points += 4;
    else if (gdp > 5000) points += 2;
    else points += 1;
  } else {
    points += (staticScore / 20) * 6;
  }

  // Remaining 8 points: VC ecosystem proxy from static score
  const vcProxy = (staticScore / 20) * 8;
  points += vcProxy;

  // Max raw = 20
  return clamp(Math.round(points), 0, 20);
}

// ─── Economic Readiness (0-20) ──────────────────────────────────────────────

function scoreEconomicReadiness(
  gdp: number | null,
  electricity: number | null,
  internet: number | null,
  mobile: number | null,
  staticScore: number
): number {
  const hasAny =
    gdp !== null || electricity !== null || internet !== null || mobile !== null;
  if (!hasAny) return staticScore;

  let points = 0;

  // GDP per capita (8 pts)
  if (gdp !== null) {
    if (gdp > 40000) points += 8;
    else if (gdp > 15000) points += 5;
    else if (gdp > 5000) points += 3;
    else points += 1;
  } else {
    points += (staticScore / 20) * 8;
  }

  // Electricity (4 pts)
  if (electricity !== null) {
    if (electricity > 95) points += 4;
    else if (electricity > 70) points += 2.5;
    else points += 1;
  } else {
    points += (staticScore / 20) * 4;
  }

  // Internet + Mobile (4 pts combined)
  if (internet !== null || mobile !== null) {
    const netPts =
      internet !== null
        ? internet > 80
          ? 2
          : internet > 50
          ? 1.5
          : internet > 20
          ? 1
          : 0.5
        : (staticScore / 20) * 2;
    const mobPts =
      mobile !== null
        ? mobile > 100
          ? 2
          : mobile > 50
          ? 1.5
          : 1
        : (staticScore / 20) * 2;
    points += netPts + mobPts;
  } else {
    points += (staticScore / 20) * 4;
  }

  // Remaining 4 pts: static sub-score
  points += (staticScore / 20) * 4;

  // Max raw = 20
  return clamp(Math.round(points), 0, 20);
}

// ─── Trajectory (-10 to +10) ────────────────────────────────────────────────
//
// Components:
//   GDP per capita growth:         25% → ±2.5 pts
//   Internet penetration growth:   20% → ±2.0 pts
//   AI strategy recency:           25% → ±2.5 pts
//   R&D spend trend:               15% → ±1.5 pts
//   Labor productivity trend:      10% → ±1.0 pts  (new)
//   Static baseline:                5% → ±0.5 pts  (reduced from 15%)

function calcTrajectoryScore(
  gdpCurrent: number | null,
  gdpPrevious: number | null,
  internetCurrent: number | null,
  internetPrevious: number | null,
  rdCurrent: number | null,
  rdPrevious: number | null,
  laborProdCurrent: number | null,
  laborProdPrevious: number | null,
  policy: PolicyData,
  staticTrajectory: number
): number {
  let score = 0;

  // 25% — GDP per capita growth
  if (gdpCurrent !== null && gdpPrevious !== null && gdpPrevious > 0) {
    const growthPct = ((gdpCurrent - gdpPrevious) / gdpPrevious) * 100;
    if (growthPct > 6) score += 2.5;
    else if (growthPct > 3) score += 1.5;
    else if (growthPct > 0) score += 0.5;
    else if (growthPct > -3) score -= 0.5;
    else score -= 2.5;
  } else {
    score += (staticTrajectory / 10) * 2.5;
  }

  // 20% — Internet penetration growth
  if (internetCurrent !== null && internetPrevious !== null) {
    const growth = internetCurrent - internetPrevious;
    if (growth > 5) score += 2.0;
    else if (growth > 2) score += 1.2;
    else if (growth > 0) score += 0.5;
    else if (growth > -2) score -= 0.3;
    else score -= 1.5;
  } else {
    score += (staticTrajectory / 10) * 2.0;
  }

  // 25% — Post-2022 AI strategy
  if (policy.has_national_ai_strategy) {
    if (policy.strategy_year && policy.strategy_year >= 2022) score += 2.5;
    else if (policy.strategy_year && policy.strategy_year >= 2019) score += 1.5;
    else score += 0.5;
  } else {
    score -= 1.5;
  }

  // 15% — R&D spend trend
  if (rdCurrent !== null && rdPrevious !== null) {
    const rdGrowth = rdCurrent - rdPrevious;
    if (rdGrowth > 0.2) score += 1.5;
    else if (rdGrowth > 0) score += 0.7;
    else if (rdGrowth > -0.2) score -= 0.3;
    else score -= 1.5;
  } else {
    score += (staticTrajectory / 10) * 1.5;
  }

  // 10% — Labor productivity trend (GDP per employed person growth)
  // Declining productivity is a leading indicator that AI adoption will be uneven.
  // A country with shrinking output-per-worker faces structural headwinds regardless
  // of its raw talent pool size (see: Canada, Italy, some Eastern European economies).
  if (laborProdCurrent !== null && laborProdPrevious !== null && laborProdPrevious > 0) {
    const prodGrowth = ((laborProdCurrent - laborProdPrevious) / laborProdPrevious) * 100;
    if (prodGrowth > 3)    score += 1.0;   // Strong growth — economy absorbing technology
    else if (prodGrowth > 0.5) score += 0.5;
    else if (prodGrowth > -1)  score -= 0.3; // Stagnant
    else                       score -= 1.0; // Declining — structural friction
  } else {
    score += (staticTrajectory / 10) * 1.0;
  }

  // 5% — Static baseline (reduced from 15% to make room for productivity trend)
  score += (staticTrajectory / 10) * 0.5;

  return clamp(Math.round(score), -10, 10);
}

function trajectoryLabel(score: number): string {
  if (score >= 6) return "Strong Positive";
  if (score >= 2) return "Positive";
  if (score >= -1) return "Neutral";
  if (score >= -5) return "Negative";
  return "Strong Negative";
}

// ─── Main scoring function ───────────────────────────────────────────────────

export function calculateScores(
  country: Country,
  iso2: string,
  wbData: WorldBankData,
  policies: Record<string, PolicyData>
): ScoredCountry {
  const wb = wbData[iso2];
  const policy = policies[country.slug] ?? {
    has_national_ai_strategy: false,
    strategy_year: null,
    has_ai_regulation: false,
    oecd_member: false,
  };

  const hasLiveData = !!wb;

  const internet    = wb?.internet.current           ?? null;
  const mobile      = wb?.mobile.current             ?? null;
  const electricity = wb?.electricity.current        ?? null;
  const tertiary    = wb?.tertiary.current           ?? null;
  const rd          = wb?.rd.current                 ?? null;
  const gdp         = wb?.gdp.current                ?? null;
  const laborProd   = wb?.labor_productivity.current ?? null;
  const laborProdPrev = wb?.labor_productivity.previous ?? null;

  const infraScore = scoreInfrastructure(
    internet,
    mobile,
    electricity,
    country.scores.infrastructure.score
  );
  const talentScore = scoreTalent(
    tertiary,
    rd,
    laborProd,
    country.scores.talent.score
  );
  const govScore = scoreGovernance(policy, country.scores.governance.score);
  const investScore = scoreInvestment(
    rd,
    gdp,
    country.scores.investment.score
  );
  const econScore = scoreEconomicReadiness(
    gdp,
    electricity,
    internet,
    mobile,
    country.scores.economic_readiness.score
  );

  const totalScore = clamp(
    infraScore + talentScore + govScore + investScore + econScore,
    0,
    100
  );

  const trajectoryScore = calcTrajectoryScore(
    gdp,
    wb?.gdp.previous ?? null,
    internet,
    wb?.internet.previous ?? null,
    rd,
    wb?.rd.previous ?? null,
    laborProd,
    laborProdPrev,
    policy,
    country.trajectory_score
  );

  const projectedScore2028 = clamp(
    Math.round(totalScore + trajectoryScore * 1.5),
    0,
    100
  );

  return {
    ...country,
    scores: {
      infrastructure: { ...country.scores.infrastructure, score: infraScore },
      talent: { ...country.scores.talent, score: talentScore },
      governance: { ...country.scores.governance, score: govScore },
      investment: { ...country.scores.investment, score: investScore },
      economic_readiness: {
        ...country.scores.economic_readiness,
        score: econScore,
      },
    },
    total_score: totalScore,
    trajectory_score: trajectoryScore,
    trajectory_label: trajectoryLabel(trajectoryScore),
    projected_score_2028: projectedScore2028,
    data_source: hasLiveData ? "live" : "fallback",
  };
}
