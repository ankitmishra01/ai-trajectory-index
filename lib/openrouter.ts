// OpenRouter client — model: google/gemini-2.0-flash-exp:free

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Tried in order until one succeeds (free tier can be rate-limited per provider)
const MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "google/gemma-3-27b-it:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen3-4b:free",
  "openrouter/free", // auto-routes to any available free model
];

export interface NarrativeRequest {
  countryName: string;
  totalScore: number;
  trajectoryLabel: string;
  trajectoryScore: number;
  projectedScore: number;
  topAccelerator: string;
  topRisk: string;
  scores: {
    infrastructure: number;
    talent: number;
    governance: number;
    investment: number;
    economic_readiness: number;
  };
  // optional enrichment from policies / WB
  internetPct?: number;
  gdpPerCapita?: number;
  rdSpendPct?: number;
  hasAiStrategy?: boolean;
}

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
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-index.ankitmishra.ca",
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

    if (res.status === 429 || res.status === 503) {
      lastError = `${model} rate-limited (${res.status})`;
      continue; // try next model
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

export async function generateNarrative(
  request: NarrativeRequest
): Promise<string> {
  const {
    countryName,
    totalScore,
    trajectoryLabel,
    trajectoryScore,
    projectedScore,
    topAccelerator,
    topRisk,
    scores,
    internetPct,
    gdpPerCapita,
    rdSpendPct,
    hasAiStrategy,
  } = request;

  const systemPrompt = `You are an expert in AI policy, technology economics, and emerging markets. You write concise, data-driven analysis for policymakers and investors. Your tone is direct, factual, and forward-looking. Never use filler phrases. Always ground analysis in specific indicators and policy decisions.`;

  const userMessage = `Write a 3-paragraph analysis of ${countryName}'s AI trajectory.

Current scores: Infrastructure ${scores.infrastructure}/20, Talent ${scores.talent}/20, Governance ${scores.governance}/20, Investment ${scores.investment}/20, Economic Readiness ${scores.economic_readiness}/20. Total: ${totalScore}/100.
Trajectory: ${trajectoryLabel} (${trajectoryScore > 0 ? "+" : ""}${trajectoryScore}). Projected 2028 score: ${projectedScore}/100.
Top accelerator: ${topAccelerator}. Top risk: ${topRisk}.${
    internetPct !== undefined || gdpPerCapita !== undefined || rdSpendPct !== undefined || hasAiStrategy !== undefined
      ? `\nKey data:${internetPct !== undefined ? ` Internet penetration ${internetPct}%,` : ""}${gdpPerCapita !== undefined ? ` GDP per capita $${Math.round(gdpPerCapita).toLocaleString()},` : ""}${rdSpendPct !== undefined ? ` R&D spend ${rdSpendPct}% of GDP,` : ""}${hasAiStrategy !== undefined ? ` National AI strategy: ${hasAiStrategy ? "yes" : "no"}.` : ""}`
      : ""
  }

Paragraph 1 — Current State: What the scores reveal about where this country stands in the AI race and why.
Paragraph 2 — Trajectory: What is driving acceleration or stagnation, with specific reference to policy, capital, and talent dynamics.
Paragraph 3 — Outlook: What needs to happen for this country to improve its position, and what the realistic 2028 scenario looks like.

Keep each paragraph to 3-4 sentences. Be specific. No generic statements. Do not use section headers or labels — just write the three paragraphs separated by blank lines.`;

  return callOpenRouter(systemPrompt, userMessage);
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
