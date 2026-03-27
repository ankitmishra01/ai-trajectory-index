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

  let lastError = "";
  for (const model of MODELS) {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages }),
    });

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: NarrativeRequest
): Promise<string> {
  throw new Error("Phase 3 feature — not yet implemented.");
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
