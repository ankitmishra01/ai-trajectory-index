import { NextResponse } from "next/server";
import seriesJson from "@/data/history/series.json";
import { computeMovers } from "@/lib/history";
import type { HistorySeries } from "@/lib/snapshot";

const series = seriesJson as unknown as HistorySeries;

export const revalidate = 3600;

export function GET(req: Request) {
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  return NextResponse.json(computeMovers(series, days, 10));
}
