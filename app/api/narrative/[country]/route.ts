import { NextRequest, NextResponse } from "next/server";
import { generateStructuredNarrative } from "@/lib/openrouter";
import { buildFactPack, generateStructuredNarrative as generateTemplateNarrative, summarizeFactPack } from "@/lib/narrativeTemplate";
import { calculateScores } from "@/lib/scoring";
import { fetchWorldBankIndicators } from "@/lib/worldbank";
import { fetchIMFData } from "@/lib/imf";
import { fetchOECDData } from "@/lib/oecd";
import { fetchAnthropicIndex } from "@/lib/anthropic-index";
import { SLUG_TO_ISO2 } from "@/lib/slugToIso";
import { SLUG_TO_ISO3 } from "@/lib/slugToIso3";
import staticData from "@/data/countries.json";
import policyData from "@/data/ai-policies.json";
import externalIndicesJson from "@/data/external-indices.json";
import type { PolicyData, ExternalIndices } from "@/lib/scoring";
import type { IMFData } from "@/lib/imf";
import type { OECDData } from "@/lib/oecd";
import type { ScoredCountry, NarrativeSection } from "@/lib/types";

interface CacheEntry {
  sections: NarrativeSection[];
  source: "ai" | "template";
  generatedAt: number;
}

// In-memory cache — persists within a function instance lifetime
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function scoreAllCountries(): Promise<ScoredCountry[]> {
  const policies = policyData as Record<string, PolicyData>;
  const externalIndices = externalIndicesJson as unknown as ExternalIndices;

  const [wbResult, imfResult, oecdResult, anthropicResult] = await Promise.allSettled([
    fetchWorldBankIndicators(),
    fetchIMFData(),
    fetchOECDData(),
    fetchAnthropicIndex(),
  ]);

  const wbData        = wbResult.status        === "fulfilled" ? wbResult.value        : {};
  const imfData       = imfResult.status       === "fulfilled" ? imfResult.value       : ({} as IMFData);
  const oecdData      = oecdResult.status      === "fulfilled" ? oecdResult.value      : ({} as OECDData);
  const anthropicData = anthropicResult.status === "fulfilled" ? anthropicResult.value : {};

  return staticData.countries.map((country) => {
    const iso2 = SLUG_TO_ISO2[country.slug] ?? "";
    const iso3 = SLUG_TO_ISO3[country.slug] ?? "";
    return calculateScores(country, iso2, iso3, wbData, policies, imfData, oecdData, anthropicData, externalIndices);
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country: slug } = await params;

  const staticCountry = staticData.countries.find((c) => c.slug === slug);
  if (!staticCountry) {
    return NextResponse.json({ error: "Country not found" }, { status: 404 });
  }

  // Serve from cache if fresh
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      sections: cached.sections,
      source: cached.source,
      generatedAt: new Date(cached.generatedAt).toISOString(),
      cached: true,
    });
  }

  const allCountries = await scoreAllCountries();
  const country = allCountries.find((c) => c.slug === slug) ?? {
    ...staticCountry,
    data_source: "fallback" as const,
    wb_data_year: null,
    imf_data: false,
    oecd_data: false,
    anthropic_data: false,
    raw_indicators: null,
  };
  const policy = (policyData as Record<string, PolicyData>)[slug] ?? {
    has_national_ai_strategy: false,
    strategy_year: null,
    has_ai_regulation: false,
    oecd_member: false,
  };

  const factPack = buildFactPack(country, allCountries, policy);

  let sections: NarrativeSection[];
  let source: "ai" | "template";

  if (!process.env.OPENROUTER_API_KEY) {
    sections = generateTemplateNarrative(factPack);
    source = "template";
  } else {
    try {
      sections = await generateStructuredNarrative(summarizeFactPack(factPack));
      source = "ai";
    } catch (err) {
      // Every free model failed, or the output didn't parse into 5 sections —
      // fall back to the deterministic template instead of surfacing an error.
      console.warn(`Narrative AI generation failed for ${slug}, using template fallback:`, err);
      sections = generateTemplateNarrative(factPack);
      source = "template";
    }
  }

  const entry: CacheEntry = { sections, source, generatedAt: Date.now() };
  cache.set(slug, entry);

  return NextResponse.json({
    sections,
    source,
    generatedAt: new Date(entry.generatedAt).toISOString(),
    cached: false,
  });
}
