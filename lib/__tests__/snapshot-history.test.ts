import { describe, expect, it } from "vitest";
import { buildHistorySnapshot, buildScoresLive, buildSeries, isFresh, snapshotUrl, type HistorySnapshot } from "@/lib/snapshot";
import { computeMovers, countryHistory } from "@/lib/history";
import type { ScoresResponse } from "@/lib/types";

const pillar = (score: number) => ({ score, reasons: [] });
function country(slug: string, iso3: string | undefined, total: number) {
  return {
    slug, iso3, name: slug, id: slug, flag: "", region: "R",
    scores: { infrastructure: pillar(10), talent: pillar(11), governance: pillar(12), investment: pillar(13), economic_readiness: pillar(14) },
    total_score: total, trajectory_score: 2, trajectory_label: "Positive", projected_score_2028: total + 3,
    top_accelerator: "", top_risk: "", comparable_countries: [],
    data_source: "live", wb_data_year: 2024, imf_data: true, oecd_data: false, anthropic_data: false,
    coverage: { label: "High", liveIndicators: 15, expectedIndicators: 17, enrichedIndicators: 2, policyIndicators: 1, fallbackComponents: 0, fallbackShare: 0, oldestYear: 2022, newestYear: 2024 },
    provenance: {},
  };
}
const resp = (countries: unknown[]): ScoresResponse => ({
  countries: countries as ScoresResponse["countries"],
  last_updated: "x", using_live_data: true,
  sources: { world_bank: true, imf: true, oecd: false, anthropic: false },
  coverage: { live_indicator_share: 80, countries_live: 2, countries_total: 2, world_bank_indicators_ok: 16, world_bank_indicators_total: 17, world_bank_failures: [{ indicator: "X.Y", error: "archived" }] },
});

describe("snapshot builders", () => {
  const r = resp([country("usa", "USA", 85), country("nowhere", undefined, 40)]);

  it("builds a compact ISO3-keyed history snapshot and skips countries without a code", () => {
    const s = buildHistorySnapshot(r, "2026-10-17T03:00:00.000Z");
    expect(s.date).toBe("2026-10-17");
    expect(Object.keys(s.countries)).toEqual(["USA"]);
    expect(s.countries.USA).toEqual({ s: "usa", t: 85, p: [10, 11, 12, 13, 14], tr: 2, pr: 88, c: "High", src: "live" });
    expect(s.failures).toEqual([{ indicator: "X.Y", error: "archived" }]);
    expect(s.index_version).toBe("3");
  });

  it("keeps the /api/scores contract in scores-live.json and adds index metadata", () => {
    const f = buildScoresLive(r, "2026-10-17T03:00:00.000Z");
    expect(f.countries).toHaveLength(2);
    expect(f.sources).toEqual(r.sources);
    expect(f.snapshot_date).toBe("2026-10-17");
    expect(f.by_iso3).toEqual({ USA: "usa" });
  });

  it("aligns series by date with nulls for missing economies", () => {
    const a = buildHistorySnapshot(resp([country("usa", "USA", 85)]), "2026-10-17T03:00:00.000Z");
    const b = buildHistorySnapshot(resp([country("usa", "USA", 86), country("dnk", "DNK", 87)]), "2026-10-18T03:00:00.000Z");
    const series = buildSeries([b, a], "now");
    expect(series.dates).toEqual(["2026-10-17", "2026-10-18"]);
    expect(series.countries.USA.t).toEqual([85, 86]);
    expect(series.countries.DNK.t).toEqual([null, 87]);
    expect(countryHistory(series, "DNK")).toEqual([{ date: "2026-10-18", total: 87 }]);
  });

  it("freshness window and permalinks", () => {
    const now = Date.parse("2026-10-18T10:00:00Z");
    expect(isFresh("2026-10-17T03:00:00Z", now)).toBe(true);
    expect(isFresh("2026-10-16T03:00:00Z", now)).toBe(false);
    expect(isFresh(undefined, now)).toBe(false);
    expect(snapshotUrl("2026-10-17")).toBe("https://github.com/ankitmishra01/ai-trajectory-index/blob/main/data/history/2026-10-17.json");
  });
});

describe("movers", () => {
  const snap = (date: string, totals: Record<string, number>): HistorySnapshot =>
    buildHistorySnapshot(resp(Object.entries(totals).map(([iso, t]) => country(iso.toLowerCase(), iso, t))), `${date}T03:00:00.000Z`);

  it("returns no movers and a short-history flag with a single snapshot", () => {
    const m = computeMovers(buildSeries([snap("2026-10-17", { USA: 85 })], "now"));
    expect(m.movers).toEqual([]);
    expect(m.short).toBe(true);
    expect(m.historyStart).toBe("2026-10-17");
    expect(m.baseline).toBeNull();
  });

  it("compares with the earliest snapshot when history is shorter than the window", () => {
    const series = buildSeries([snap("2026-10-17", { USA: 85, DNK: 87, IND: 50 }), snap("2026-10-20", { USA: 86, DNK: 87, IND: 47 })], "now");
    const m = computeMovers(series, 30);
    expect(m.baseline).toBe("2026-10-17");
    expect(m.spanDays).toBe(3);
    expect(m.short).toBe(true);
    expect(m.movers.map((x) => [x.iso3, x.change])).toEqual([["IND", -3], ["USA", 1]]); // unchanged DNK omitted
  });

  it("uses the snapshot closest to 30 days back when history is long enough", () => {
    const series = buildSeries([
      snap("2026-08-01", { USA: 70 }), snap("2026-09-20", { USA: 80 }), snap("2026-10-20", { USA: 84 }),
    ], "now");
    const m = computeMovers(series, 30);
    expect(m.baseline).toBe("2026-09-20");
    expect(m.short).toBe(false);
    expect(m.movers[0]).toMatchObject({ iso3: "USA", change: 4, from: 80, to: 84 });
  });
});
