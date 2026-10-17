// Refreshes data/oecd-cache.json: a dated copy of the last successful OECD MSTI pull
// (R&D % GDP, researchers per 1,000 employed), served when the live gateway rate-limits.
// Run: node --experimental-strip-types scripts/build-oecd-cache.mjs
// Exits 1 (and leaves the existing file) if the live pull fails or returns too few economies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "data", "oecd-cache.json");
const { fetchOECDLive } = await import("../lib/oecd.ts");

let data = null;
for (let attempt = 1; attempt <= 4 && !data; attempt++) {
  try {
    data = await fetchOECDLive();
  } catch (e) {
    console.warn(`attempt ${attempt}: ${e.message}`);
    await new Promise((r) => setTimeout(r, 15000 * attempt));
  }
}
const n = data ? Object.keys(data).length : 0;
if (n < 25) {
  console.error(`OECD pull failed or too small (${n} economies); keeping the existing cache`);
  process.exit(1);
}
fs.writeFileSync(out, JSON.stringify({ fetched_at: new Date().toISOString(), source: "OECD MSTI (sdmx.oecd.org)", data }, null, 0) + "\n");
console.log(`Wrote ${out}: ${n} economies`);
