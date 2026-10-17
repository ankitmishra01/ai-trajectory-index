import type { PillarKey } from "./types";

export const PILLAR_KEYS = [
  "infrastructure",
  "talent",
  "governance",
  "investment",
  "economic_readiness",
] as const satisfies readonly PillarKey[];

export interface PillarMetadata {
  key: PillarKey;
  label: string;
  shortLabel: string;
  description: string;
  pointsAvailable: 20;
}

export const PILLAR_METADATA: Record<PillarKey, PillarMetadata> = {
  infrastructure: {
    key: "infrastructure",
    label: "Infrastructure",
    shortLabel: "Infrastructure",
    description: "Connectivity, electricity access, and digital infrastructure quality.",
    pointsAvailable: 20,
  },
  talent: {
    key: "talent",
    label: "Talent",
    shortLabel: "Talent",
    description: "Higher education, labour productivity, research capacity, and skills.",
    pointsAvailable: 20,
  },
  governance: {
    key: "governance",
    label: "Governance",
    shortLabel: "Governance",
    description: "Institutional quality, national AI policy, and regulatory capacity.",
    pointsAvailable: 20,
  },
  investment: {
    key: "investment",
    label: "Investment",
    shortLabel: "Investment",
    description: "Research spending, foreign capital, public capacity, and venture depth.",
    pointsAvailable: 20,
  },
  economic_readiness: {
    key: "economic_readiness",
    label: "Economic Readiness",
    shortLabel: "Economic",
    description: "Income, financial depth, trade integration, and service-sector capacity.",
    pointsAvailable: 20,
  },
};

export type MethodologySourceKind = "live" | "maintained" | "fallback";

export interface MethodologyComponent {
  key: string;
  pillar: PillarKey;
  displayOrder: number;
  label: string;
  source: string;
  sourceUrl: string;
  indicatorCode: string | null;
  unit: string | null;
  pointsAvailable: number;
  sourceKind: MethodologySourceKind;
  thresholdRule: string;
  fallbackRule: string;
  notes: string;
  countsTowardCoverage: boolean;
}

const WORLD_BANK = "https://data.worldbank.org";
const WGI = "https://www.worldbank.org/en/publication/worldwide-governance-indicators";
const OECD_DATA = "https://data-explorer.oecd.org";
const OECD_AI = "https://oecd.ai/en/";
const IMF = "https://www.imf.org/external/datamapper/";
const WIPO = "https://www.wipo.int/en/web/global-innovation-index";
const OXFORD = "https://oxfordinsights.com/ai-readiness/government-ai-readiness-index-2025/";
const INDEX_METHOD = "https://ai-trajectory-index.vercel.app/methodology";

const component = (item: MethodologyComponent): MethodologyComponent => item;

export const METHODOLOGY_COMPONENTS: readonly MethodologyComponent[] = [
  component({ key: "fixed_broadband", pillar: "infrastructure", displayOrder: 1, label: "Fixed broadband subscriptions", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "IT.NET.BBND.P2", unit: "per 100 people", pointsAvailable: 6, sourceKind: "live", thresholdRule: ">35: 6; >20: 4.5; >8: 3; >2: 1.5; otherwise 0.5", fallbackRule: "Use 6/20 of the static Infrastructure baseline.", notes: "Proxy for high-quality digital access.", countsTowardCoverage: true }),
  component({ key: "internet_users", pillar: "infrastructure", displayOrder: 2, label: "Individuals using the internet", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "IT.NET.USER.ZS", unit: "% of population", pointsAvailable: 3, sourceKind: "live", thresholdRule: ">85: 3; >65: 2.2; >40: 1.5; >15: 0.8; otherwise 0.3", fallbackRule: "Use 3/20 of the static Infrastructure baseline.", notes: "Measures broad digital access.", countsTowardCoverage: true }),
  component({ key: "mobile_subscriptions", pillar: "infrastructure", displayOrder: 3, label: "Mobile subscriptions", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "IT.CEL.SETS.P2", unit: "per 100 people", pointsAvailable: 3, sourceKind: "live", thresholdRule: ">120: 3; >80: 2.2; >40: 1.5; otherwise 0.5", fallbackRule: "Use 3/20 of the static Infrastructure baseline.", notes: "Measures mobile network reach.", countsTowardCoverage: true }),
  component({ key: "electricity_access", pillar: "infrastructure", displayOrder: 4, label: "Access to electricity", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "EG.ELC.ACCS.ZS", unit: "% of population", pointsAvailable: 3, sourceKind: "live", thresholdRule: ">97: 3; >80: 2; >50: 1; otherwise 0.3", fallbackRule: "Use 3/20 of the static Infrastructure baseline.", notes: "Captures a necessary condition for compute and connectivity.", countsTowardCoverage: true }),
  component({ key: "infrastructure_quality", pillar: "infrastructure", displayOrder: 5, label: "Infrastructure quality baseline", source: "AI Trajectory Index", sourceUrl: INDEX_METHOD, indicatorCode: null, unit: null, pointsAvailable: 5, sourceKind: "fallback", thresholdRule: "Award 5/20 of the static Infrastructure baseline.", fallbackRule: "This designed residual has no live replacement.", notes: "Represents server density, cloud availability, grid reliability, and related quality signals.", countsTowardCoverage: false }),

  component({ key: "tertiary_enrollment", pillar: "talent", displayOrder: 1, label: "Gross tertiary enrolment", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "SE.TER.ENRR", unit: "% gross", pointsAvailable: 6, sourceKind: "live", thresholdRule: ">70: 6; >50: 4.5; >30: 3; >15: 1.8; otherwise 0.8", fallbackRule: "Use 6/20 of the static Talent baseline.", notes: "Measures the volume of the advanced education pipeline.", countsTowardCoverage: true }),
  component({ key: "labor_productivity", pillar: "talent", displayOrder: 2, label: "Labour productivity", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "SL.GDP.PCAP.EM.KD", unit: "constant 2017 PPP dollars per worker", pointsAvailable: 6, sourceKind: "live", thresholdRule: ">85,000: 6; >65,000: 4.5; >40,000: 3; >18,000: 1.5; otherwise 0.75", fallbackRule: "Use 6/20 of the static Talent baseline.", notes: "Measures whether human capital is productively deployed.", countsTowardCoverage: true }),
  component({ key: "oecd_researchers", pillar: "talent", displayOrder: 3, label: "Researchers", source: "OECD Data Explorer", sourceUrl: OECD_DATA, indicatorCode: "MSTI T_RS.10P3EMP", unit: "FTE per 1,000 employment", pointsAvailable: 2, sourceKind: "live", thresholdRule: ">10: 2; >6: 1.5; >3: 1; otherwise 0.5", fallbackRule: "Return this allocation to the static Talent baseline.", notes: "Available primarily for OECD members and partners.", countsTowardCoverage: true }),
  component({ key: "wipo_gii", pillar: "talent", displayOrder: 4, label: "Global Innovation Index", source: "World Intellectual Property Organization", sourceUrl: WIPO, indicatorCode: "WIPO_GII", unit: "score, 0 to 100", pointsAvailable: 1, sourceKind: "maintained", thresholdRule: ">55: 1; >40: 0.7; >25: 0.4; otherwise 0.2", fallbackRule: "Return this allocation to the static Talent baseline.", notes: "Maintained annual enrichment, not a live API input.", countsTowardCoverage: true }),
  component({ key: "talent_quality", pillar: "talent", displayOrder: 5, label: "Talent quality baseline", source: "AI Trajectory Index", sourceUrl: INDEX_METHOD, indicatorCode: null, unit: null, pointsAvailable: 5, sourceKind: "fallback", thresholdRule: "Award the unreplaced share of the 8-point static Talent allocation.", fallbackRule: "This designed residual has no live replacement.", notes: "Represents education quality, ICT skills, researcher capacity, and brain-drain conditions.", countsTowardCoverage: false }),

  component({ key: "rule_of_law", pillar: "governance", displayOrder: 1, label: "Rule of Law", source: "Worldwide Governance Indicators", sourceUrl: WGI, indicatorCode: "GOV_WGI_RL.EST", unit: "estimate, -2.5 to 2.5", pointsAvailable: 5, sourceKind: "live", thresholdRule: "Normalize continuously from -2.5 to 2.5.", fallbackRule: "Use 5/20 of the static Governance baseline.", notes: "Measures contract enforcement, rights, and judicial quality.", countsTowardCoverage: true }),
  component({ key: "government_effectiveness", pillar: "governance", displayOrder: 2, label: "Government Effectiveness", source: "Worldwide Governance Indicators", sourceUrl: WGI, indicatorCode: "GOV_WGI_GE.EST", unit: "estimate, -2.5 to 2.5", pointsAvailable: 4, sourceKind: "live", thresholdRule: "Normalize continuously from -2.5 to 2.5.", fallbackRule: "Use 4/20 of the static Governance baseline.", notes: "Measures public-service and policy implementation capacity.", countsTowardCoverage: true }),
  component({ key: "regulatory_quality", pillar: "governance", displayOrder: 3, label: "Regulatory Quality", source: "Worldwide Governance Indicators", sourceUrl: WGI, indicatorCode: "GOV_WGI_RQ.EST", unit: "estimate, -2.5 to 2.5", pointsAvailable: 3, sourceKind: "live", thresholdRule: "Normalize continuously from -2.5 to 2.5.", fallbackRule: "Use 3/20 of the static Governance baseline.", notes: "Measures capacity for market-supporting regulation.", countsTowardCoverage: true }),
  component({ key: "national_ai_strategy", pillar: "governance", displayOrder: 4, label: "National AI strategy", source: "OECD.AI Policy Observatory", sourceUrl: OECD_AI, indicatorCode: null, unit: "yes or no", pointsAvailable: 3, sourceKind: "maintained", thresholdRule: "A published national strategy receives 3 points.", fallbackRule: "No strategy receives 0 points.", notes: "Maintained national-policy field.", countsTowardCoverage: true }),
  component({ key: "strategy_recency", pillar: "governance", displayOrder: 5, label: "AI strategy recency", source: "OECD.AI Policy Observatory", sourceUrl: OECD_AI, indicatorCode: null, unit: "year", pointsAvailable: 2, sourceKind: "maintained", thresholdRule: "2022 or later: 2; 2019 to 2021: 1; older or absent: 0.", fallbackRule: "No dated strategy receives 0 points.", notes: "Maintained policy date.", countsTowardCoverage: true }),
  component({ key: "ai_regulation", pillar: "governance", displayOrder: 6, label: "AI regulation in force", source: "OECD.AI Policy Observatory", sourceUrl: OECD_AI, indicatorCode: null, unit: "yes or no", pointsAvailable: 1, sourceKind: "maintained", thresholdRule: "A regulation flag receives 1 point.", fallbackRule: "No regulation flag receives 0 points.", notes: "Measures existence, not regulatory quality.", countsTowardCoverage: true }),
  component({ key: "oxford_readiness", pillar: "governance", displayOrder: 7, label: "Government AI readiness", source: "Oxford Insights", sourceUrl: OXFORD, indicatorCode: "OXFORD_GARI", unit: "score, 0 to 100", pointsAvailable: 2, sourceKind: "maintained", thresholdRule: ">=65: 2; >=45: 1.5; >=30: 1; otherwise 0.5", fallbackRule: "Use 2/20 of the static Governance baseline.", notes: "Maintained annual enrichment, not a live API input.", countsTowardCoverage: true }),

  component({ key: "rd_expenditure", pillar: "investment", displayOrder: 1, label: "R&D expenditure", source: "OECD Data Explorer, then World Bank Open Data", sourceUrl: OECD_DATA, indicatorCode: "GB.XPD.RSDV.GD.ZS", unit: "% of GDP", pointsAvailable: 6, sourceKind: "live", thresholdRule: ">3.5: 6; >2: 4.5; >1: 3; >0.3: 1.5; otherwise 0.5", fallbackRule: "Use 6/20 of the static Investment baseline.", notes: "OECD data takes precedence when available; the World Bank series is otherwise used.", countsTowardCoverage: true }),
  component({ key: "fdi_inflows", pillar: "investment", displayOrder: 2, label: "FDI net inflows", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "BX.KLT.DINV.WD.GD.ZS", unit: "% of GDP", pointsAvailable: 5, sourceKind: "live", thresholdRule: "Cap at 20; >10: 5; >4: 4; >1.5: 3; >0: 2; otherwise 0.5", fallbackRule: "Use 5/20 of the static Investment baseline.", notes: "Measures realised foreign capital attraction.", countsTowardCoverage: true }),
  component({ key: "government_expenditure", pillar: "investment", displayOrder: 3, label: "Government expenditure", source: "IMF DataMapper", sourceUrl: IMF, indicatorCode: "G_X_G01_GDP_PT", unit: "% of GDP", pointsAvailable: 3, sourceKind: "live", thresholdRule: ">=45: 3; >=35: 2; >=25: 1; otherwise 0.5", fallbackRule: "Return this allocation to the static Investment baseline.", notes: "Replaces 3 points of the capital-ecosystem baseline when available.", countsTowardCoverage: true }),
  component({ key: "capital_ecosystem", pillar: "investment", displayOrder: 4, label: "Capital ecosystem baseline", source: "AI Trajectory Index", sourceUrl: INDEX_METHOD, indicatorCode: null, unit: null, pointsAvailable: 6, sourceKind: "fallback", thresholdRule: "Award the unreplaced share of the 9-point static Investment allocation.", fallbackRule: "This designed residual has no live replacement.", notes: "Represents venture activity, startup density, deal flow, and related capital-market depth.", countsTowardCoverage: false }),

  component({ key: "gdp_per_capita_ppp", pillar: "economic_readiness", displayOrder: 1, label: "GDP per capita, PPP", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "NY.GDP.PCAP.PP.KD", unit: "constant 2017 international dollars", pointsAvailable: 6, sourceKind: "live", thresholdRule: ">55,000: 6; >30,000: 4.5; >12,000: 3; >4,000: 1.5; otherwise 0.5", fallbackRule: "Use 6/20 of the static Economic Readiness baseline.", notes: "Purchasing-power-adjusted economic capacity.", countsTowardCoverage: true }),
  component({ key: "private_credit", pillar: "economic_readiness", displayOrder: 2, label: "Private-sector credit", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "FS.AST.PRVT.GD.ZS", unit: "% of GDP", pointsAvailable: 3, sourceKind: "live", thresholdRule: ">150: 3; >80: 2.2; >40: 1.5; >15: 0.8; otherwise 0.3", fallbackRule: "Use 3/20 of the static Economic Readiness baseline.", notes: "Measures financial depth available to firms.", countsTowardCoverage: true }),
  component({ key: "trade_openness", pillar: "economic_readiness", displayOrder: 3, label: "Trade openness", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "NE.TRD.GNFS.ZS", unit: "% of GDP", pointsAvailable: 3, sourceKind: "live", thresholdRule: "Cap at 200; >120: 3; >70: 2.2; >40: 1.5; >20: 0.8; otherwise 0.3", fallbackRule: "Use 3/20 of the static Economic Readiness baseline.", notes: "Measures access to international markets and supply chains.", countsTowardCoverage: true }),
  component({ key: "services_share", pillar: "economic_readiness", displayOrder: 4, label: "Services value added", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "NV.SRV.TOTL.ZS", unit: "% of GDP", pointsAvailable: 3, sourceKind: "live", thresholdRule: ">75: 3; >60: 2.2; >45: 1.5; >30: 0.8; otherwise 0.3", fallbackRule: "Use 3/20 of the static Economic Readiness baseline.", notes: "Proxy for knowledge-economy capacity.", countsTowardCoverage: true }),
  component({ key: "market_capacity", pillar: "economic_readiness", displayOrder: 5, label: "Market capacity baseline", source: "AI Trajectory Index", sourceUrl: INDEX_METHOD, indicatorCode: null, unit: null, pointsAvailable: 5, sourceKind: "fallback", thresholdRule: "Award 5/20 of the static Economic Readiness baseline; subtract 1 when IMF debt exceeds 100% of GDP.", fallbackRule: "This designed residual has no live replacement.", notes: "Represents economic complexity, digital-market capacity, and business conditions.", countsTowardCoverage: false }),
  component({ key: "government_debt", pillar: "economic_readiness", displayOrder: 6, label: "Government debt modifier", source: "IMF DataMapper", sourceUrl: IMF, indicatorCode: "GGXWDG_NGDP", unit: "% of GDP", pointsAvailable: 0, sourceKind: "live", thresholdRule: "Above 100 subtracts 1 point from the market-capacity allocation.", fallbackRule: "No adjustment when unavailable.", notes: "A modifier, not a separately weighted component.", countsTowardCoverage: true }),

  component({ key: "gdp_growth_trajectory", pillar: "economic_readiness", displayOrder: 90, label: "GDP per capita growth trajectory input", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "NY.GDP.PCAP.CD", unit: "% change", pointsAvailable: 0, sourceKind: "live", thresholdRule: "Used only in the separate Trajectory score.", fallbackRule: "Use the corresponding share of the static Trajectory baseline.", notes: "Registered here for data-dictionary completeness; it does not affect Readiness points.", countsTowardCoverage: false }),
  component({ key: "hightech_exports_trajectory", pillar: "investment", displayOrder: 90, label: "High-technology exports trajectory input", source: "World Bank Open Data", sourceUrl: WORLD_BANK, indicatorCode: "TX.VAL.TECH.MF.ZS", unit: "% of manufactured exports", pointsAvailable: 0, sourceKind: "live", thresholdRule: "Used only in the separate Trajectory score.", fallbackRule: "Use the corresponding share of the static Trajectory baseline.", notes: "Registered here for data-dictionary completeness; it does not affect Readiness points.", countsTowardCoverage: false }),
] as const;

export const METHODOLOGY_BY_KEY = new Map(
  METHODOLOGY_COMPONENTS.map((item) => [item.key, item]),
);
