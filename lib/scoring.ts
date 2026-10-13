import { METHODOLOGY_BY_KEY } from "./methodology";
import { buildCoverage } from "./provenance";
import type {
  Country,
  CountryProvenance,
  ProvenanceStatus,
  ScoreComponentProvenance,
  ScoredCountry,
} from "./types";
import type { IndicatorValues, WorldBankData } from "./worldbank";
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

interface PillarCalculation {
  score: number;
  rawPoints: number;
  components: ScoreComponentProvenance[];
}

interface ComponentOptions {
  value: number | boolean | null;
  year: number | null;
  pointsEarned: number;
  status: ProvenanceStatus;
  substitution?: string | null;
  source?: string;
  sourceUrl?: string;
  indicatorCode?: string | null;
}

function component(key: string, options: ComponentOptions): ScoreComponentProvenance {
  const metadata = METHODOLOGY_BY_KEY.get(key);
  if (!metadata) throw new Error(`Missing methodology metadata for ${key}`);
  return {
    key,
    label: metadata.label,
    pillar: metadata.pillar,
    source: options.source ?? metadata.source,
    sourceUrl: options.sourceUrl ?? metadata.sourceUrl,
    indicatorCode: options.indicatorCode ?? metadata.indicatorCode,
    value: options.value,
    unit: metadata.unit,
    year: options.year,
    pointsEarned: options.pointsEarned,
    pointsAvailable: metadata.pointsAvailable,
    status: options.status,
    substitution: options.substitution ?? null,
  };
}

function fallbackComponent(
  key: string,
  staticScore: number,
  reason: string,
): ScoreComponentProvenance {
  const metadata = METHODOLOGY_BY_KEY.get(key);
  if (!metadata) throw new Error(`Missing methodology metadata for ${key}`);
  return component(key, {
    value: null,
    year: null,
    pointsEarned: (staticScore / 20) * metadata.pointsAvailable,
    status: "fallback",
    substitution: `${reason}; used ${metadata.pointsAvailable}/20 of the static ${metadata.pillar === "economic_readiness" ? "Economic Readiness" : metadata.pillar[0].toUpperCase() + metadata.pillar.slice(1)} baseline.`,
  });
}

const current = (values: IndicatorValues | undefined): number | null =>
  values?.current ?? null;

const year = (values: IndicatorValues | undefined): number | null => values?.year ?? null;

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
  internetValues: IndicatorValues | undefined,
  mobileValues: IndicatorValues | undefined,
  electricityValues: IndicatorValues | undefined,
  broadbandValues: IndicatorValues | undefined,
  staticScore: number
): PillarCalculation {
  const internet = current(internetValues);
  const mobile = current(mobileValues);
  const electricity = current(electricityValues);
  const broadband = current(broadbandValues);
  const components: ScoreComponentProvenance[] = [];

  // Fixed broadband (6 pts) — best available proxy for digital infrastructure quality
  if (broadband !== null) {
    const points = broadband > 35 ? 6 : broadband > 20 ? 4.5 : broadband > 8 ? 3 : broadband > 2 ? 1.5 : 0.5;
    components.push(component("fixed_broadband", { value: broadband, year: year(broadbandValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("fixed_broadband", staticScore, "World Bank fixed-broadband value unavailable"));
  }

  // Internet users % (3 pts) — access signal, limited discriminatory power above 80%
  if (internet !== null) {
    const points = internet > 85 ? 3 : internet > 65 ? 2.2 : internet > 40 ? 1.5 : internet > 15 ? 0.8 : 0.3;
    components.push(component("internet_users", { value: internet, year: year(internetValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("internet_users", staticScore, "World Bank internet-use value unavailable"));
  }

  // Mobile subscriptions/100 (3 pts) — counts SIMs not people, less meaningful above 100
  if (mobile !== null) {
    const points = mobile > 120 ? 3 : mobile > 80 ? 2.2 : mobile > 40 ? 1.5 : 0.5;
    components.push(component("mobile_subscriptions", { value: mobile, year: year(mobileValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("mobile_subscriptions", staticScore, "World Bank mobile-subscription value unavailable"));
  }

  // Electricity access % (3 pts) — critical for AI compute; saturated for OECD
  if (electricity !== null) {
    const points = electricity > 97 ? 3 : electricity > 80 ? 2 : electricity > 50 ? 1 : 0.3;
    components.push(component("electricity_access", { value: electricity, year: year(electricityValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("electricity_access", staticScore, "World Bank electricity-access value unavailable"));
  }

  // Static quality proxy (5 pts) — server infrastructure, cloud regions, grid reliability
  components.push(fallbackComponent("infrastructure_quality", staticScore, "Designed infrastructure-quality residual"));

  // Max raw = 20
  const rawPoints = components.reduce((sum, item) => sum + item.pointsEarned, 0);
  return { score: clamp(Math.round(rawPoints), 0, 20), rawPoints, components };
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
  tertiaryValues: IndicatorValues | undefined,
  laborProdValues: IndicatorValues | undefined,
  staticScore: number,
  oecdResearchersValues: IndicatorValues | undefined,
  wipoGii: number | null
): PillarCalculation {
  const tertiary = current(tertiaryValues);
  const laborProd = current(laborProdValues);
  const oecdResearchers = current(oecdResearchersValues);
  const components: ScoreComponentProvenance[] = [];

  // Tertiary enrollment % (6 pts) — volume of talent pipeline
  if (tertiary !== null) {
    const points = tertiary > 70 ? 6 : tertiary > 50 ? 4.5 : tertiary > 30 ? 3 : tertiary > 15 ? 1.8 : 0.8;
    components.push(component("tertiary_enrollment", { value: tertiary, year: year(tertiaryValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("tertiary_enrollment", staticScore, "World Bank tertiary-enrolment value unavailable"));
  }

  // Labor productivity (6 pts) — GDP per employed person (constant 2017 PPP$)
  if (laborProd !== null) {
    components.push(component("labor_productivity", { value: laborProd, year: year(laborProdValues), pointsEarned: scoreLaborProductivity(laborProd), status: "live" }));
  } else {
    components.push(fallbackComponent("labor_productivity", staticScore, "World Bank labour-productivity value unavailable"));
  }

  // Static talent quality proxy — 8pts, partially replaced by live sources when available
  // OECD researchers/1000 employed (−2pts from static, +2pts live)
  // WIPO GII innovation score (−1pt from static, +1pt live)
  if (oecdResearchers !== null) {
    const points = oecdResearchers > 10 ? 2 : oecdResearchers > 6 ? 1.5 : oecdResearchers > 3 ? 1 : 0.5;
    components.push(component("oecd_researchers", { value: oecdResearchers, year: year(oecdResearchersValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("oecd_researchers", staticScore, "OECD researcher-density value unavailable"));
  }
  if (wipoGii !== null) {
    const points = wipoGii > 55 ? 1 : wipoGii > 40 ? 0.7 : wipoGii > 25 ? 0.4 : 0.2;
    components.push(component("wipo_gii", { value: wipoGii, year: 2024, pointsEarned: points, status: "enriched" }));
  } else {
    components.push(fallbackComponent("wipo_gii", staticScore, "WIPO Global Innovation Index value unavailable"));
  }
  components.push(fallbackComponent("talent_quality", staticScore, "Designed talent-quality residual"));

  const rawPoints = components.reduce((sum, item) => sum + item.pointsEarned, 0);
  return { score: clamp(Math.round(rawPoints), 0, 20), rawPoints, components };
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
  govEffValues: IndicatorValues | undefined,
  ruleOfLawValues: IndicatorValues | undefined,
  regQualityValues: IndicatorValues | undefined,
  policy: PolicyData,
  staticScore: number,
  oxfordInsights: number | null
): PillarCalculation {
  const govEff = current(govEffValues);
  const ruleOfLaw = current(ruleOfLawValues);
  const regQuality = current(regQualityValues);
  const components: ScoreComponentProvenance[] = [];

  // Rule of Law (5 pts) — continuous WGI signal
  const rolPts = normalizeWGI(ruleOfLaw, 5);
  components.push(rolPts !== null
    ? component("rule_of_law", { value: ruleOfLaw, year: year(ruleOfLawValues), pointsEarned: rolPts, status: "live" })
    : fallbackComponent("rule_of_law", staticScore, "World Bank Rule of Law estimate unavailable"));

  // Government Effectiveness (4 pts)
  const gePts = normalizeWGI(govEff, 4);
  components.push(gePts !== null
    ? component("government_effectiveness", { value: govEff, year: year(govEffValues), pointsEarned: gePts, status: "live" })
    : fallbackComponent("government_effectiveness", staticScore, "World Bank Government Effectiveness estimate unavailable"));

  // Regulatory Quality (3 pts)
  const rqPts = normalizeWGI(regQuality, 3);
  components.push(rqPts !== null
    ? component("regulatory_quality", { value: regQuality, year: year(regQualityValues), pointsEarned: rqPts, status: "live" })
    : fallbackComponent("regulatory_quality", staticScore, "World Bank Regulatory Quality estimate unavailable"));

  // AI strategy (3 pts base + 2 bonus for recency)
  const strategyPoints = policy.has_national_ai_strategy ? 3 : 0;
  components.push(component("national_ai_strategy", { value: policy.has_national_ai_strategy, year: policy.strategy_year, pointsEarned: strategyPoints, status: "policy" }));
  const recencyPoints = policy.has_national_ai_strategy && policy.strategy_year
    ? policy.strategy_year >= 2022 ? 2 : policy.strategy_year >= 2019 ? 1 : 0
    : 0;
  components.push(component("strategy_recency", { value: policy.strategy_year, year: policy.strategy_year, pointsEarned: recencyPoints, status: "policy" }));
  // No negative penalty for lacking strategy — absence is already scored via WGI

  // AI regulation (1 pt) — existence only, not quality
  components.push(component("ai_regulation", { value: policy.has_ai_regulation, year: null, pointsEarned: policy.has_ai_regulation ? 1 : 0, status: "policy" }));

  // Static institutional proxy (2 pts) — replaced by Oxford Insights when available
  if (oxfordInsights !== null) {
    const points = oxfordInsights >= 65 ? 2 : oxfordInsights >= 45 ? 1.5 : oxfordInsights >= 30 ? 1 : 0.5;
    components.push(component("oxford_readiness", { value: oxfordInsights, year: 2024, pointsEarned: points, status: "enriched" }));
  } else {
    components.push(fallbackComponent("oxford_readiness", staticScore, "Oxford Insights readiness value unavailable"));
  }

  // Max raw = 20
  const rawPoints = components.reduce((sum, item) => sum + item.pointsEarned, 0);
  return { score: clamp(Math.round(rawPoints), 0, 20), rawPoints, components };
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
  rdValues: IndicatorValues | undefined,
  fdiValues: IndicatorValues | undefined,
  staticScore: number,
  imfGovtExpenditureValues: IndicatorValues | undefined,
  oecdRdValues: IndicatorValues | undefined
): PillarCalculation {
  const rd = current(rdValues);
  const fdi = current(fdiValues);
  const imfGovtExpenditure = current(imfGovtExpenditureValues);
  const oecdRd = current(oecdRdValues);
  const hasAny = rd !== null || fdi !== null || imfGovtExpenditure !== null || oecdRd !== null;
  const components: ScoreComponentProvenance[] = [];

  // R&D spend % GDP (6 pts) — prefer OECD business R&D when available, else WB total R&D
  const effectiveRd = oecdRd ?? rd;
  if (effectiveRd !== null) {
    const points = effectiveRd > 3.5 ? 6 : effectiveRd > 2 ? 4.5 : effectiveRd > 1 ? 3 : effectiveRd > 0.3 ? 1.5 : 0.5;
    const usesOecd = oecdRd !== null;
    components.push(component("rd_expenditure", {
      value: effectiveRd,
      year: usesOecd ? year(oecdRdValues) : year(rdValues),
      pointsEarned: points,
      status: "live",
      source: usesOecd ? "OECD Data Explorer" : "World Bank Open Data",
      sourceUrl: usesOecd ? "https://data-explorer.oecd.org" : "https://data.worldbank.org",
      indicatorCode: usesOecd ? "GPERD.PC_GDP" : "GB.XPD.RSDV.GD.ZS",
    }));
  } else {
    components.push(fallbackComponent("rd_expenditure", staticScore, "OECD and World Bank R&D expenditure values unavailable"));
  }

  // FDI net inflows % GDP (5 pts) — actual foreign capital attraction signal
  if (fdi !== null) {
    const clampedFdi = Math.min(fdi, 20);
    const points = clampedFdi > 10 ? 5 : clampedFdi > 4 ? 4 : clampedFdi > 1.5 ? 3 : clampedFdi > 0 ? 2 : 0.5;
    components.push(component("fdi_inflows", { value: fdi, year: year(fdiValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("fdi_inflows", staticScore, "World Bank FDI value unavailable"));
  }

  // Static VC ecosystem proxy: 9pts when no IMF data; 3pts replaced by IMF govt expenditure signal
  if (imfGovtExpenditure !== null) {
    const points = imfGovtExpenditure >= 45 ? 3 : imfGovtExpenditure >= 35 ? 2 : imfGovtExpenditure >= 25 ? 1 : 0.5;
    components.push(component("government_expenditure", { value: imfGovtExpenditure, year: year(imfGovtExpenditureValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("government_expenditure", staticScore, "IMF government-expenditure value unavailable"));
  }
  components.push(fallbackComponent("capital_ecosystem", staticScore, "Designed capital-ecosystem residual"));

  const rawPoints = components.reduce((sum, item) => sum + item.pointsEarned, 0);
  const score = hasAny ? clamp(Math.round(rawPoints), 0, 20) : staticScore;
  return { score, rawPoints, components };
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
  gdpPppValues: IndicatorValues | undefined,
  privateCreditValues: IndicatorValues | undefined,
  tradeOpennessValues: IndicatorValues | undefined,
  servicesShareValues: IndicatorValues | undefined,
  staticScore: number,
  imfGovtDebtValues: IndicatorValues | undefined
): PillarCalculation {
  const gdpPpp = current(gdpPppValues);
  const privateCredit = current(privateCreditValues);
  const tradeOpenness = current(tradeOpennessValues);
  const servicesShare = current(servicesShareValues);
  const imfGovtDebt = current(imfGovtDebtValues);
  const hasAny =
    gdpPpp !== null || privateCredit !== null ||
    tradeOpenness !== null || servicesShare !== null;
  const components: ScoreComponentProvenance[] = [];

  // GDP per capita PPP — constant 2017 international $ (6 pts)
  if (gdpPpp !== null) {
    const points = gdpPpp > 55_000 ? 6 : gdpPpp > 30_000 ? 4.5 : gdpPpp > 12_000 ? 3 : gdpPpp > 4_000 ? 1.5 : 0.5;
    components.push(component("gdp_per_capita_ppp", { value: gdpPpp, year: year(gdpPppValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("gdp_per_capita_ppp", staticScore, "World Bank GDP per capita PPP value unavailable"));
  }

  // Private sector credit % GDP (3 pts) — financial depth signals ability to fund AI adoption
  if (privateCredit !== null) {
    const points = privateCredit > 150 ? 3 : privateCredit > 80 ? 2.2 : privateCredit > 40 ? 1.5 : privateCredit > 15 ? 0.8 : 0.3;
    components.push(component("private_credit", { value: privateCredit, year: year(privateCreditValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("private_credit", staticScore, "World Bank private-credit value unavailable"));
  }

  // Trade openness % GDP (3 pts) — access to global tech supply chains and talent
  if (tradeOpenness !== null) {
    // Small open economies (Singapore, Netherlands) naturally score very high.
    // Large economies (US, India) have structurally lower ratios — not a penalty.
    const capped = Math.min(tradeOpenness, 200); // cap extreme small-country outliers
    const points = capped > 120 ? 3 : capped > 70 ? 2.2 : capped > 40 ? 1.5 : capped > 20 ? 0.8 : 0.3;
    components.push(component("trade_openness", { value: tradeOpenness, year: year(tradeOpennessValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("trade_openness", staticScore, "World Bank trade-openness value unavailable"));
  }

  // Services value added % GDP (3 pts) — AI is a services-sector technology
  if (servicesShare !== null) {
    const points = servicesShare > 75 ? 3 : servicesShare > 60 ? 2.2 : servicesShare > 45 ? 1.5 : servicesShare > 30 ? 0.8 : 0.3;
    components.push(component("services_share", { value: servicesShare, year: year(servicesShareValues), pointsEarned: points, status: "live" }));
  } else {
    components.push(fallbackComponent("services_share", staticScore, "World Bank services-share value unavailable"));
  }

  // Static market capacity proxy (5 pts); high govt debt (>100% GDP) reduces by 1pt
  const staticPts = (staticScore / 20) * 5;
  components.push(component("market_capacity", { value: null, year: null, pointsEarned: staticPts, status: "fallback", substitution: "Designed market-capacity residual; no live replacement is defined." }));
  const debtAdjustment = hasAny && imfGovtDebt !== null && imfGovtDebt > 100
    ? Math.max(0, staticPts - 1) - staticPts
    : 0;
  components.push(imfGovtDebt !== null
    ? component("government_debt", { value: imfGovtDebt, year: year(imfGovtDebtValues), pointsEarned: debtAdjustment, status: "live" })
    : component("government_debt", { value: null, year: null, pointsEarned: 0, status: "fallback", substitution: "IMF government-debt value unavailable; no score adjustment was applied." }));

  const rawPoints = components.reduce((sum, item) => sum + item.pointsEarned, 0);
  const score = hasAny ? clamp(Math.round(rawPoints), 0, 20) : staticScore;
  return { score, rawPoints, components };
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

  const infraCalculation = scoreInfrastructure(
    wb?.internet,
    wb?.mobile,
    wb?.electricity,
    wb?.broadband,
    country.scores.infrastructure.score
  );

  const talentCalculation = scoreTalent(
    wb?.tertiary,
    wb?.labor_productivity,
    country.scores.talent.score,
    oecd?.researchers,
    ext?.wipo_gii ?? null
  );

  const governanceCalculation = scoreGovernance(
    wb?.gov_effectiveness,
    wb?.rule_of_law,
    wb?.regulatory_quality,
    policy,
    country.scores.governance.score,
    ext?.oxford_insights ?? null
  );

  const investmentCalculation = scoreInvestment(
    wb?.rd,
    wb?.fdi,
    country.scores.investment.score,
    imf?.govt_expenditure,
    oecd?.rd_expenditure
  );

  const economicCalculation = scoreEconomicReadiness(
    wb?.gdp_ppp,
    wb?.private_credit,
    wb?.trade_openness,
    wb?.services_share,
    country.scores.economic_readiness.score,
    imf?.govt_debt
  );

  const infraScore = infraCalculation.score;
  const talentScore = talentCalculation.score;
  const govScore = governanceCalculation.score;
  const investScore = investmentCalculation.score;
  const econScore = economicCalculation.score;

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

  const provenance: CountryProvenance = {
    infrastructure: infraCalculation.components,
    talent: talentCalculation.components,
    governance: governanceCalculation.components,
    investment: investmentCalculation.components,
    economic_readiness: economicCalculation.components,
  };

  const scoredCountry: ScoredCountry & {
    provenance: CountryProvenance;
    coverage: ReturnType<typeof buildCoverage>;
  } = {
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
    provenance,
    coverage: buildCoverage(provenance),
  };

  return scoredCountry;
}
