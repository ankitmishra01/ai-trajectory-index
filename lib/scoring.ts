import type { Country, ScoredCountry } from "./types";
import type { WorldBankData } from "./worldbank";
import type { IMFData } from "./imf";
import type { OECDData } from "./oecd";

export interface ExternalIndicesEntry {
  oxford_insights: number | null;
  stanford_hai: number | null;
  tortoise: number | null;
  wipo_gii: number | null;
  wef_gci: number | null;
  itu_idi: number | null;
}

export interface ExternalIndices {
  countries: Record<string, ExternalIndicesEntry>;
}

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
//
// Audit fix: previous formula only used consumer-access proxies (internet %, mobile, electricity)
// which are all saturated for OECD countries and provide no discriminatory signal between peers.
// New formula adds fixed broadband (quality signal) and reduces weight of saturated indicators.
//
// Weights:
//   Fixed broadband subscriptions/100:  6 pts  (new — quality digital infra, not just access)
//   Internet users %:                   3 pts  (reduced from 8 — saturated >80% for OECD)
//   Mobile subscriptions/100:           3 pts  (reduced — saturated signal)
//   Electricity access %:               3 pts  (reduced — retained for developing economy range)
//   Static quality proxy:               5 pts  (server density, cloud, grid reliability)
//   Max:                               20 pts

function scoreInfrastructure(
  internet: number | null,
  mobile: number | null,
  electricity: number | null,
  broadband: number | null,
  staticScore: number
): number {
  const hasAny =
    internet !== null || mobile !== null || electricity !== null || broadband !== null;
  if (!hasAny) return staticScore;

  let points = 0;

  // Fixed broadband (6 pts) — best available proxy for digital infrastructure quality
  if (broadband !== null) {
    if (broadband > 35) points += 6;       // High quality: US, UK, Germany, S. Korea
    else if (broadband > 20) points += 4.5; // Good: Poland, Brazil, Turkey
    else if (broadband > 8) points += 3;   // Developing: India, Nigeria
    else if (broadband > 2) points += 1.5; // Low penetration
    else points += 0.5;
  } else {
    points += (staticScore / 20) * 6;
  }

  // Internet users % (3 pts) — access signal, limited discriminatory power above 80%
  if (internet !== null) {
    if (internet > 85) points += 3;
    else if (internet > 65) points += 2.2;
    else if (internet > 40) points += 1.5;
    else if (internet > 15) points += 0.8;
    else points += 0.3;
  } else {
    points += (staticScore / 20) * 3;
  }

  // Mobile subscriptions/100 (3 pts) — counts SIMs not people, less meaningful above 100
  if (mobile !== null) {
    if (mobile > 120) points += 3;
    else if (mobile > 80) points += 2.2;
    else if (mobile > 40) points += 1.5;
    else points += 0.5;
  } else {
    points += (staticScore / 20) * 3;
  }

  // Electricity access % (3 pts) — critical for AI compute; saturated for OECD
  if (electricity !== null) {
    if (electricity > 97) points += 3;
    else if (electricity > 80) points += 2;
    else if (electricity > 50) points += 1;
    else points += 0.3;
  } else {
    points += (staticScore / 20) * 3;
  }

  // Static quality proxy (5 pts) — server infrastructure, cloud regions, grid reliability
  points += (staticScore / 20) * 5;

  // Max raw = 20
  return clamp(Math.round(points), 0, 20);
}

// ─── Talent (0-20) ──────────────────────────────────────────────────────────
//
// Audit fix: R&D spend (GB.XPD.RSDV.GD.ZS) was double-counted here and in Investment.
// Removed from Talent. Labor productivity retained as deployment effectiveness signal.
//
// Weights:
//   Tertiary enrollment %:    6 pts  (volume — enrollment rate, not quality)
//   Labor productivity:       6 pts  (GDP/worker PPP — whether talent is productively deployed)
//   Static quality proxy:     8 pts  (researcher density, PISA/PIAAC, brain-drain, ICT skills)
//   Max:                     20 pts
//
// Rationale for static proxy at 8pts: researcher counts (SP.POP.SCIE.RD.P6) and PISA have
// significant missing data. The static baseline captures these signals from index construction.

function scoreLaborProductivity(laborProd: number | null): number {
  if (laborProd === null) return null as unknown as number; // handled by caller
  // Thresholds in constant 2017 PPP$ per employed person
  if (laborProd > 85_000) return 6;   // Top tier: Norway, Ireland, US, Switzerland
  if (laborProd > 65_000) return 4.5; // Strong: Germany, Netherlands, France, Australia
  if (laborProd > 40_000) return 3;   // Mid: South Korea, Poland, Czech Republic
  if (laborProd > 18_000) return 1.5; // Developing: India, Brazil, Mexico, Indonesia
  return 0.75;                         // Frontier markets: sub-Saharan Africa, low-income
}

function scoreTalent(
  tertiary: number | null,
  laborProd: number | null,
  staticScore: number,
  oecdResearchers: number | null,
  wipoGii: number | null
): number {
  const hasAny = tertiary !== null || laborProd !== null;
  if (!hasAny) return staticScore;

  let points = 0;

  // Tertiary enrollment % (6 pts) — volume of talent pipeline
  if (tertiary !== null) {
    if (tertiary > 70) points += 6;
    else if (tertiary > 50) points += 4.5;
    else if (tertiary > 30) points += 3;
    else if (tertiary > 15) points += 1.8;
    else points += 0.8;
  } else {
    points += (staticScore / 20) * 6;
  }

  // Labor productivity (6 pts) — GDP per employed person (constant 2017 PPP$)
  if (laborProd !== null) {
    points += scoreLaborProductivity(laborProd);
  } else {
    points += (staticScore / 20) * 6;
  }

  // Static talent quality proxy — 8pts, partially replaced by live sources when available
  // OECD researchers/1000 employed (−2pts from static, +2pts live)
  // WIPO GII innovation score (−1pt from static, +1pt live)
  let staticAlloc = 8;
  if (oecdResearchers !== null) {
    staticAlloc -= 2;
    if (oecdResearchers > 10)      points += 2;
    else if (oecdResearchers > 6)  points += 1.5;
    else if (oecdResearchers > 3)  points += 1;
    else                           points += 0.5;
  }
  if (wipoGii !== null) {
    staticAlloc -= 1;
    if (wipoGii > 55)      points += 1;
    else if (wipoGii > 40) points += 0.7;
    else if (wipoGii > 25) points += 0.4;
    else                   points += 0.2;
  }
  points += (staticScore / 20) * staticAlloc;

  return clamp(Math.round(points), 0, 20);
}

// ─── Governance (0-20) ──────────────────────────────────────────────────────
//
// Audit fix: old formula was 100% binary flags (has_strategy, has_regulation, oecd_member)
// with no live institutional quality signal. Result: Italy scores 16/20 despite implementation gaps.
// New formula integrates World Governance Indicators (WGI) as continuous live signals.
//
// WGI estimates are z-scores, range ≈ −2.5 to +2.5. Normalise: ((est + 2.5) / 5.0) × maxPts.
//
// Weights:
//   Rule of Law (RL.EST):         5 pts  — contract enforcement, property rights, judicial quality
//   Govt Effectiveness (GE.EST):  4 pts  — service delivery, policy implementation capacity
//   Regulatory Quality (RQ.EST):  3 pts  — market-friendly regulation, removing barriers
//   AI national strategy:         3 pts  + 2 bonus if strategy_year ≥ 2022
//   AI regulation in force:       1 pt
//   Static institutional proxy:   2 pts
//   Max:                         20 pts  (5+4+3+3+2+1+2)

function normalizeWGI(estimate: number | null, maxPts: number): number | null {
  if (estimate === null) return null;
  // WGI z-scores are defined on [-2.5, +2.5]. Clamp to that range so the
  // normalisation never produces a negative value or overflows maxPts.
  // (Using ±3 as the clamp boundary caused a 10% overflow at +3 and a
  //  negative contribution at -3, both of which violated the point budget.)
  const clamped = Math.max(-2.5, Math.min(2.5, estimate));
  return ((clamped + 2.5) / 5.0) * maxPts;
}

function scoreGovernance(
  govEff: number | null,
  ruleOfLaw: number | null,
  regQuality: number | null,
  policy: PolicyData,
  staticScore: number,
  oxfordInsights: number | null
): number {
  let points = 0;

  // Rule of Law (5 pts) — continuous WGI signal
  const rolPts = normalizeWGI(ruleOfLaw, 5);
  points += rolPts !== null ? rolPts : (staticScore / 20) * 5;

  // Government Effectiveness (4 pts)
  const gePts = normalizeWGI(govEff, 4);
  points += gePts !== null ? gePts : (staticScore / 20) * 4;

  // Regulatory Quality (3 pts)
  const rqPts = normalizeWGI(regQuality, 3);
  points += rqPts !== null ? rqPts : (staticScore / 20) * 3;

  // AI strategy (3 pts base + 2 bonus for recency)
  if (policy.has_national_ai_strategy) {
    points += 3;
    if (policy.strategy_year && policy.strategy_year >= 2022) points += 2;
    else if (policy.strategy_year && policy.strategy_year >= 2019) points += 1;
  }
  // No negative penalty for lacking strategy — absence is already scored via WGI

  // AI regulation (1 pt) — existence only, not quality
  if (policy.has_ai_regulation) points += 1;

  // Static institutional proxy (2 pts) — replaced by Oxford Insights when available
  if (oxfordInsights !== null) {
    if (oxfordInsights >= 65)      points += 2;
    else if (oxfordInsights >= 45) points += 1.5;
    else if (oxfordInsights >= 30) points += 1;
    else                           points += 0.5;
  } else {
    points += (staticScore / 20) * 2;
  }

  // Max raw = 20
  return clamp(Math.round(points), 0, 20);
}

// ─── Investment (0-20) ──────────────────────────────────────────────────────
//
// Audit fix: GDP per capita (NY.GDP.PCAP.CD) was double-counted here and in Economic Readiness.
// Removed from Investment. Added FDI net inflows as a live capital-flow signal.
//
// Weights:
//   R&D spend % GDP:          6 pts  (moved from Talent — it's an investment signal)
//   FDI net inflows % GDP:    5 pts  (new — actual foreign capital attraction)
//   Static VC ecosystem:      9 pts  (startup density, unicorns, VC deal flow, patent filings)
//   Max:                     20 pts

function scoreInvestment(
  rd: number | null,
  fdi: number | null,
  staticScore: number,
  imfGovtExpenditure: number | null,
  oecdRd: number | null
): number {
  const hasAny = rd !== null || fdi !== null || imfGovtExpenditure !== null || oecdRd !== null;
  if (!hasAny) return staticScore;

  let points = 0;

  // R&D spend % GDP (6 pts) — prefer OECD business R&D when available, else WB total R&D
  const effectiveRd = oecdRd ?? rd;
  if (effectiveRd !== null) {
    if (effectiveRd > 3.5)      points += 6;
    else if (effectiveRd > 2)   points += 4.5;
    else if (effectiveRd > 1)   points += 3;
    else if (effectiveRd > 0.3) points += 1.5;
    else                        points += 0.5;
  } else {
    points += (staticScore / 20) * 6;
  }

  // FDI net inflows % GDP (5 pts) — actual foreign capital attraction signal
  if (fdi !== null) {
    const clampedFdi = Math.min(fdi, 20);
    if (clampedFdi > 10)      points += 5;
    else if (clampedFdi > 4)  points += 4;
    else if (clampedFdi > 1.5) points += 3;
    else if (clampedFdi > 0)  points += 2;
    else                      points += 0.5;
  } else {
    points += (staticScore / 20) * 5;
  }

  // Static VC ecosystem proxy: 9pts when no IMF data; 3pts replaced by IMF govt expenditure signal
  if (imfGovtExpenditure !== null) {
    if (imfGovtExpenditure >= 45)      points += 3;
    else if (imfGovtExpenditure >= 35) points += 2;
    else if (imfGovtExpenditure >= 25) points += 1;
    else                               points += 0.5;
    points += (staticScore / 20) * 6;
  } else {
    points += (staticScore / 20) * 9;
  }

  return clamp(Math.round(points), 0, 20);
}

// ─── Economic Readiness (0-20) ──────────────────────────────────────────────
//
// Audit fix:
// 1. Removed electricity + internet + mobile — triple-counted from Infrastructure.
// 2. Replaced nominal GDP (NY.GDP.PCAP.CD) with PPP GDP (NY.GDP.PCAP.PP.KD) — removes
//    currency distortion and price-level bias (e.g., Norway vs China purchasing power).
// 3. Added financial depth (private credit) and market integration (trade openness).
//
// Weights:
//   GDP per capita PPP:          6 pts  (economic capacity, purchasing-power adjusted)
//   Private sector credit % GDP: 3 pts  (financial depth — can businesses fund AI adoption?)
//   Trade openness % GDP:        3 pts  (market integration — access to global tech supply chains)
//   Services value added % GDP:  3 pts  (knowledge-economy share — AI is a services technology)
//   Static market capacity proxy: 5 pts (economic complexity, regulatory ease, digital economy)
//   Max:                        20 pts

function scoreEconomicReadiness(
  gdpPpp: number | null,
  privateCredit: number | null,
  tradeOpenness: number | null,
  servicesShare: number | null,
  staticScore: number,
  imfGovtDebt: number | null
): number {
  const hasAny =
    gdpPpp !== null || privateCredit !== null ||
    tradeOpenness !== null || servicesShare !== null;
  if (!hasAny) return staticScore;

  let points = 0;

  // GDP per capita PPP — constant 2017 international $ (6 pts)
  if (gdpPpp !== null) {
    if (gdpPpp > 55_000) points += 6;     // Wealthy: US, Germany, Switzerland, Australia
    else if (gdpPpp > 30_000) points += 4.5; // Upper-middle: Poland, Chile, Malaysia
    else if (gdpPpp > 12_000) points += 3;   // Middle: China, Brazil, S. Africa
    else if (gdpPpp > 4_000) points += 1.5;  // Lower-middle: India, Nigeria, Kenya
    else points += 0.5;
  } else {
    points += (staticScore / 20) * 6;
  }

  // Private sector credit % GDP (3 pts) — financial depth signals ability to fund AI adoption
  if (privateCredit !== null) {
    if (privateCredit > 150) points += 3;     // Deep finance: US, Japan, Singapore, Switzerland
    else if (privateCredit > 80) points += 2.2; // Strong: EU average, China, Chile
    else if (privateCredit > 40) points += 1.5; // Developing: Brazil, S. Africa, Turkey
    else if (privateCredit > 15) points += 0.8;
    else points += 0.3;
  } else {
    points += (staticScore / 20) * 3;
  }

  // Trade openness % GDP (3 pts) — access to global tech supply chains and talent
  if (tradeOpenness !== null) {
    // Small open economies (Singapore, Netherlands) naturally score very high.
    // Large economies (US, India) have structurally lower ratios — not a penalty.
    const capped = Math.min(tradeOpenness, 200); // cap extreme small-country outliers
    if (capped > 120) points += 3;
    else if (capped > 70) points += 2.2;
    else if (capped > 40) points += 1.5;
    else if (capped > 20) points += 0.8;
    else points += 0.3;
  } else {
    points += (staticScore / 20) * 3;
  }

  // Services value added % GDP (3 pts) — AI is a services-sector technology
  if (servicesShare !== null) {
    if (servicesShare > 75) points += 3;      // Post-industrial: US, UK, Switzerland, Luxembourg
    else if (servicesShare > 60) points += 2.2; // EU average, Australia, Canada
    else if (servicesShare > 45) points += 1.5; // China, Russia, Indonesia
    else if (servicesShare > 30) points += 0.8;
    else points += 0.3;
  } else {
    points += (staticScore / 20) * 3;
  }

  // Static market capacity proxy (5 pts); high govt debt (>100% GDP) reduces by 1pt
  let staticPts = (staticScore / 20) * 5;
  if (imfGovtDebt !== null && imfGovtDebt > 100) {
    staticPts = Math.max(0, staticPts - 1);
  }
  points += staticPts;

  return clamp(Math.round(points), 0, 20);
}

// ─── Trajectory (-10 to +10) ────────────────────────────────────────────────
//
// Audit fix: AI strategy recency was 25% of trajectory — a one-time categorical event, not
// a growth signal. Reduced to 10%. Added high-tech exports (innovation output) and fixed
// broadband growth (digital infrastructure upgrade) as forward-looking signals.
// Removed internet penetration growth — saturated in high-income markets.
//
// Components:
//   GDP per capita growth:           20% → ±2.0 pts
//   R&D spend trend:                 15% → ±1.5 pts
//   Labor productivity trend:        15% → ±1.5 pts
//   High-tech exports trend:         20% → ±2.0 pts  (new — innovation output signal)
//   Fixed broadband growth:          10% → ±1.0 pts  (new — digital infra upgrade)
//   AI strategy recency:             10% → ±1.0 pts  (down from 25%)
//   Static baseline:                 10% → ±1.0 pts
//   Total:                          100% → ±10.0 pts

function calcTrajectoryScore(
  gdpCurrent: number | null,
  gdpPrevious: number | null,
  rdCurrent: number | null,
  rdPrevious: number | null,
  laborProdCurrent: number | null,
  laborProdPrevious: number | null,
  hightechCurrent: number | null,
  hightechPrevious: number | null,
  broadbandCurrent: number | null,
  broadbandPrevious: number | null,
  policy: PolicyData,
  staticTrajectory: number,
  anthropicUsage: number | null
): number {
  let score = 0;

  // 20% — GDP per capita growth (nominal USD; growth rate removes currency-level bias)
  if (gdpCurrent !== null && gdpPrevious !== null && gdpPrevious > 0) {
    const growthPct = ((gdpCurrent - gdpPrevious) / gdpPrevious) * 100;
    if (growthPct > 6)      score += 2.0;
    else if (growthPct > 3) score += 1.2;
    else if (growthPct > 0) score += 0.4;
    else if (growthPct > -3) score -= 0.4;
    else                    score -= 2.0;
  } else {
    score += (staticTrajectory / 10) * 2.0;
  }

  // 15% — R&D spend trend (% GDP change)
  if (rdCurrent !== null && rdPrevious !== null) {
    const rdGrowth = rdCurrent - rdPrevious;
    if (rdGrowth > 0.3)      score += 1.5;
    else if (rdGrowth > 0.1) score += 0.8;
    else if (rdGrowth > -0.1) score += 0.0;
    else if (rdGrowth > -0.3) score -= 0.5;
    else                      score -= 1.5;
  } else {
    score += (staticTrajectory / 10) * 1.5;
  }

  // 15% — Labor productivity trend (% change year-on-year)
  // Declining productivity is a leading indicator that AI adoption will be uneven.
  if (laborProdCurrent !== null && laborProdPrevious !== null && laborProdPrevious > 0) {
    const prodGrowth = ((laborProdCurrent - laborProdPrevious) / laborProdPrevious) * 100;
    if (prodGrowth > 3)       score += 1.5;
    else if (prodGrowth > 1)  score += 0.8;
    else if (prodGrowth > -1) score -= 0.3; // Stagnant
    else                      score -= 1.5; // Declining — structural friction
  } else {
    score += (staticTrajectory / 10) * 1.5;
  }

  // 20% — High-tech exports trend (pp change in % of manufactured exports)
  // Captures whether a country is moving up the value chain toward tech outputs.
  if (hightechCurrent !== null && hightechPrevious !== null) {
    const htGrowth = hightechCurrent - hightechPrevious;
    if (htGrowth > 3)        score += 2.0;
    else if (htGrowth > 0.5) score += 1.0;
    else if (htGrowth > -0.5) score += 0.0;
    else if (htGrowth > -3)  score -= 0.8;
    else                     score -= 2.0;
  } else {
    score += (staticTrajectory / 10) * 2.0;
  }

  // 10% — Fixed broadband growth (new subscriptions per 100 people)
  // Signals active infrastructure investment, not just legacy coverage.
  if (broadbandCurrent !== null && broadbandPrevious !== null) {
    const bbGrowth = broadbandCurrent - broadbandPrevious;
    if (bbGrowth > 2)        score += 1.0;
    else if (bbGrowth > 0.5) score += 0.5;
    else if (bbGrowth > -0.5) score += 0.0;
    else                     score -= 0.5;
  } else {
    score += (staticTrajectory / 10) * 1.0;
  }

  // 10% — AI strategy recency (down from 25%; it's categorical, not a growth trend)
  if (policy.has_national_ai_strategy) {
    if (policy.strategy_year && policy.strategy_year >= 2022) score += 1.0;
    else if (policy.strategy_year && policy.strategy_year >= 2019) score += 0.5;
    else score += 0.0;
  } else {
    score -= 0.5;
  }

  // 10% — Static baseline
  score += (staticTrajectory / 10) * 1.0;

  // Anthropic AI usage intensity signal — ±0.5pt modifier
  if (anthropicUsage !== null) {
    if (anthropicUsage >= 60)      score += 0.5;
    else if (anthropicUsage < 20)  score -= 0.5;
  }

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
  iso3: string,
  wbData: WorldBankData,
  policies: Record<string, PolicyData>,
  imfData: IMFData,
  oecdData: OECDData,
  anthropicData: Record<string, number>,
  externalIndices: ExternalIndices
): ScoredCountry {
  const wb   = wbData[iso2];
  const imf  = imfData[iso3];
  const oecd = oecdData[iso3];
  const anthropicScore = anthropicData[iso3] ?? null;
  const ext  = externalIndices.countries[country.slug] ?? null;

  const policy = policies[country.slug] ?? {
    has_national_ai_strategy: false,
    strategy_year: null,
    has_ai_regulation: false,
    oecd_member: false,
  };

  const hasLiveData = !!wb;

  // Digital access
  const internet    = wb?.internet.current           ?? null;
  const mobile      = wb?.mobile.current             ?? null;
  const broadband   = wb?.broadband.current          ?? null;
  const electricity = wb?.electricity.current        ?? null;

  // Labour / talent
  const tertiary    = wb?.tertiary.current           ?? null;
  const laborProd   = wb?.labor_productivity.current ?? null;
  const laborProdPrev = wb?.labor_productivity.previous ?? null;

  // Investment
  const rd          = wb?.rd.current                 ?? null;
  const rdPrev      = wb?.rd.previous                ?? null;
  const fdi         = wb?.fdi.current                ?? null;

  // Governance
  const govEff      = wb?.gov_effectiveness.current  ?? null;
  const ruleOfLaw   = wb?.rule_of_law.current        ?? null;
  const regQuality  = wb?.regulatory_quality.current ?? null;

  // Economic readiness
  const gdpPpp         = wb?.gdp_ppp.current         ?? null;
  const privateCredit  = wb?.private_credit.current  ?? null;
  const tradeOpenness  = wb?.trade_openness.current  ?? null;
  const servicesShare  = wb?.services_share.current  ?? null;

  // Trajectory signals
  const gdpCurrent     = wb?.gdp.current             ?? null;
  const gdpPrev        = wb?.gdp.previous            ?? null;
  const hightechCurrent  = wb?.hightech_exports.current  ?? null;
  const hightechPrevious = wb?.hightech_exports.previous ?? null;
  const broadbandPrev  = wb?.broadband.previous      ?? null;

  const infraScore = scoreInfrastructure(
    internet,
    mobile,
    electricity,
    broadband,
    country.scores.infrastructure.score
  );

  const talentScore = scoreTalent(
    tertiary,
    laborProd,
    country.scores.talent.score,
    oecd?.researchers.current ?? null,
    ext?.wipo_gii ?? null
  );

  const govScore = scoreGovernance(
    govEff,
    ruleOfLaw,
    regQuality,
    policy,
    country.scores.governance.score,
    ext?.oxford_insights ?? null
  );

  const investScore = scoreInvestment(
    rd,
    fdi,
    country.scores.investment.score,
    imf?.govt_expenditure.current ?? null,
    oecd?.rd_expenditure.current ?? null
  );

  const econScore = scoreEconomicReadiness(
    gdpPpp,
    privateCredit,
    tradeOpenness,
    servicesShare,
    country.scores.economic_readiness.score,
    imf?.govt_debt.current ?? null
  );

  const totalScore = clamp(
    infraScore + talentScore + govScore + investScore + econScore,
    0,
    100
  );

  const trajectoryScore = calcTrajectoryScore(
    gdpCurrent,
    gdpPrev,
    rd,
    rdPrev,
    laborProd,
    laborProdPrev,
    hightechCurrent,
    hightechPrevious,
    broadband,
    broadbandPrev,
    policy,
    country.trajectory_score,
    anthropicScore
  );

  const projectedScore2028 = clamp(
    Math.round(totalScore + trajectoryScore * 1.5),
    0,
    100
  );

  // Derive the most recent calendar year of WB data used for this country
  const wbDataYear: number | null = wb
    ? (Object.values(wb)
        .map((v) => v.year)
        .filter((y): y is number => y !== null)
        .reduce<number | null>((max, y) => (max === null || y > max ? y : max), null))
    : null;

  // Raw indicator values behind the scores above — surfaced so narrative copy
  // (template + AI prompt) can cite real figures instead of just 0-20 scores.
  const rawIndicators = hasLiveData
    ? {
        internet_pct: internet,
        mobile_per_100: mobile,
        broadband_per_100: broadband,
        electricity_pct: electricity,
        tertiary_enrollment_pct: tertiary,
        labor_productivity_ppp: laborProd,
        rd_spend_pct_gdp: rd,
        fdi_pct_gdp: fdi,
        gov_effectiveness_wgi: govEff,
        rule_of_law_wgi: ruleOfLaw,
        regulatory_quality_wgi: regQuality,
        gdp_per_capita_ppp: gdpPpp,
        gdp_per_capita_usd: gdpCurrent,
        private_credit_pct_gdp: privateCredit,
        trade_openness_pct_gdp: tradeOpenness,
        services_share_pct_gdp: servicesShare,
        hightech_exports_pct: hightechCurrent,
      }
    : null;

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
    wb_data_year: wbDataYear,
    imf_data: !!imf,
    oecd_data: !!oecd,
    anthropic_data: anthropicScore !== null,
    raw_indicators: rawIndicators,
  };
}
