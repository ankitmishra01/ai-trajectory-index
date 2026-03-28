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

// Some country names need disambiguation in news search
const QUERY_OVERRIDES: Record<string, string> = {
  georgia:      '"Georgia" AI policy -"Georgia Tech" -"Georgia US"',
  chad:         '"Chad" Africa AI technology',
  "guinea":     '"Guinea" Africa AI',
  niger:        '"Niger" Africa AI',
  jordan:       '"Jordan" AI technology Middle East',
  iran:         '"Iran" artificial intelligence',
  turkey:       '"Turkey" OR "Türkiye" AI',
  "south-korea":"\"South Korea\" AI",
  "north-korea":"\"North Korea\" AI technology",
};

function buildQuery(countryName: string, slug: string): string {
  if (QUERY_OVERRIDES[slug]) return QUERY_OVERRIDES[slug];
  return `"${countryName}" "artificial intelligence" OR "AI policy" OR "AI investment" OR "AI strategy"`;
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

  try {
    const res = await fetch(endpoint, {
      headers: { "User-Agent": "AI-Trajectory-Index/1.0" },
      signal: AbortSignal.timeout(10_000),
    });

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
    // Return cached stale data if available rather than nothing
    const stale = articleCache.get(cacheKey);
    return stale?.articles ?? [];
  }
}

// Global AI news — no country filter, broad query
export async function fetchGlobalAINews(maxRecords = 10): Promise<NewsArticle[]> {
  const cacheKey = "__global__";
  const hit = articleCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < ARTICLE_TTL_MS) return hit.articles;

  const params = new URLSearchParams({
    query:      '"AI policy" OR "artificial intelligence strategy" OR "AI regulation" OR "AI investment" announcement',
    mode:       "artlist",
    maxrecords: String(maxRecords),
    format:     "json",
    timespan:   "3d",
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
