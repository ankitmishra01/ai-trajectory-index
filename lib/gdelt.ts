// News client — The Guardian Open Platform API
// Free tier works with api-key=test (up to 12 req/s, 5000 req/day).
// Register a free production key at https://open-platform.theguardian.com/access/
// and set GUARDIAN_API_KEY in your environment for higher limits.

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

// ── Query builders ─────────────────────────────────────────────────────────────

// Slugs where the country name alone is ambiguous or won't match well
const QUERY_OVERRIDES: Record<string, string> = {
  // Slugs where the stored country name differs from how Guardian writes it
  usa:                  '"United States" "artificial intelligence"',
  uk:                   '"United Kingdom" "artificial intelligence"',
  uae:                  '"United Arab Emirates" "artificial intelligence"',
  drc:                  '"Democratic Republic of Congo" OR "DRC" "artificial intelligence"',
  "south-korea":        '"South Korea" "artificial intelligence"',
  "north-korea":        '"North Korea" technology',
  "ivory-coast":        '"Ivory Coast" OR "Cote d\'Ivoire" technology',
  "trinidad-tobago":    '"Trinidad and Tobago" OR "Trinidad" "artificial intelligence"',
  "bosnia-herzegovina": '"Bosnia" "artificial intelligence"',
  "north-macedonia":    '"North Macedonia" technology',
  "el-salvador":        '"El Salvador" "artificial intelligence"',
  "costa-rica":         '"Costa Rica" "artificial intelligence"',
  "new-zealand":        '"New Zealand" "artificial intelligence"',
  "saudi-arabia":       '"Saudi Arabia" "artificial intelligence"',
  "cape-verde":         '"Cape Verde" technology',
  "south-africa":       '"South Africa" "artificial intelligence"',
  "sri-lanka":          '"Sri Lanka" "artificial intelligence"',
  "hong-kong":          '"Hong Kong" "artificial intelligence"',
};

function buildCountryQuery(countryName: string, slug: string): string {
  if (QUERY_OVERRIDES[slug]) return QUERY_OVERRIDES[slug];
  return `"${countryName}" "artificial intelligence"`;
}

// ── The Guardian fetch ─────────────────────────────────────────────────────────

interface GuardianResult {
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  sectionName: string;
}

async function fetchGuardian(
  query: string,
  cacheKey: string,
  pageSize: number,
  tagFilter?: string
): Promise<NewsArticle[]> {
  const hit = articleCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < ARTICLE_TTL_MS) return hit.articles;

  const apiKey = process.env.GUARDIAN_API_KEY ?? "test";

  const paramObj: Record<string, string> = {
    q:           query,
    "api-key":   apiKey,
    "page-size": String(pageSize),
    "order-by":  "newest",
    "show-tags": "keyword",
  };
  // Tag filter is only applied for the global feed. Country queries rely on
  // text search alone so articles tagged world/canada (not technology/ai) aren't dropped.
  if (tagFilter) paramObj.tag = tagFilter;

  const url = `${GUARDIAN_BASE}/search?${new URLSearchParams(paramObj).toString()}`;

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

// ── Public API ─────────────────────────────────────────────────────────────────

export async function fetchCountryNews(
  countryName: string,
  slug: string,
  maxRecords = 8
): Promise<NewsArticle[]> {
  const query = buildCountryQuery(countryName, slug);
  return fetchGuardian(query, slug, maxRecords);
}

export async function fetchGlobalAINews(maxRecords = 20): Promise<NewsArticle[]> {
  return fetchGuardian(
    "artificial intelligence",
    "__global__",
    maxRecords,
    "technology/artificialintelligenceai"   // tag-scoped for the global ticker
  );
}
