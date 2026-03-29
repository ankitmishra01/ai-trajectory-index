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

export interface ScoredCountry extends Country {
  data_source: "live" | "fallback";
  wb_data_year: number | null;   // most recent calendar year of World Bank data used
}

export interface ScoresResponse {
  countries: ScoredCountry[];
  last_updated: string;
  using_live_data: boolean;
}
