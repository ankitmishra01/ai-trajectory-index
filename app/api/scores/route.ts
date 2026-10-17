import { NextResponse } from "next/server";
import { computeScoresResponse } from "@/lib/liveScores";

export const revalidate = 86400; // 24 hours

export async function GET() {
  return NextResponse.json(await computeScoresResponse());
}
