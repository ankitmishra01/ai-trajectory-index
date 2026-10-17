// Nightly scoring: runs the live scorer in Node and writes
//   data/scores-live.json    (only when live World Bank data was obtained; never a baseline in disguise)
//   data/history/DATE.json   (always; records source failures for that day)
//   data/history/series.json (rebuilt from every dated snapshot)
// Run: npx tsx scripts/build-scores.ts   (used by .github/workflows/nightly-scores.yml)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { computeScoresResponse } from "@/lib/liveScores";
import { buildHistorySnapshot, buildScoresLive, buildSeries, type HistorySnapshot } from "@/lib/snapshot";

const ROOT = process.cwd();
const HISTORY_DIR = join(ROOT, "data", "history");
const DATE_FILE = /^\d{4}-\d{2}-\d{2}\.json$/;

function writeJson(path: string, value: unknown, pretty = false) {
  writeFileSync(path, JSON.stringify(value, null, pretty ? 1 : 0) + "\n");
}

async function main() {
const generatedAt = new Date().toISOString();
const resp = await computeScoresResponse();
mkdirSync(HISTORY_DIR, { recursive: true });

const snapshot = buildHistorySnapshot(resp, generatedAt);
writeJson(join(HISTORY_DIR, `${snapshot.date}.json`), snapshot);
console.log(`history: ${snapshot.date} · ${Object.keys(snapshot.countries).length} economies · live share ${snapshot.coverage.live_indicator_share}% · sources ${JSON.stringify(snapshot.sources)}`);
if (snapshot.failures.length) console.log(`World Bank failures: ${snapshot.failures.map((f) => f.indicator).join(", ")}`);

if (resp.using_live_data) {
  writeJson(join(ROOT, "data", "scores-live.json"), buildScoresLive(resp, generatedAt));
  console.log("scores-live.json written");
} else {
  console.log("Live World Bank data unavailable: scores-live.json left unchanged (the API recomputes live instead).");
}

const snapshots: HistorySnapshot[] = readdirSync(HISTORY_DIR)
  .filter((f) => DATE_FILE.test(f))
  .map((f) => JSON.parse(readFileSync(join(HISTORY_DIR, f), "utf8")) as HistorySnapshot);
const series = buildSeries(snapshots, generatedAt);
writeJson(join(HISTORY_DIR, "series.json"), series);
console.log(`series: ${series.dates.length} dates (${series.dates[0]} → ${series.dates.at(-1)})`);

}

main().catch((err) => { console.error(err); process.exit(1); });
