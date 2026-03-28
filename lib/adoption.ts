import type { ScoredCountry } from "@/lib/types";

export interface AdoptionScores {
  government: number;
  enterprise: number;
  talent_demand: number;
  consumer: number;
  pipeline: number;
}

export interface AdoptionEntry {
  slug: string;
  adoption_scores: AdoptionScores;
  adoption_total: number;
  adoption_tier: "High Adoption" | "Growing Adoption" | "Early Adoption" | "Nascent Adoption";
  top_adoption_driver: string;
  adoption_gap: number;
}

export interface EnrichedAdoption extends AdoptionEntry {
  name: string;
  flag: string;
  region: string;
  readiness_total: number;
}

export function enrichAdoption(
  adoptionData: AdoptionEntry[],
  countries: ScoredCountry[]
): EnrichedAdoption[] {
  return adoptionData
    .map((a) => {
      const c = countries.find((c) => c.slug === a.slug);
      if (!c) return null;
      return {
        ...a,
        name: c.name,
        flag: c.flag,
        region: c.region,
        readiness_total: c.total_score,
      };
    })
    .filter(Boolean) as EnrichedAdoption[];
}

export const TIER_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  "High Adoption":     { color: "#4ade80", bg: "rgba(74,222,128,.08)",  border: "rgba(74,222,128,.25)"  },
  "Growing Adoption":  { color: "#60a5fa", bg: "rgba(96,165,250,.08)",  border: "rgba(96,165,250,.25)"  },
  "Early Adoption":    { color: "#f59e0b", bg: "rgba(245,158,11,.08)",  border: "rgba(245,158,11,.25)"  },
  "Nascent Adoption":  { color: "#f87171", bg: "rgba(248,113,113,.08)", border: "rgba(248,113,113,.25)" },
};

export const DIM_LABELS: Record<keyof AdoptionScores, string> = {
  government:    "Government Deployment",
  enterprise:    "Enterprise Adoption",
  talent_demand: "Talent Demand",
  consumer:      "Consumer Usage",
  pipeline:      "R&D Pipeline",
};

export const DIM_COLORS: Record<keyof AdoptionScores, string> = {
  government:    "#3b82f6",
  enterprise:    "#8b5cf6",
  talent_demand: "#06b6d4",
  consumer:      "#22c55e",
  pipeline:      "#f59e0b",
};
