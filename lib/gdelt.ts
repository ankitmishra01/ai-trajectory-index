// News client — primary source: Google News RSS (free, no API key, reliable from cloud)
// Fallback was GDELT 2.0, removed because GDELT blocks Vercel/AWS IP ranges.
//
// Google News RSS endpoint:
//   https://news.google.com/rss/search?q=QUERY&hl=en-US&gl=US&ceid=US:en
// Returns standard RSS 2.0 XML with <item> elements.

export interface NewsArticle {
  title: string;
  url: string;
  domain: string;
  date: string;       // ISO 8601
  language: string;
  image: string | null;
}

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

// In-memory cache: cacheKey → { articles, ts }
const articleCache = new Map<string, { articles: NewsArticle[]; ts: number }>();
const ARTICLE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── RSS parser ───────────────────────────────────────────────────────────────

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function parseGoogleNewsRSS(xml: string, maxItems: number): NewsArticle[] {
  const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g));

  return itemMatches.slice(0, maxItems).flatMap((m) => {
    const item = m[1];

    // Title — may be CDATA-wrapped
    const titleRaw =
      item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      item.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    const title = decodeHtmlEntities(titleRaw).trim();

    // Link — Google redirect URL, still opens correctly for users
    const link = item.match(/<link>(https?[^<]+)<\/link>/)?.[1]?.trim() ?? "";

    // Publication date
    const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? "";

    // Source — prefer the url attribute for the domain
    const sourceUrl = item.match(/<source url="([^"]+)"/)?.[1] ?? "";
    const sourceName =
      item.match(/<source[^>]*>([^<]+)<\/source>/)?.[1]?.trim() ?? "";

    let domain = sourceName;
    if (sourceUrl) {
      try {
        domain = new URL(sourceUrl).hostname.replace(/^www\./, "");
      } catch {
        domain = sourceName;
      }
    }

    if (!title || !link) return [];

    return [
      {
        title,
        url: link,
        domain: domain || "Google News",
        date: pubDate
          ? new Date(pubDate).toISOString()
          : new Date().toISOString(),
        language: "English",
        image: null,
      },
    ];
  });
}

// ── Query builders ───────────────────────────────────────────────────────────

// Country-specific overrides for ambiguous names or common abbreviations
const QUERY_OVERRIDES: Record<string, string> = {
  usa:            '"United States" OR "U.S." AI policy OR AI strategy OR "artificial intelligence"',
  "united-kingdom": '"United Kingdom" OR "UK" OR "Britain" AI policy OR AI strategy',
  georgia:        '"Georgia" AI -"Georgia Tech" -"University of Georgia"',
  chad:           '"Chad" Africa AI OR "artificial intelligence"',
  guinea:         '"Guinea" Africa AI OR "artificial intelligence"',
  niger:          '"Niger" Africa AI OR "artificial intelligence"',
  jordan:         '"Jordan" "Middle East" AI OR "artificial intelligence"',
  iran:           '"Iran" AI policy OR "artificial intelligence"',
  turkey:         '"Turkey" OR "Türkiye" AI policy OR "artificial intelligence"',
  "south-korea":  '"South Korea" AI OR "artificial intelligence"',
  "north-korea":  '"North Korea" AI OR technology',
  "democratic-republic-of-congo": '"Congo" OR "DRC" AI OR "artificial intelligence"',
};

function buildQuery(countryName: string, slug: string): string {
  if (QUERY_OVERRIDES[slug]) return QUERY_OVERRIDES[slug];
  return `"${countryName}" AI policy OR AI strategy OR "artificial intelligence"`;
}

// ── Fetch functions ──────────────────────────────────────────────────────────

async function fetchFromGoogleNews(
  query: string,
  cacheKey: string,
  maxRecords: number
): Promise<NewsArticle[]> {
  const hit = articleCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < ARTICLE_TTL_MS) return hit.articles;

  const url =
    `${GOOGLE_NEWS_RSS}?` +
    new URLSearchParams({
      q:    query,
      hl:   "en-US",
      gl:   "US",
      ceid: "US:en",
    }).toString();

  const res = await fetch(url, {
    headers: { "User-Agent": "AI-Trajectory-Index/1.0 (news aggregator)" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`Google News RSS ${res.status}`);

  const xml = await res.text();
  const articles = parseGoogleNewsRSS(xml, maxRecords);

  articleCache.set(cacheKey, { articles, ts: Date.now() });
  return articles;
}

export async function fetchCountryNews(
  countryName: string,
  slug: string,
  maxRecords = 8
): Promise<NewsArticle[]> {
  const query = buildQuery(countryName, slug);
  return fetchFromGoogleNews(query, slug, maxRecords);
}

export async function fetchGlobalAINews(maxRecords = 20): Promise<NewsArticle[]> {
  const query =
    '"AI policy" OR "AI strategy" OR "AI regulation" OR "AI investment" OR "national AI" "artificial intelligence"';
  return fetchFromGoogleNews(query, "__global__", maxRecords);
}
