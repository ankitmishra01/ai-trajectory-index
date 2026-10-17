// Builds data/anthropic-usage.json from the latest public Anthropic Economic Index release.
// The raw Claude.ai country file is ~100 MB, too large to fetch inside a serverless request,
// so this runs offline (or in CI) and commits a small, dated per-country index.
//
// Method: country usage_count (Claude.ai, facet=country) divided by working-age population
// (World Bank SP.POP.1564.TO, latest non-empty), converted to a 0-100 percentile rank among
// economies with at least MIN_COUNT conversations, so very small samples do not dominate.
//
// Run: node scripts/build-anthropic-usage.mjs
import fs from 'node:fs';
import readline from 'node:readline';
import { Readable } from 'node:stream';

const HF_API = 'https://huggingface.co/api/datasets/Anthropic/EconomicIndex';
const HF_RAW = 'https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main';
const MIN_COUNT = 200;

async function latestRawFile() {
  const res = await fetch(HF_API);
  if (!res.ok) throw new Error(`Hugging Face API ${res.status}`);
  const files = ((await res.json()).siblings || []).map((s) => s.rfilename)
    .filter((f) => /aei_raw_claude_ai_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}\.csv$/.test(f));
  // Sort by the period end date in the filename.
  files.sort((a, b) => a.match(/_to_(\d{4}-\d{2}-\d{2})/)[1].localeCompare(b.match(/_to_(\d{4}-\d{2}-\d{2})/)[1]));
  if (!files.length) throw new Error('No aei_raw_claude_ai_*.csv files found');
  return files.at(-1);
}

function splitCsv(line) {
  const out = []; let cur = ''; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
}

async function countryUsage(file) {
  const res = await fetch(`${HF_RAW}/${file}`);
  if (!res.ok || !res.body) throw new Error(`download ${res.status}`);
  const rl = readline.createInterface({ input: Readable.fromWeb(res.body) });
  let header = null; const counts = {};
  for await (const line of rl) {
    if (!header) { header = splitCsv(line); continue; }
    if (!line.includes(',country,') || !line.includes('usage_count')) continue;
    const row = Object.fromEntries(splitCsv(line).map((v, i) => [header[i], v]));
    if (row.geography === 'country' && row.facet === 'country' && row.variable === 'usage_count') {
      counts[row.geo_id] = Number(row.value);
    }
  }
  return counts;
}

async function wbWorkingAgePop() {
  const url = 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.1564.TO?format=json&mrnev=1&per_page=1000';
  const json = await (await fetch(url)).json();
  if (!Array.isArray(json[1])) throw new Error('World Bank population request failed');
  const byIso2 = {};
  for (const r of json[1]) {
    if (r.country?.id && r.countryiso3code && r.value != null) byIso2[r.country.id] = { iso3: r.countryiso3code, pop: r.value, year: Number(r.date) };
  }
  return byIso2;
}

const file = await latestRawFile();
const period = file.match(/(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})/);
console.log('Latest file:', file);
const [counts, pops] = await Promise.all([countryUsage(file), wbWorkingAgePop()]);
const rows = Object.entries(counts)
  .filter(([iso2]) => pops[iso2])
  .map(([iso2, count]) => ({ iso3: pops[iso2].iso3, count, perMillion: (count / pops[iso2].pop) * 1e6 }));
const eligible = rows.filter((r) => r.count >= MIN_COUNT).sort((a, b) => a.perMillion - b.perMillion);
const values = {};
eligible.forEach((r, i) => {
  values[r.iso3] = {
    usage_count: r.count,
    usage_per_million_working_age: Number(r.perMillion.toFixed(2)),
    index: eligible.length > 1 ? Math.round((i / (eligible.length - 1)) * 100) : 100,
  };
});
const out = {
  source: 'Anthropic Economic Index (Hugging Face: Anthropic/EconomicIndex)',
  file,
  period: { start: period[1], end: period[2] },
  generated_at: new Date().toISOString(),
  method: `Claude.ai conversations per million working-age people (World Bank SP.POP.1564.TO), percentile rank 0-100 among economies with at least ${MIN_COUNT} conversations in the sample week.`,
  economies: Object.keys(values).length,
  values,
};
fs.writeFileSync(new URL('../data/anthropic-usage.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.economies} economies (of ${rows.length} with population data).`);
