// Vercel Cron job — warms news cache for top 50 countries nightly
// Schedule: 0 2 * * * (2am UTC daily) — set in vercel.json

import { NextResponse } from "next/server";
import { fetchCountryNews } from "@/lib/gdelt";
import staticData from "@/data/countries.json";

// Only the top 50 by total_score get proactive warming
const TOP_SLUGS = [...staticData.countries]
  .sort((a, b) => b.total_score - a.total_score)
  .slice(0, 50)
  .map((c) => ({ slug: c.slug, name: c.name }));

export async function GET(req: Request) {
  // Protect with a shared secret so only Vercel Cron can call this
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, number> = {};
  let warmed = 0;

  for (const { slug, name } of TOP_SLUGS) {
    try {
      const articles = await fetchCountryNews(name, slug);
      results[slug] = articles.length;
      warmed++;
      // Small delay to avoid hammering GDELT
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      results[slug] = -1;
    }
  }

  return NextResponse.json({
    warmed,
    results,
    timestamp: new Date().toISOString(),
  });
}
