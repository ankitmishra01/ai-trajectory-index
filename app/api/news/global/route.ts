import { NextResponse } from "next/server";
import { fetchGlobalAINews } from "@/lib/gdelt";

export async function GET() {
  try {
    const articles = await fetchGlobalAINews(20);
    return NextResponse.json(
      { articles, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, articles: [] }, { status: 500 });
  }
}
