import { NextRequest, NextResponse } from "next/server";
import { askAboutCountries, type CountryContext } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.question || !Array.isArray(body?.countries)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { question, countries } = body as {
    question: string;
    countries: CountryContext[];
  };

  if (countries.length === 0) {
    return NextResponse.json(
      { error: "No countries selected" },
      { status: 400 }
    );
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      {
        error:
          "AI chat requires an OPENROUTER_API_KEY environment variable. Add it to .env.local or your Vercel dashboard.",
      },
      { status: 503 }
    );
  }

  try {
    const answer = await askAboutCountries(question, countries);
    return NextResponse.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
