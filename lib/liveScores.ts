// Shared live scoring: used by /api/scores and by page metadata so titles and bodies agree.
import { fetchWorldBank } from "@/lib/worldbank";
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
import type { ScoredCountry, ScoresResponse } from "@/lib/types";


export async function computeScoresResponse(): Promise<ScoresResponse> {
  const policies = aiPolicies as Record<string, PolicyData>;
  const externalIndices = externalIndicesJson as unknown as ExternalIndices;

  const [wbResult, imfResult, oecdResult, anthropicResult] = await Promise.allSettled([
    fetchWorldBank(),
    fetchIMFData(),
    fetchOECDData(),
    fetchAnthropicIndex(),
  ]);

  const wbData       = wbResult.status       === "fulfilled" ? wbResult.value.data  : {};
  const wbStatus     = wbResult.status       === "fulfilled" ? wbResult.value.status : [];
  const imfData      = imfResult.status      === "fulfilled" ? imfResult.value       : {} as IMFData;
  const oecdData     = oecdResult.status     === "fulfilled" ? oecdResult.value      : {} as OECDData;
  const anthropicData = anthropicResult.status === "fulfilled" ? anthropicResult.value : {};

  const usingLiveData = wbResult.status === "fulfilled" && wbStatus.some((st) => st.ok);

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

  // Honest source flags: a source counts only if it actually contributed data to some country.
  const sources = {
    world_bank: scored.some((c) => c.data_source === "live"),
    imf:        scored.some((c) => c.imf_data),
    oecd:       scored.some((c) => c.oecd_data),
    anthropic:  scored.some((c) => c.anthropic_data),
  };

  // Measured coverage: share of expected live indicators that were observed, across all economies.
  const expected = scored.reduce((n, c) => n + c.coverage.expectedIndicators, 0);
  const observed = scored.reduce((n, c) => n + c.coverage.liveIndicators + c.coverage.enrichedIndicators, 0);
  const coverage = {
    live_indicator_share: expected ? Math.round((observed / expected) * 1000) / 10 : 0,
    countries_live: scored.filter((c) => c.data_source === "live").length,
    countries_total: scored.length,
    world_bank_indicators_ok: wbStatus.filter((st) => st.ok).length,
    world_bank_indicators_total: wbStatus.length,
    world_bank_failures: wbStatus.filter((st) => !st.ok).map((st) => ({ indicator: st.indicator, error: st.error ?? "unknown" })),
  };

  const response = {
    countries: scored,
    last_updated: new Date().toISOString(),
    using_live_data: usingLiveData,
    sources,
    coverage,
  } satisfies ScoresResponse;

  return response;
}
