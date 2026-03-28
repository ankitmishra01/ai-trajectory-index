import { NextRequest, NextResponse } from "next/server";
import { fetchCountryNews } from "@/lib/gdelt";
import staticData from "@/data/countries.json";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const country = staticData.countries.find((c) => c.slug === slug);
  if (!country) {
    return NextResponse.json({ error: "Country not found" }, { status: 404 });
  }

  try {
    const articles = await fetchCountryNews(country.name, slug);
    return NextResponse.json(
      { articles, country: country.name, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, articles: [] }, { status: 500 });
  }
}
