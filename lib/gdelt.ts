// Multi-source AI news client
// Country feeds:  The Guardian API  +  Google News RSS
// Global ticker:  BBC Tech · TechCrunch · Wired · Ars Technica · The Verge  +  Guardian AI tag

export interface NewsArticle {
  title:    string;
  url:      string;
  domain:   string;
  date:     string;   // ISO 8601
  language: string;
  image:    string | null;
}

// ── Simple in-memory cache ──────────────────────────────────────────────────

const cache = new Map<string, { articles: NewsArticle[]; ts: number }>();
const COUNTRY_TTL = 60 * 60 * 1000;   // 1 hour
const GLOBAL_TTL  = 30 * 60 * 1000;   // 30 minutes (multiple feeds, cheaper to refresh)

function cacheGet(key: string, ttl: number): NewsArticle[] | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttl) return hit.articles;
  return null;
}
function cacheSet(key: string, articles: NewsArticle[]) {
  cache.set(key, { articles, ts: Date.now() });
}

// ── Lightweight RSS/Atom parser (no dependencies) ──────────────────────────

function cdataOrText(str: string): string {
  const cdata = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(str.trim());
  if (cdata) return cdata[1].trim();
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(xml);
  return m ? cdataOrText(m[1]) : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]+${attr}="([^"]+)"`, "i");
  const m = re.exec(xml);
  return m ? m[1].trim() : "";
}

function safeDate(raw: string): string {
  try { return new Date(raw).toISOString(); }
  catch { return new Date().toISOString(); }
}

interface ParsedItem {
  title:  string;
  url:    string;
  date:   string;
  source: string;   // domain or label
}

function parseRss(xml: string, fallbackDomain: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  // Match both <item> (RSS) and <entry> (Atom)
  const blockRe = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(xml)) !== null) {
    const block = m[1];

    const title = extractTag(block, "title");
    if (!title) continue;

    // Link: prefer <link href="..."/> (Atom) then text of <link>
    let url = extractAttr(block, "link", "href");
    if (!url) url = extractTag(block, "link");
    // Some RSS puts raw URL outside tags between <link> markers
    if (!url) {
      const rawLink = /<link>([^<]+)<\/link>/i.exec(block);
      if (rawLink) url = rawLink[1].trim();
    }
    if (!url) continue;

    const pubRaw = extractTag(block, "pubDate") ||
                   extractTag(block, "published") ||
                   extractTag(block, "updated") ||
                   extractTag(block, "dc:date");

    // Google News: <source url="https://...">Name</source>
    const sourceUrl  = extractAttr(block, "source", "url");
    const sourceName = extractTag(block, "source");
    let domain = fallbackDomain;
    if (sourceUrl) {
      try { domain = new URL(sourceUrl).hostname.replace(/^www\./, ""); } catch { /* keep fallback */ }
    } else if (sourceName) {
      domain = sourceName;
    }

    // Strip " - Source Name" suffix that Google News appends to titles
    const cleanTitle = title.replace(/\s+[-–—]\s+[^-–—]+$/, "").trim() || title;

    items.push({ title: cleanTitle, url, date: safeDate(pubRaw), source: domain });
  }
  return items;
}

async function fetchRss(url: string, fallbackDomain: string): Promise<ParsedItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AI-Trajectory-Index/1.0 (news aggregator)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss(xml, fallbackDomain);
  } catch {
    return [];
  }
}

// ── Guardian helper ────────────────────────────────────────────────────────

interface GuardianResult {
  webTitle:           string;
  webUrl:             string;
  webPublicationDate: string;
}

async function fetchGuardian(
  query: string,
  pageSize: number,
  tagFilter?: string
): Promise<ParsedItem[]> {
  const apiKey = process.env.GUARDIAN_API_KEY ?? "test";
  const params: Record<string, string> = {
    q:           query,
    "api-key":   apiKey,
    "page-size": String(pageSize),
    "order-by":  "newest",
    "show-tags": "keyword",
  };
  if (tagFilter) params.tag = tagFilter;

  try {
    const res = await fetch(
      `https://content.guardianapis.com/search?${new URLSearchParams(params)}`,
      { headers: { "User-Agent": "AI-Trajectory-Index/1.0" }, signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return ((data?.response?.results ?? []) as GuardianResult[]).map((r) => ({
      title:  r.webTitle.trim(),
      url:    r.webUrl,
      date:   safeDate(r.webPublicationDate),
      source: "theguardian.com",
    }));
  } catch {
    return [];
  }
}

// ── Dedup + merge helpers ──────────────────────────────────────────────────

function dedup(items: ParsedItem[]): ParsedItem[] {
  const seen = new Set<string>();
  return items.filter((a) => {
    const key = a.url.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toArticle(item: ParsedItem): NewsArticle {
  return {
    title:    item.title,
    url:      item.url,
    domain:   item.source,
    date:     item.date,
    language: "English",
    image:    null,
  };
}

// ── Country news query overrides ───────────────────────────────────────────

const GUARDIAN_OVERRIDES: Record<string, string> = {
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

// ── Global tech RSS feeds ─────────────────────────────────────────────────

const GLOBAL_RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml",         domain: "bbc.com"         },
  { url: "https://techcrunch.com/feed/",                             domain: "techcrunch.com"  },
  { url: "https://www.wired.com/feed/tag/artificial-intelligence/rss", domain: "wired.com"    },
  { url: "https://feeds.arstechnica.com/arstechnica/technology-lab", domain: "arstechnica.com" },
  { url: "https://www.theverge.com/rss/index.xml",                   domain: "theverge.com"   },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", domain: "nytimes.com" },
] as const;

const AI_KEYWORDS = [
  "artificial intelligence", " ai ", " llm", "machine learning",
  "chatgpt", "openai", "anthropic", "gemini", "claude", "gpt-",
  "neural network", "deep learning", "generative ai", "large language",
];

function isAIRelated(title: string): boolean {
  const lower = ` ${title.toLowerCase()} `;
  return AI_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function fetchCountryNews(
  countryName: string,
  slug: string,
  maxRecords = 10
): Promise<NewsArticle[]> {
  const cached = cacheGet(slug, COUNTRY_TTL);
  if (cached) return cached;

  const guardianQuery = GUARDIAN_OVERRIDES[slug] ?? `"${countryName}" "artificial intelligence"`;
  const googleQuery   = encodeURIComponent(
    GUARDIAN_OVERRIDES[slug]
      ? GUARDIAN_OVERRIDES[slug].replace(/"/g, "").split(" OR ")[0].trim() + " AI"
      : `${countryName} artificial intelligence`
  );
  const googleRssUrl = `https://news.google.com/rss/search?q=${googleQuery}&hl=en&gl=US&ceid=US:en`;

  // Fetch both sources in parallel
  const [guardianItems, googleItems] = await Promise.all([
    fetchGuardian(guardianQuery, Math.ceil(maxRecords / 2)),
    fetchRss(googleRssUrl, "Google News"),
  ]);

  // Merge: Guardian first (higher quality), then Google News fills gaps
  const merged = dedup([...guardianItems, ...googleItems])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, maxRecords);

  const articles = merged.map(toArticle);
  cacheSet(slug, articles);
  return articles;
}

export async function fetchGlobalAINews(maxRecords = 24): Promise<NewsArticle[]> {
  const cached = cacheGet("__global__", GLOBAL_TTL);
  if (cached) return cached;

  // Fetch all sources in parallel: Guardian AI tag + 6 RSS feeds
  const [guardianItems, ...rssResults] = await Promise.all([
    fetchGuardian("artificial intelligence", 10, "technology/artificialintelligenceai"),
    ...GLOBAL_RSS_FEEDS.map((f) => fetchRss(f.url, f.domain)),
  ]);

  // Filter RSS results to AI-relevant articles only
  const rssItems = rssResults
    .flat()
    .filter((item) => isAIRelated(item.title));

  const merged = dedup([...guardianItems, ...rssItems])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, maxRecords);

  const articles = merged.map(toArticle);
  cacheSet("__global__", articles);
  return articles;
}
