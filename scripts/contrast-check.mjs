// Contrast audit for the design tokens in app/globals.css (WCAG 2.1 ratios).
// Usage: node scripts/contrast-check.mjs [path-to-globals.css]
import fs from "node:fs";
const css = fs.readFileSync(process.argv[2] || "app/globals.css", "utf8");
const root = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
const vars = {};
for (const m of root.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
const resolve = (v, d = 0) => { const m = /^var\(--([a-z0-9-]+)\)$/.exec(v || ""); return m && d < 8 ? resolve(vars[m[1]], d + 1) : v; };
const hex = (name) => { const v = resolve(vars[name]); return /^#[0-9a-f]{6}$/i.test(v || "") ? v : null; };
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// [foreground, background, minimum] — 4.5 body text, 3 large text / UI, 1.25 visible surface step
const pairs = [
  ["ed-text-0", "ed-bg", 4.5], ["ed-text-1", "ed-bg", 4.5], ["ed-text-2", "ed-bg", 4.5], ["ed-text-3", "ed-bg", 4.5],
  ["ed-muted", "ed-bg", 4.5], ["ed-text-2", "ed-raised", 4.5], ["ed-muted", "ed-raised", 4.5],
  ["signal", "ed-bg", 4.5], ["signal", "ed-surface", 4.5], ["positive", "ed-bg", 4.5], ["negative", "ed-bg", 4.5],
  ["pillar-infra", "ed-surface", 3], ["pillar-talent", "ed-surface", 3], ["pillar-gov", "ed-surface", 3], ["pillar-invest", "ed-surface", 3], ["pillar-econ", "ed-surface", 3],
  ["ed-border", "ed-bg", 1.25], ["ed-border-strong", "ed-bg", 1.8], ["ed-raised", "ed-bg", 1.06], ["ed-surface", "ed-bg", 1.03],
  ["on-ink", "ink", 4.5], ["on-ink-muted", "ink", 4.5], ["ink-accent", "ink", 4.5],
];
let fails = 0;
console.log("pair".padEnd(34), "ratio", " min", "result");
for (const [f, b, min] of pairs) {
  const F = hex(f), B = hex(b);
  if (!F || !B) { console.log(`${f} on ${b}`.padEnd(34), "  n/a  — undefined token"); fails++; continue; }
  const r = ratio(F, B); if (r < min) fails++;
  console.log(`${f} on ${b}`.padEnd(34), r.toFixed(2).padStart(5), String(min).padStart(4), r >= min ? "pass" : "FAIL");
}
process.exitCode = fails ? 1 : 0;
