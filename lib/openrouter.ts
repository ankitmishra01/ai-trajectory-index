// OpenRouter client

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Tried in order until one succeeds. Mix providers so rate limits don't
// cascade — each has an independent free-tier quota.
// Verified live against https://openrouter.ai/api/v1/models on 2026-09-04;
// re-check that endpoint (no key required) if this chain starts 404ing again
// — free-tier model IDs get retired regularly.
const MODELS = [
  "google/gemma-4-31b-it:free",
  "z-ai/glm-5.2:free",
  "minimax/minimax-m3:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "liquid/lfm-2.5-2.6b:free",
];

const SECTION_HEADINGS = [
  "Standing & Trajectory",
  "Infrastructure & Talent",
  "Governance & Policy",
  "Investment & Capital",
  "Economic Readiness & Outlook",
] as const;

export interface CountryContext {
  name: string;
  flag: string;
  region: string;
  total_score: number;
  trajectory_label: string;
  trajectory_score: number;
  projected_score_2028: number;
  top_accelerator: string;
  top_risk: string;
}

export interface NewsSignal {
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  key_events: string[];
  pillars_affected: string[];
  momentum: "accelerating" | "stable" | "slowing";
}

async function callOpenRouter(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer":
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-trajectory-index.vercel.app",
    "X-Title": "AI Trajectory Index",
  };

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const PER_MODEL_TIMEOUT_MS = 15_000; // 15s per model attempt

  let lastError = "";
  for (const model of MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PER_MODEL_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ model, messages }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : String(err);
      lastError = `${model} timed out or network error: ${msg}`;
      continue;
    }
    clearTimeout(timeoutId);

    // 404 = model no longer available, 429 = rate-limited, 503 = overloaded
    // All three: skip to next model instead of aborting the whole chain
    if (res.status === 404 || res.status === 429 || res.status === 503) {
      const text = await res.text().catch(() => "");
      lastError = `${model} skipped (${res.status})`;
      if (res.status === 404) {
        // Log 404s so we notice when model IDs go stale
        console.warn(`OpenRouter model not found: ${model}`, text.slice(0, 200));
      }
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) return content as string;
    lastError = `${model} returned empty response`;
  }

  throw new Error(`All models unavailable. Last error: ${lastError}`);
}

/**
 * AI-drafted version of the same five sections the deterministic template in
 * lib/narrativeTemplate.ts produces, grounded in the same fact pack, so the
 * two sources render identically in the UI. Throws (via callOpenRouter) if
 * every model in the chain fails — the API route catches that and falls back
 * to the template.
 */
export async function generateStructuredNarrative(
  factPackSummary: string
): Promise<NarrativeSectionsRaw> {
  const systemPrompt = `You are an expert in AI policy, technology economics, and emerging markets, writing for policymakers and investors. Tone: direct, factual, forward-looking, dense with the specific figures you're given — never filler, never generic. Ground every claim in the data provided; do not invent numbers.`;

  const userMessage = `Using only the facts below, write a five-section AI-readiness brief. Output exactly five sections in this order, each starting on its own line with "### " followed by the exact heading, then 3-4 sentences of prose (100-150 words) citing specific figures from the facts:

### Standing & Trajectory
### Infrastructure & Talent
### Governance & Policy
### Investment & Capital
### Economic Readiness & Outlook

Facts:
${factPackSummary}

Do not add any other headings, preamble, or closing remarks — only the five "### " sections.`;

  const raw = await callOpenRouter(systemPrompt, userMessage);
  return parseSections(raw);
}

export type NarrativeSectionsRaw = { heading: string; body: string }[];

function parseSections(raw: string): NarrativeSectionsRaw {
  const parts = raw.split(/^###\s+/m).map((p) => p.trim()).filter(Boolean);
  const sections: NarrativeSectionsRaw = [];
  for (const part of parts) {
    const [firstLine, ...rest] = part.split("\n");
    const heading = firstLine.trim();
    const body = rest.join("\n").trim();
    if (heading && body) sections.push({ heading, body });
  }
  if (sections.length !== SECTION_HEADINGS.length) {
    throw new Error(`AI response did not parse into ${SECTION_HEADINGS.length} sections (got ${sections.length})`);
  }
  return sections;
}

export async function askAboutCountries(
  question: string,
  countries: CountryContext[]
): Promise<string> {
  const context = countries
    .map(
      (c) =>
        `${c.flag} ${c.name} (${c.region}): Score ${c.total_score}/100 · Trajectory ${c.trajectory_label} (${c.trajectory_score > 0 ? "+" : ""}${c.trajectory_score}) · Projected 2028: ${c.projected_score_2028}/100 · Accelerator: ${c.top_accelerator} · Risk: ${c.top_risk}`
    )
    .join("\n");

  const systemPrompt = `You are an expert AI policy and geopolitics analyst for the AI Trajectory Index — a tool that scores every country on AI readiness across 5 dimensions (infrastructure, talent, governance, investment, economic readiness) out of 100 total. Trajectory scores run from -10 to +10. Answer questions about the selected countries concisely (2-4 paragraphs). Reference specific scores and trajectories. Be analytical and comparative.`;

  const userMessage = `Selected countries:\n${context}\n\nQuestion: ${question}`;

  return callOpenRouter(systemPrompt, userMessage);
}

export async function analyzeNewsSignal(
  countryName: string,
  headlines: string[]
): Promise<NewsSignal> {
  const systemPrompt = `You are an AI policy analyst. Given news headlines about a country, extract structured intelligence about AI-related developments. Respond ONLY with valid JSON, no prose.`;

  const userMessage = `Country: ${countryName}
Recent AI-related headlines (last 14 days):
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Respond with this exact JSON structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "1-2 sentence summary of the most significant AI developments",
  "key_events": ["event 1", "event 2", "event 3"],
  "pillars_affected": ["governance" | "investment" | "talent" | "infrastructure" | "economic_readiness"],
  "momentum": "accelerating" | "stable" | "slowing"
}

Base sentiment on policy announcements, investment news, strategy launches (positive) vs. bans, brain drain, funding cuts (negative). If headlines are unrelated to AI, return neutral/stable.`;

  const raw = await callOpenRouter(systemPrompt, userMessage);

  // Parse JSON from LLM output (may have surrounding text)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in signal response");

  const parsed = JSON.parse(jsonMatch[0]) as NewsSignal;
  return parsed;
}
