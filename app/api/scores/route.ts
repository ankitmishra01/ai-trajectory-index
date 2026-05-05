import { NextResponse } from "next/server";
import { fetchWorldBankIndicators } from "@/lib/worldbank";
import { fetchIMFData } from "@/lib/imf";
import { fetchOECDData } from "@/lib/oecd";
import { fetchAnthropicIndex } from "@/lib/anthropic-index";
import { calculateScores } from "@/lib/scoring";
import { SLUG_TO_ISO2 } from "@/lib/slugToIso";
import { SLUG_TO_ISO3 } from "@/lib/slugToIso3";
import countriesData from "@/data/countries.json";
import aiPolicies from "@/data/ai-policies.json";
import externalIndicesJson from "@/data/external-indices.json";
import type { PolicyData, ExternalIndices } from "@/lib/scoring";
import type { IMFData } from "@/lib/imf";
import type { OECDData } from "@/lib/oecd";
import type { ScoredCountry } from "@/lib/types";

export const revalidate = 86400; // 24 hours

export async function GET() {
  const policies = aiPolicies as Record<string, PolicyData>;
  const externalIndices = externalIndicesJson as unknown as ExternalIndices;

  const [wbResult, imfResult, oecdResult, anthropicResult] = await Promise.allSettled([
    fetchWorldBankIndicators(),
    fetchIMFData(),
    fetchOECDData(),
    fetchAnthropicIndex(),
  ]);

  const wbData       = wbResult.status       === "fulfilled" ? wbResult.value       : {};
  const imfData      = imfResult.status      === "fulfilled" ? imfResult.value       : {} as IMFData;
  const oecdData     = oecdResult.status     === "fulfilled" ? oecdResult.value      : {} as OECDData;
  const anthropicData = anthropicResult.status === "fulfilled" ? anthropicResult.value : {};

  const usingLiveData = wbResult.status === "fulfilled";

  const scored: ScoredCountry[] = countriesData.countries.map((country) => {
    const iso2 = SLUG_TO_ISO2[country.slug] ?? "";
    const iso3 = SLUG_TO_ISO3[country.slug] ?? "";
    return calculateScores(
      country,
      iso2,
      iso3,
      wbData,
      policies,
      imfData,
      oecdData,
      anthropicData,
      externalIndices
    );
  });

  return NextResponse.json({
    countries: scored,
    last_updated: new Date().toISOString(),
    using_live_data: usingLiveData,
    sources: {
      world_bank: wbResult.status === "fulfilled",
      imf:        imfResult.status === "fulfilled",
      oecd:       oecdResult.status === "fulfilled",
      anthropic:  anthropicResult.status === "fulfilled",
    },
  });
}
