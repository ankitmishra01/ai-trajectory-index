// Normalises data/countries.json (the static baseline):
//  - projected_score_2028 = clamp(round(total + trajectory × 1.5), 0, 100), the rule in lib/scoring.ts
//  - trajectory_label follows trajectoryLabel() thresholds in lib/scoring.ts
//  - adds iso2 / iso3 from lib/slugToIso.ts and lib/slugToIso3.ts so consumers can join by code
// Field order and all existing fields are preserved for backward compatibility.
// Run: node scripts/normalize-countries.mjs
import fs from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), 'utf8');
function parseMap(src) {
  const map = {};
  for (const m of src.matchAll(/(?:"([^"]+)"|([a-z][a-z0-9-]*))\s*:\s*"([A-Z]{2,3})"/g)) map[m[1] || m[2]] = m[3];
  return map;
}
const iso2 = parseMap(read('lib/slugToIso.ts'));
const iso3 = parseMap(read('lib/slugToIso3.ts'));

export function trajectoryLabel(score) {
  if (score >= 6) return 'Strong Positive';
  if (score >= 2) return 'Positive';
  if (score >= -1) return 'Neutral';
  if (score >= -5) return 'Negative';
  return 'Strong Negative';
}
export const projected = (total, traj) => Math.min(100, Math.max(0, Math.round(total + traj * 1.5)));

const path = new URL('data/countries.json', root);
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
let projFixed = 0, labelFixed = 0; const missing = [];
data.countries = data.countries.map((c) => {
  const p = projected(c.total_score, c.trajectory_score);
  const l = trajectoryLabel(c.trajectory_score);
  if (p !== c.projected_score_2028) projFixed++;
  if (l !== c.trajectory_label) labelFixed++;
  if (!iso2[c.slug] || !iso3[c.slug]) missing.push(c.slug);
  const out = {};
  for (const [k, v] of Object.entries(c)) {
    out[k] = k === 'projected_score_2028' ? p : k === 'trajectory_label' ? l : v;
    if (k === 'slug') { out.iso2 = iso2[c.slug] ?? null; out.iso3 = iso3[c.slug] ?? null; }
  }
  return out;
});
fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log(`projections fixed: ${projFixed}, labels fixed: ${labelFixed}, countries: ${data.countries.length}, missing ISO: ${missing.join(', ') || 'none'}`);
