// Rank-stability diagnostic for the AI Trajectory Index.
//
// Reconstructs the scorer's inputs from the committed snapshot (data/scores-live.json),
// re-runs lib/scoring.ts on them, then perturbs one indicator at a time and reports how
// many economies change rank. No network access: the snapshot is the single source of truth,
// so the numbers are reproducible from the repo alone.
//
// Run: npx vite-node scripts/sensitivity.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { calculateScores, type ExternalIndices, type PolicyData } from "../lib/scoring";
import type { IndicatorValues, WorldBankData } from "../lib/worldbank";
import type { IMFData } from "../lib/imf";
import type { OECDData } from "../lib/oecd";
import type { Country, ScoreComponentProvenance } from "../lib/types";

const ROOT = process.cwd();
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const snapshot = read("data/scores-live.json") as {
  countries: {
    slug: string;
    iso2: string;
    iso3: string;
    name: string;
    total_score: number;
    provenance: Record<string, ScoreComponentProvenance[]>;
  }[];
};
const countriesData = read("data/countries.json") as { countries: Country[] };
const policies = read("data/ai-policies.json") as Record<string, PolicyData>;
const externalIndices = read("data/external-indices.json") as ExternalIndices;

// provenance key -> the World Bank field the scorer reads it from
const WB_FIELD: Record<string, string> = {
  fixed_broadband: "broadband",
  internet_users: "internet",
  mobile_subscriptions: "mobile",
  electricity_access: "electricity",
  tertiary_enrollment: "tertiary",
  labor_productivity: "labor_productivity",
  rule_of_law: "rule_of_law",
  government_effectiveness: "gov_effectiveness",
  regulatory_quality: "regulatory_quality",
  fdi_inflows: "fdi",
  gdp_per_capita_ppp: "gdp_ppp",
  private_credit: "private_credit",
  trade_openness: "trade_openness",
  services_share: "services_share",
};

const blank = (): IndicatorValues => ({ current: null, previous: null, year: null });

interface Inputs {
  wb: WorldBankData;
  imf: IMFData;
  oecd: OECDData;
}

function buildInputs(): Inputs {
  const wb = {} as WorldBankData;
  const imf = {} as IMFData;
  const oecd = {} as OECDData;

  for (const c of snapshot.countries) {
    const row = {} as WorldBankData[string];
    const fieldNames = Object.values(WB_FIELD).concat(["rd", "gdp", "hightech_exports"]);
    for (const field of fieldNames) {
      (row as Record<string, IndicatorValues>)[field] = blank();
    }
    const comps = Object.values(c.provenance).flat();
    for (const m of comps) {
      if (m.status !== "live" && m.status !== "enriched") continue;
      const v = typeof m.value === "number" ? m.value : null;
      if (v === null) continue;
      const field = WB_FIELD[m.key];
      if (field) {
        (row as Record<string, IndicatorValues>)[field] = { current: v, previous: null, year: m.year };
      } else if (m.key === "rd_expenditure") {
        const fromOecd = (m.source ?? "").includes("OECD");
        if (fromOecd) (oecd[c.iso3] ??= {} as OECDData[string]).rd_expenditure = { current: v, previous: null, year: m.year };
        else row.rd = { current: v, previous: null, year: m.year };
      } else if (m.key === "oecd_researchers") {
        (oecd[c.iso3] ??= {} as OECDData[string]).researchers = { current: v, previous: null, year: m.year };
      } else if (m.key === "government_expenditure") {
        (imf[c.iso3] ??= {} as IMFData[string]).govt_expenditure = { current: v, previous: null, year: m.year };
      } else if (m.key === "government_debt") {
        (imf[c.iso3] ??= {} as IMFData[string]).govt_debt = { current: v, previous: null, year: m.year };
      }
    }
    if (comps.some((m) => m.status === "live")) wb[c.iso2] = row;
  }
  return { wb, imf, oecd };
}

const bySlug = new Map(countriesData.countries.map((c) => [c.slug, c]));

function scoreAll(inputs: Inputs): Map<string, number> {
  const out = new Map<string, number>();
  for (const c of snapshot.countries) {
    const base = bySlug.get(c.slug);
    if (!base) continue;
    const scored = calculateScores(
      base,
      c.iso2,
      c.iso3,
      inputs.wb,
      policies,
      inputs.imf,
      inputs.oecd,
      {},
      externalIndices,
    );
    out.set(c.slug, scored.total_score);
  }
  return out;
}

// Dense ranking with an explicit, deterministic tiebreak by slug, so the diagnostic measures
// movement in the data rather than movement in array order.
function ranks(scores: Map<string, number>): Map<string, number> {
  const ordered: [string, number][] = [];
  scores.forEach((v, k) => ordered.push([k, v]));
  ordered.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const out = new Map<string, number>();
  ordered.forEach(([slug], i) => out.set(slug, i + 1));
  return out;
}

// Pairs of economies whose strict order flips between two score sets. Unlike counting rank
// positions, this does not charge every economy below a mover with a "move".
function inversions(a: Map<string, number>, b: Map<string, number>): number {
  const slugs: string[] = [];
  a.forEach((_v, k) => slugs.push(k));
  let flips = 0;
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const da = (a.get(slugs[i]) as number) - (a.get(slugs[j]) as number);
      const db = (b.get(slugs[i]) as number) - (b.get(slugs[j]) as number);
      if (da > 0 && db < 0) flips++;
      else if (da < 0 && db > 0) flips++;
    }
  }
  return flips;
}

function clone(inputs: Inputs): Inputs {
  return JSON.parse(JSON.stringify(inputs)) as Inputs;
}

function perturb(inputs: Inputs, field: string, pct: number): Inputs {
  const next = clone(inputs);
  for (const row of Object.values(next.wb)) {
    const cell = (row as unknown as Record<string, IndicatorValues>)[field];
    if (cell?.current !== null && cell?.current !== undefined) cell.current = cell.current * (1 + pct);
  }
  return next;
}

function main() {
  const inputs = buildInputs();
  const baseScores = scoreAll(inputs);
  const baseRanks = ranks(baseScores);

  // Fidelity: does the reconstruction reproduce the published totals?
  let exact = 0;
  let maxDelta = 0;
  for (const c of snapshot.countries) {
    const mine = baseScores.get(c.slug);
    if (mine === undefined) continue;
    const delta = Math.abs(mine - c.total_score);
    if (delta === 0) exact++;
    maxDelta = Math.max(maxDelta, delta);
  }
  console.log(`reconstruction: ${exact}/${snapshot.countries.length} totals match exactly, max delta ${maxDelta}`);

  // Tie structure of the published index.
  const tally: Record<number, number> = {};
  for (const c of snapshot.countries) tally[c.total_score] = (tally[c.total_score] ?? 0) + 1;
  const tallyValues = Object.values(tally);
  const tied = tallyValues.filter((n) => n > 1).reduce((a, b) => a + b, 0);
  console.log(`ties: ${tallyValues.length} distinct totals for ${snapshot.countries.length} economies; ${tied} economies (${((tied / snapshot.countries.length) * 100).toFixed(1)}%) share a total with at least one other\n`);

  const fields = ["broadband", "internet", "mobile", "electricity", "tertiary", "labor_productivity", "fdi", "gdp_ppp", "private_credit", "trade_openness", "services_share"];
  for (const pct of [0.01, 0.05]) {
    console.log(`── perturbation: +${(pct * 100).toFixed(0)}% on one indicator, all economies ──`);
    for (const field of fields) {
      const moved = scoreAll(perturb(inputs, field, pct));
      const movedRanks = ranks(moved);
      let changedRank = 0;
      let changedScore = 0;
      let biggest = 0;
      let who = "";
      baseRanks.forEach((r, slug) => {
        const d = Math.abs((movedRanks.get(slug) ?? r) - r);
        if (d > 0) changedRank++;
        if (d > biggest) { biggest = d; who = slug; }
        if ((moved.get(slug) ?? 0) !== (baseScores.get(slug) ?? 0)) changedScore++;
      });
      const flips = inversions(baseScores, moved);
      console.log(`${field.padEnd(20)} scores moved: ${String(changedScore).padStart(3)}  ranks moved: ${String(changedRank).padStart(3)}  order flips: ${String(flips).padStart(4)}  largest rank move: ${String(biggest).padStart(3)} (${who})`);
    }
    console.log("");
  }

  // How much of the ranking is the hand-authored baseline? Move every static pillar score
  // by one point and see what happens, holding all live indicators fixed.
  console.log("── editorial baseline: ±1 point on every static pillar score ──");
  for (const delta of [-1, 1]) {
    const saved = new Map(bySlug);
    bySlug.forEach((c, slug) => {
      const copy = JSON.parse(JSON.stringify(c)) as Country;
      (Object.keys(copy.scores) as (keyof Country["scores"])[]).forEach((k) => {
        copy.scores[k].score = Math.max(0, Math.min(20, copy.scores[k].score + delta));
      });
      bySlug.set(slug, copy);
    });
    const moved = scoreAll(inputs);
    saved.forEach((v, k) => bySlug.set(k, v));
    const movedRanks = ranks(moved);
    let changedScore = 0;
    let biggest = 0;
    baseRanks.forEach((r, slug) => {
      if ((moved.get(slug) ?? 0) !== (baseScores.get(slug) ?? 0)) changedScore++;
      biggest = Math.max(biggest, Math.abs((movedRanks.get(slug) ?? r) - r));
    });
    console.log(`baseline ${delta > 0 ? "+" : ""}${delta} pt   scores moved: ${String(changedScore).padStart(3)}  order flips: ${String(inversions(baseScores, moved)).padStart(4)}  largest rank move: ${biggest}`);
  }
  console.log("");

  // Decisive test: replace every country's hand-authored baseline with the same constant
  // (the global mean pillar score) so the editorial judgment carries no cross-country
  // information, and see how much of the published order survives on live data alone.
  {
    const saved = new Map(bySlug);
    let sum = 0;
    let n = 0;
    bySlug.forEach((c) => {
      (Object.keys(c.scores) as (keyof Country["scores"])[]).forEach((k) => { sum += c.scores[k].score; n++; });
    });
    const mean = Math.round(sum / n);
    bySlug.forEach((c, slug) => {
      const copy = JSON.parse(JSON.stringify(c)) as Country;
      (Object.keys(copy.scores) as (keyof Country["scores"])[]).forEach((k) => { copy.scores[k].score = mean; });
      bySlug.set(slug, copy);
    });
    const flat = scoreAll(inputs);
    saved.forEach((v, k) => bySlug.set(k, v));
    const flatRanks = ranks(flat);
    let biggest = 0;
    let who = "";
    let moved10 = 0;
    baseRanks.forEach((r, slug) => {
      const d = Math.abs((flatRanks.get(slug) ?? r) - r);
      if (d >= 10) moved10++;
      if (d > biggest) { biggest = d; who = slug; }
    });
    const pairs = (186 * 185) / 2;
    const flips = inversions(baseScores, flat);
    console.log("\u2500\u2500 editorial baseline flattened to the global mean (" + mean + "/20 per pillar) \u2500\u2500");
    console.log(`order flips: ${flips} of ${pairs} pairs (${((flips / pairs) * 100).toFixed(1)}%)  economies moving 10+ places: ${moved10}  largest move: ${biggest} (${who})`);
    const top = [...snapshot.countries].sort((a, b) => b.total_score - a.total_score).slice(0, 10).map((c) => c.slug);
    console.log(`published top 10 under a flat baseline: ${top.map((t) => `${t} #${flatRanks.get(t)}`).join(", ")}`);
    console.log("");
  }

  // Rank bands: jitter every live indicator by ±2% (uniform) and record each economy's
  // rank across draws. This is the uncertainty the published single rank hides.
  const DRAWS = 200;
  const JITTER = 0.02;
  let seed = 20261018;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const seen = new Map<string, number[]>();
  for (let d = 0; d < DRAWS; d++) {
    const draw = clone(inputs);
    for (const row of Object.values(draw.wb)) {
      for (const cell of Object.values(row as unknown as Record<string, IndicatorValues>)) {
        if (cell?.current !== null && cell?.current !== undefined) cell.current = cell.current * (1 + (rnd() * 2 - 1) * JITTER);
      }
    }
    const r = ranks(scoreAll(draw));
    r.forEach((rank, slug) => {
      if (!seen.has(slug)) seen.set(slug, []);
      (seen.get(slug) as number[]).push(rank);
    });
  }
  const widths: { slug: string; lo: number; hi: number; width: number; base: number }[] = [];
  seen.forEach((rs: number[], slug: string) => {
    rs.sort((a, b) => a - b);
    const lo = rs[Math.floor(0.05 * rs.length)];
    const hi = rs[Math.floor(0.95 * rs.length)];
    widths.push({ slug, lo, hi, width: hi - lo, base: baseRanks.get(slug) as number });
  });
  widths.sort((a, b) => a.base - b.base);
  const med = [...widths].sort((a, b) => a.width - b.width)[Math.floor(widths.length / 2)].width;
  const worst = [...widths].sort((a, b) => b.width - a.width).slice(0, 8);
  console.log(`── rank bands: ±${JITTER * 100}% jitter on every live indicator, ${DRAWS} draws ──`);
  console.log(`median 90% rank band width: ${med} places`);
  console.log(`widest bands: ${worst.map((w) => `${w.slug} #${w.base} [${w.lo}-${w.hi}]`).join(", ")}`);
  console.log(`top 10 published: ${widths.slice(0, 10).map((w) => `${w.slug} #${w.base} [${w.lo}-${w.hi}]`).join(", ")}`);
}

main();
