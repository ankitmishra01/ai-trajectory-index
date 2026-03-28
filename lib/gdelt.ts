// GDELT 2.0 Document API — free, no API key required
// Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

export interface NewsArticle {
  title: string;
  url: string;
  domain: string;
  date: string;       // ISO 8601
  language: string;
  image: string | null;
}

interface GdeltArticle {
  title?: string;
  url?: string;
  domain?: string;
  seendate?: string;  // e.g. "20240315T143000Z"
  language?: string;
  socialimage?: string;
}

// In-memory cache: countryName → { articles, ts }
const articleCache = new Map<string, { articles: NewsArticle[]; ts: number }>();
const ARTICLE_TTL_MS = 60 * 60 * 1000; // 1 hour

function parseGdeltDate(s: string): string {
  // "20240315T143000Z" → ISO
  if (!s) return new Date().toISOString();
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!m) return s;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

// Some country names need disambiguation or alternate phrasings in news search.
// GDELT query syntax: space = AND, OR keyword = OR, parentheses for grouping.
// Always scope OR terms inside parentheses so they apply to the country name too.
const QUERY_OVERRIDES: Record<string, string> = {
  usa:          '("United States" OR "U.S." OR "American") ("artificial intelligence" OR "AI policy" OR "AI strategy" OR "AI regulation")',
  "united-kingdom": '("United Kingdom" OR "UK" OR "Britain" OR "British") ("artificial intelligence" OR "AI policy" OR "AI strategy")',
  georgia:      '"Georgia" (AI OR "artificial intelligence") -"Georgia Tech"',
  chad:         '"Chad" Africa (AI OR "artificial intelligence")',
  guinea:       '"Guinea" Africa (AI OR "artificial intelligence")',
  niger:        '"Niger" Africa (AI OR "artificial intelligence")',
  jordan:       '"Jordan" ("artificial intelligence" OR "AI policy") "Middle East"',
  iran:         '"Iran" ("artificial intelligence" OR "AI policy" OR "AI strategy")',
  turkey:       '("Turkey" OR "Türkiye") ("artificial intelligence" OR "AI policy")',
  "south-korea": '"South Korea" ("artificial intelligence" OR "AI policy" OR "AI strategy")',
  "north-korea": '"North Korea" ("artificial intelligence" OR "AI technology")',
  "democratic-republic-of-congo": '("Congo" OR "DRC") ("artificial intelligence" OR "AI")',
};

function buildQuery(countryName: string, slug: string): string {
  if (QUERY_OVERRIDES[slug]) return QUERY_OVERRIDES[slug];
  // Parenthesise the OR group so all terms stay scoped to the country name.
  // Without parentheses, "Country" "AI policy" OR "AI strategy" is parsed as
  // ("Country" AND "AI policy") OR ("AI strategy" globally) — wrong.
  return `"${countryName}" ("artificial intelligence" OR "AI policy" OR "AI strategy" OR "AI investment" OR "AI regulation")`;
}

export async function fetchCountryNews(
  countryName: string,
  slug: string,
  maxRecords = 8
): Promise<NewsArticle[]> {
  const cacheKey = slug;
  const hit = articleCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < ARTICLE_TTL_MS) return hit.articles;

  const query = buildQuery(countryName, slug);
  const params = new URLSearchParams({
    query:       query,
    mode:        "artlist",
    maxrecords:  String(maxRecords),
    format:      "json",
    timespan:    "14d",      // last 14 days
    sort:        "datedesc",
    sourcelang:  "english",
  });

  const endpoint = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;

  const res = await fetch(endpoint, {
    headers: { "User-Agent": "AI-Trajectory-Index/1.0" },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);

  const data = await res.json();

  // GDELT returns { articles: [...] } on success, or { status: "error", message: "..." }
  if (data.status === "error") {
    throw new Error(`GDELT error: ${data.message ?? "unknown"}`);
  }

  const articles: NewsArticle[] = ((data.articles ?? []) as GdeltArticle[])
    .filter((a) => a.url && a.title)
    .map((a) => ({
      title:    a.title!.trim(),
      url:      a.url!,
      domain:   a.domain ?? new URL(a.url!).hostname.replace("www.", ""),
      date:     parseGdeltDate(a.seendate ?? ""),
      language: a.language ?? "English",
      image:    a.socialimage ?? null,
    }));

  articleCache.set(cacheKey, { articles, ts: Date.now() });
  return articles;
}

// Global AI news — no country filter, broad query
export async function fetchGlobalAINews(maxRecords = 20): Promise<NewsArticle[]> {
  const cacheKey = "__global__";
  const hit = articleCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < ARTICLE_TTL_MS) return hit.articles;

  const params = new URLSearchParams({
    query:      '"AI policy" OR "artificial intelligence strategy" OR "AI regulation" OR "AI investment" OR "AI governance" OR "national AI" announcement',
    mode:       "artlist",
    maxrecords: String(maxRecords),
    format:     "json",
    timespan:   "7d",
    sort:       "datedesc",
    sourcelang: "english",
  });

  try {
    const res = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) throw new Error(`GDELT ${res.status}`);
    const data = await res.json();

    const articles: NewsArticle[] = ((data.articles ?? []) as GdeltArticle[])
      .filter((a) => a.url && a.title)
      .map((a) => ({
        title:    a.title!.trim(),
        url:      a.url!,
        domain:   a.domain ?? new URL(a.url!).hostname.replace("www.", ""),
        date:     parseGdeltDate(a.seendate ?? ""),
        language: a.language ?? "English",
        image:    a.socialimage ?? null,
      }));

    articleCache.set(cacheKey, { articles, ts: Date.now() });
    return articles;
  } catch {
    return articleCache.get(cacheKey)?.articles ?? [];
  }
}
