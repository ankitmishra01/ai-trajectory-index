// Score history and movers computed from data/history/series.json (built nightly).
import type { HistorySeries } from "@/lib/snapshot";

export interface HistoryPoint { date: string; total: number }

export interface Mover {
  iso3: string;
  slug: string;
  from: number;
  to: number;
  change: number;
  fromDate: string;
  toDate: string;
}

export interface MoversResult {
  historyStart: string | null;
  latest: string | null;
  baseline: string | null; // date compared against
  windowDays: number;
  spanDays: number;         // actual days between baseline and latest
  short: boolean;           // fewer than windowDays of history available
  movers: Mover[];
}

const DAY = 86_400_000;

export function countryHistory(series: HistorySeries | null, iso3: string): HistoryPoint[] {
  const row = series?.countries?.[iso3];
  if (!series || !row) return [];
  const out: HistoryPoint[] = [];
  series.dates.forEach((d, i) => {
    const v = row.t[i];
    if (typeof v === "number") out.push({ date: d, total: v });
  });
  return out;
}

// Compare the latest snapshot with the one closest to `windowDays` earlier (or the earliest
// available when history is shorter). With a single snapshot there is nothing to compare.
export function computeMovers(series: HistorySeries | null, windowDays = 30, limit = 10): MoversResult {
  const dates = series?.dates ?? [];
  const empty: MoversResult = {
    historyStart: dates[0] ?? null, latest: dates.at(-1) ?? null, baseline: null,
    windowDays, spanDays: 0, short: true, movers: [],
  };
  if (!series || dates.length < 2) return empty;

  const li = dates.length - 1;
  const latestT = Date.parse(dates[li]);
  const target = latestT - windowDays * DAY;
  // First date at or after the target; if all dates are later than the target, use the earliest.
  let bi = dates.findIndex((d) => Date.parse(d) >= target);
  if (bi < 0 || bi >= li) bi = 0;
  if (bi === li) return empty;

  const spanDays = Math.round((latestT - Date.parse(dates[bi])) / DAY);
  const movers: Mover[] = [];
  for (const [iso3, row] of Object.entries(series.countries)) {
    const a = row.t[bi];
    const b = row.t[li];
    if (typeof a !== "number" || typeof b !== "number") continue;
    const change = Math.round((b - a) * 10) / 10;
    if (change === 0) continue;
    movers.push({ iso3, slug: row.s, from: a, to: b, change, fromDate: dates[bi], toDate: dates[li] });
  }
  movers.sort((x, y) => Math.abs(y.change) - Math.abs(x.change) || y.change - x.change || x.iso3.localeCompare(y.iso3));
  return {
    historyStart: dates[0], latest: dates[li], baseline: dates[bi], windowDays,
    spanDays, short: spanDays < windowDays, movers: movers.slice(0, limit),
  };
}
