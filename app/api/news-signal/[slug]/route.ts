import { NextRequest, NextResponse } from "next/server";
import { fetchCountryNews } from "@/lib/gdelt";
import { analyzeNewsSignal, NewsSignal } from "@/lib/openrouter";
import staticData from "@/data/countries.json";

interface CacheEntry {
  signal: NewsSignal;
  headlines: string[];
  generatedAt: number;
}

// 24-hour in-memory cache per country
const signalCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const country = staticData.countries.find((c) => c.slug === slug);
  if (!country) {
    return NextResponse.json({ error: "Country not found" }, { status: 404 });
  }

  // Serve from cache
  const cached = signalCache.get(slug);
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      signal: cached.signal,
      headlines: cached.headlines,
      generatedAt: new Date(cached.generatedAt).toISOString(),
      cached: true,
    });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OpenRouter not configured" }, { status: 503 });
  }

  try {
    // Fetch recent headlines
    const articles = await fetchCountryNews(country.name, slug, 10);
    const headlines = articles.map((a) => a.title).filter(Boolean);

    if (headlines.length === 0) {
      return NextResponse.json({ error: "No recent news found", signal: null }, { status: 200 });
    }

    const signal = await analyzeNewsSignal(country.name, headlines);
    const entry: CacheEntry = { signal, headlines, generatedAt: Date.now() };
    signalCache.set(slug, entry);

    return NextResponse.json({
      signal,
      headlines,
      generatedAt: new Date(entry.generatedAt).toISOString(),
      cached: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, signal: null }, { status: 500 });
  }
}
