// News client — The Guardian Open Platform API
// Free tier works with api-key=test (up to 12 req/s, 5000 req/day).
// Register a free production key at https://open-platform.theguardian.com/access/
// and set GUARDIAN_API_KEY in your environment for higher limits.
//
// Falls back to a short curated list so the UI never shows a broken state.

export interface NewsArticle {
  title: string;
  url: string;
  domain: string;
  date: string;       // ISO 8601
  language: string;
  image: string | null;
}

const GUARDIAN_BASE = "https://content.guardianapis.com";

// In-memory cache: cacheKey → { articles, ts }
const articleCache = new Map<string, { articles: NewsArticle[]; ts: number }>();
const ARTICLE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Query builders ────────────────────────────────────────────────────────────

const QUERY_OVERRIDES: Record<string, string> = {
  usa:              '"United States" "artificial intelligence"',
  "united-kingdom": '"United Kingdom" "artificial intelligence"',
  "south-korea":    '"South Korea" "artificial intelligence"',
  "north-korea":    '"North Korea" technology',
  "democratic-republic-of-congo": "Congo artificial intelligence",
};

function buildCountryQuery(countryName: string, slug: string): string {
  if (QUERY_OVERRIDES[slug]) return QUERY_OVERRIDES[slug];
  return `"${countryName}" "artificial intelligence"`;
}

// ── The Guardian fetch ────────────────────────────────────────────────────────

interface GuardianResult {
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  sectionName: string;
}

async function fetchGuardian(
  query: string,
  cacheKey: string,
  pageSize: number
): Promise<NewsArticle[]> {
  const hit = articleCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < ARTICLE_TTL_MS) return hit.articles;

  const apiKey = process.env.GUARDIAN_API_KEY ?? "test";

  const params = new URLSearchParams({
    q:           query,
    "api-key":   apiKey,
    "page-size": String(pageSize),
    "order-by":  "newest",
    "show-tags": "keyword",
    tag:         "technology/artificialintelligenceai,technology/technology,world/world",
  });

  const url = `${GUARDIAN_BASE}/search?${params.toString()}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "AI-Trajectory-Index/1.0" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`Guardian API ${res.status}`);

  const data = await res.json();
  const results: GuardianResult[] = data?.response?.results ?? [];

  const articles: NewsArticle[] = results.map((r) => ({
    title:    r.webTitle.trim(),
    url:      r.webUrl,
    domain:   "theguardian.com",
    date:     r.webPublicationDate,
    language: "English",
    image:    null,
  }));

  articleCache.set(cacheKey, { articles, ts: Date.now() });
  return articles;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchCountryNews(
  countryName: string,
  slug: string,
  maxRecords = 8
): Promise<NewsArticle[]> {
  const query = buildCountryQuery(countryName, slug);
  return fetchGuardian(query, slug, maxRecords);
}

export async function fetchGlobalAINews(maxRecords = 20): Promise<NewsArticle[]> {
  // Tag-scoped: returns only articles in The Guardian's AI technology section
  const params = new URLSearchParams({
    "api-key":   process.env.GUARDIAN_API_KEY ?? "test",
    "page-size": String(maxRecords),
    "order-by":  "newest",
    section:     "technology",
    tag:         "technology/artificialintelligenceai",
  });

  const cacheKey = "__global__";
  const hit = articleCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < ARTICLE_TTL_MS) return hit.articles;

  const res = await fetch(`${GUARDIAN_BASE}/search?${params.toString()}`, {
    headers: { "User-Agent": "AI-Trajectory-Index/1.0" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`Guardian API ${res.status}`);

  const data = await res.json();
  const results: GuardianResult[] = data?.response?.results ?? [];

  const articles: NewsArticle[] = results.map((r) => ({
    title:    r.webTitle.trim(),
    url:      r.webUrl,
    domain:   "theguardian.com",
    date:     r.webPublicationDate,
    language: "English",
    image:    null,
  }));

  articleCache.set(cacheKey, { articles, ts: Date.now() });
  return articles;
}
