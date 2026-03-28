import { NextRequest, NextResponse } from "next/server";
import { generateNarrative } from "@/lib/openrouter";
import staticData from "@/data/countries.json";
import policyData from "@/data/ai-policies.json";

interface CacheEntry {
  paragraphs: string[];
  generatedAt: number;
}

// In-memory cache — persists within a function instance lifetime
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function parseParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40)
    .slice(0, 3);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country: slug } = await params;

  const country = staticData.countries.find((c) => c.slug === slug);
  if (!country) {
    return NextResponse.json({ error: "Country not found" }, { status: 404 });
  }

  // Serve from cache if fresh
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      paragraphs: cached.paragraphs,
      generatedAt: new Date(cached.generatedAt).toISOString(),
      cached: true,
    });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured." },
      { status: 503 }
    );
  }

  try {
    const policy = (policyData as unknown as Record<string, {
      has_national_ai_strategy?: boolean;
      strategy_year?: number | null;
      has_ai_regulation?: boolean;
      oecd_member?: boolean;
    }>)[slug] ?? {};

    const text = await generateNarrative({
      countryName: country.name,
      totalScore: country.total_score,
      trajectoryLabel: country.trajectory_label,
      trajectoryScore: country.trajectory_score,
      projectedScore: country.projected_score_2028,
      topAccelerator: country.top_accelerator,
      topRisk: country.top_risk,
      scores: {
        infrastructure: country.scores.infrastructure.score,
        talent: country.scores.talent.score,
        governance: country.scores.governance.score,
        investment: country.scores.investment.score,
        economic_readiness: country.scores.economic_readiness.score,
      },
      hasAiStrategy: policy.has_national_ai_strategy,
    });

    const paragraphs = parseParagraphs(text);
    const entry: CacheEntry = { paragraphs, generatedAt: Date.now() };
    cache.set(slug, entry);

    return NextResponse.json({
      paragraphs,
      generatedAt: new Date(entry.generatedAt).toISOString(),
      cached: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
