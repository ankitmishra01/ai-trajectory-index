import { NextResponse } from "next/server";
import { fetchWorldBankIndicators } from "@/lib/worldbank";
import { calculateScores } from "@/lib/scoring";
import { SLUG_TO_ISO2 } from "@/lib/slugToIso";
import countriesData from "@/data/countries.json";
import aiPolicies from "@/data/ai-policies.json";
import type { PolicyData } from "@/lib/scoring";
import type { ScoredCountry } from "@/lib/types";

export const revalidate = 86400; // 24 hours

export async function GET() {
  const policies = aiPolicies as Record<string, PolicyData>;
  let usingLiveData = true;

  let wbData = {};

  try {
    wbData = await fetchWorldBankIndicators();
  } catch {
    usingLiveData = false;
  }

  const scored: ScoredCountry[] = countriesData.countries.map((country) => {
    const iso2 = SLUG_TO_ISO2[country.slug] ?? "";
    return calculateScores(country, iso2, wbData, policies);
  });

  return NextResponse.json({
    countries: scored,
    last_updated: new Date().toISOString(),
    using_live_data: usingLiveData,
  });
}
