// Anthropic Economic Index — country usage intensity.
// Source: https://huggingface.co/datasets/Anthropic/EconomicIndex
// The raw Claude.ai country file is ~100 MB, too large to download inside a serverless request
// (the previous loader capped the download at 20 MB and silently scored a truncated file).
// `scripts/build-anthropic-usage.mjs` builds data/anthropic-usage.json offline: Claude.ai
// conversations per million working-age people, as a 0-100 percentile rank among economies
// with a meaningful sample. Economies where Claude is not offered are simply absent.

import usage from "@/data/anthropic-usage.json";

interface AnthropicUsageFile {
  file: string;
  period: { start: string; end: string };
  generated_at: string;
  values: Record<string, { usage_count: number; usage_per_million_working_age: number; index: number }>;
}

const data = usage as AnthropicUsageFile;

export const ANTHROPIC_USAGE_META = {
  file: data.file,
  period: data.period,
  generated_at: data.generated_at,
};

// ISO3 → 0-100 usage-intensity index.
export async function fetchAnthropicIndex(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const [iso3, v] of Object.entries(data.values)) out[iso3] = v.index;
  return out;
}
