// Nightly scoring snapshots (scripts/build-scores.mts, .github/workflows/nightly-scores.yml).
//
// data/scores-live.json  latest full /api/scores response plus index metadata, served by
//                        /api/scores while fresh so the route does not recompute on a cold start.
// data/history/DATE.json compact dated snapshot: iso3 -> total, pillars, trajectory, projection,
//                        coverage. Immutable once written, so citations can point at it.
// data/history/series.json all snapshot dates in one aligned file for the history chart and movers.
import type { PillarKey, ScoresResponse } from "@/lib/types";

export const INDEX_VERSION = "3";
export const INDEX_NAME = "AI Trajectory Index";
export const REPO_URL = "https://github.com/ankitmishra01/ai-trajectory-index";
export const PILLAR_ORDER: PillarKey[] = ["infrastructure", "talent", "governance", "investment", "economic_readiness"];
export const FRESH_HOURS = 36;

export interface ScoresLiveFile extends ScoresResponse {
  generated_at: string;
  index_version: string;
  snapshot_date: string; // YYYY-MM-DD (UTC) of the matching data/history file
  by_iso3: Record<string, string>; // iso3 -> slug, so consumers can key by ISO3
}

export interface SnapshotCountry {
  s: string;       // slug
  t: number;       // total score
  p: number[];     // pillar scores in PILLAR_ORDER
  tr: number;      // trajectory score
  pr: number;      // projected 2028
  c: string;       // coverage label (High | Medium | Limited)
  src: "live" | "fallback";
}

export interface HistorySnapshot {
  date: string;
  generated_at: string;
  index_version: string;
  pillars: PillarKey[];
  using_live_data: boolean;
  sources: ScoresResponse["sources"];
  source_status: ScoresResponse["source_status"] | null;
  coverage: { live_indicator_share: number | null; countries_live: number | null; countries_total: number };
  failures: { indicator: string; error: string }[];
  countries: Record<string, SnapshotCountry>;
}

export interface HistorySeries {
  generated_at: string;
  index_version: string;
  dates: string[];
  countries: Record<string, { s: string; t: (number | null)[] }>;
}

export function utcDate(iso: string): string {
  return iso.slice(0, 10);
}

export function snapshotUrl(date: string): string {
  return `${REPO_URL}/blob/main/data/history/${date}.json`;
}

export function buildScoresLive(resp: ScoresResponse, generatedAt: string): ScoresLiveFile {
  const by_iso3: Record<string, string> = {};
  for (const c of resp.countries) {
    const iso3 = (c as { iso3?: string }).iso3;
    if (iso3) by_iso3[iso3] = c.slug;
  }
  return {
    ...resp,
    last_updated: generatedAt,
    generated_at: generatedAt,
    index_version: INDEX_VERSION,
    snapshot_date: utcDate(generatedAt),
    by_iso3,
  };
}

export function buildHistorySnapshot(resp: ScoresResponse, generatedAt: string): HistorySnapshot {
  const countries: Record<string, SnapshotCountry> = {};
  for (const c of resp.countries) {
    const iso3 = (c as { iso3?: string }).iso3;
    if (!iso3) continue; // never key a country without a code
    countries[iso3] = {
      s: c.slug,
      t: c.total_score,
      p: PILLAR_ORDER.map((k) => c.scores[k].score),
      tr: c.trajectory_score,
      pr: c.projected_score_2028,
      c: c.coverage?.label ?? "Limited",
      src: c.data_source,
    };
  }
  return {
    date: utcDate(generatedAt),
    generated_at: generatedAt,
    index_version: INDEX_VERSION,
    pillars: PILLAR_ORDER,
    using_live_data: resp.using_live_data,
    sources: resp.sources,
    source_status: resp.source_status ?? null,
    coverage: {
      live_indicator_share: resp.coverage?.live_indicator_share ?? null,
      countries_live: resp.coverage?.countries_live ?? null,
      countries_total: resp.countries.length,
    },
    failures: resp.coverage?.world_bank_failures ?? [],
    countries,
  };
}

// Rebuild the aligned series from every dated snapshot (sorted, one value per date, null when absent).
export function buildSeries(snapshots: HistorySnapshot[], generatedAt: string): HistorySeries {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((s) => s.date);
  const countries: HistorySeries["countries"] = {};
  sorted.forEach((snap, i) => {
    for (const [iso3, c] of Object.entries(snap.countries)) {
      if (!countries[iso3]) countries[iso3] = { s: c.s, t: new Array(dates.length).fill(null) };
      countries[iso3].s = c.s;
      countries[iso3].t[i] = c.t;
    }
  });
  return { generated_at: generatedAt, index_version: INDEX_VERSION, dates, countries };
}

export function isFresh(generatedAt: string | undefined, now = Date.now(), hours = FRESH_HOURS): boolean {
  if (!generatedAt) return false;
  const t = Date.parse(generatedAt);
  return Number.isFinite(t) && now - t >= 0 && now - t < hours * 3600_000;
}
