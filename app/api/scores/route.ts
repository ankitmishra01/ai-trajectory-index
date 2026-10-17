import { NextResponse } from "next/server";
import { getScoresResponse } from "@/lib/scoresSource";

export const revalidate = 86400; // 24 hours

export async function GET() {
  const { data, served } = await getScoresResponse();
  return NextResponse.json(data, { headers: { "x-scores-source": served } });
}
