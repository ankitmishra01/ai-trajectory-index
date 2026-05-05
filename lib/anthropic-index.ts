// Anthropic Economic Index — HuggingFace dataset fetcher
// Dataset: https://huggingface.co/datasets/Anthropic/EconomicIndex
// Fetches the latest weekly Claude.ai usage CSV, aggregates by country,
// and returns a normalised 0–100 usage-intensity score per ISO3 country code.
// Cached 24h. Returns {} on any error (graceful fallback).

const HF_API  = "https://huggingface.co/api/datasets/Anthropic/EconomicIndex";
const HF_RAW  = "https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main";

interface HFSibling { rfilename: string }
interface HFDataset  { siblings?: HFSibling[] }

// Find the most recent aei_raw_claude_ai_*.csv filename from dataset metadata
async function findLatestCSV(): Promise<string | null> {
  const res = await fetch(HF_API, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const json: HFDataset = await res.json();
  const files = (json.siblings ?? [])
    .map((s) => s.rfilename)
    .filter((f) => f.startsWith("aei_raw_claude_ai_") && f.endsWith(".csv"))
    .sort()
    .reverse();

  return files[0] ?? null;
}

// Minimal CSV parser — only extracts the country_iso3 column and counts rows
function aggregateCountries(csv: string): Record<string, number> {
  const lines = csv.split("\n");
  if (lines.length < 2) return {};

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const countryCol = headers.findIndex(
    (h) => h === "country_iso3" || h === "country" || h === "iso3" || h === "country_code"
  );
  if (countryCol === -1) return {};

  const counts: Record<string, number> = {};
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    const iso3 = (row[countryCol] ?? "").trim().replace(/^"|"$/g, "").toUpperCase();
    if (iso3 && iso3.length === 3) {
      counts[iso3] = (counts[iso3] ?? 0) + 1;
    }
  }
  return counts;
}

// Normalise raw counts to 0–100 (top country = 100)
function normalise(counts: Record<string, number>): Record<string, number> {
  const max = Math.max(...Object.values(counts), 1);
  const result: Record<string, number> = {};
  for (const [iso3, count] of Object.entries(counts)) {
    result[iso3] = Math.round((count / max) * 100);
  }
  return result;
}

export async function fetchAnthropicIndex(): Promise<Record<string, number>> {
  try {
    const filename = await findLatestCSV();
    if (!filename) return {};

    // Download with a size guard — abort if the file exceeds ~20 MB
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const csvRes = await fetch(`${HF_RAW}/${filename}`, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    clearTimeout(timeout);

    if (!csvRes.ok) return {};

    // Stream the body but cap at 20 MB to avoid serverless memory issues
    const reader  = csvRes.body?.getReader();
    if (!reader) return {};

    const maxBytes = 20 * 1024 * 1024;
    const decoder  = new TextDecoder();
    let csv   = "";
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      csv   += decoder.decode(value, { stream: true });
      if (total > maxBytes) { reader.cancel(); break; }
    }

    const counts = aggregateCountries(csv);
    return normalise(counts);
  } catch {
    return {};
  }
}
