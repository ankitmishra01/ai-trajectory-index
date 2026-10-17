import { NextResponse } from "next/server";
import seriesJson from "@/data/history/series.json";
import { countryHistory } from "@/lib/history";
import { snapshotUrl, type HistorySeries } from "@/lib/snapshot";

const series = seriesJson as unknown as HistorySeries;

export const revalidate = 3600;

export function GET(_req: Request, { params }: { params: { iso3: string } }) {
  const iso3 = String(params.iso3 || "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(iso3)) return NextResponse.json({ error: "invalid iso3" }, { status: 400 });
  const points = countryHistory(series, iso3);
  const latest = series.dates.at(-1) ?? null;
  return NextResponse.json({
    iso3,
    index_version: series.index_version,
    history_start: series.dates[0] ?? null,
    latest_snapshot: latest,
    snapshot_url: latest ? snapshotUrl(latest) : null,
    points,
  });
}
