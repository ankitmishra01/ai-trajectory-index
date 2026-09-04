export interface DimensionScore {
  score: number;
  reasons: string[];
}

export interface Country {
  id: string;
  slug: string;
  name: string;
  flag: string;
  region: string;
  scores: {
    infrastructure: DimensionScore;
    talent: DimensionScore;
    governance: DimensionScore;
    investment: DimensionScore;
    economic_readiness: DimensionScore;
  };
  total_score: number;
  trajectory_score: number;
  trajectory_label: string;
  projected_score_2028: number;
  top_accelerator: string;
  top_risk: string;
  comparable_countries: string[];
}

export interface RawIndicators {
  internet_pct: number | null;
  mobile_per_100: number | null;
  broadband_per_100: number | null;
  electricity_pct: number | null;
  tertiary_enrollment_pct: number | null;
  labor_productivity_ppp: number | null;
  rd_spend_pct_gdp: number | null;
  fdi_pct_gdp: number | null;
  gov_effectiveness_wgi: number | null;
  rule_of_law_wgi: number | null;
  regulatory_quality_wgi: number | null;
  gdp_per_capita_ppp: number | null;
  gdp_per_capita_usd: number | null;
  private_credit_pct_gdp: number | null;
  trade_openness_pct_gdp: number | null;
  services_share_pct_gdp: number | null;
  hightech_exports_pct: number | null;
}

export interface ScoredCountry extends Country {
  data_source: "live" | "fallback";
  wb_data_year: number | null;
  imf_data: boolean;
  oecd_data: boolean;
  anthropic_data: boolean;
  raw_indicators?: RawIndicators | null;
}

export interface NarrativeSection {
  heading: string;
  body: string;
}

export interface ScoresResponse {
  countries: ScoredCountry[];
  last_updated: string;
  using_live_data: boolean;
}
