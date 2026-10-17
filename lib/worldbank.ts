// World Bank API client
// Endpoint: https://api.worldbank.org/v2/
// mrnev=2 fetches the two most recent NON-EMPTY values per country (used for growth rates).
// (mrv=2 returned only the last two calendar years, which are mostly empty for lagging series.)
// Every page is read: the API paginates, and stopping at page 1 silently dropped countries.

const WB_BASE = "https://api.worldbank.org/v2";

const INDICATORS = {
  // ── Digital access ──────────────────────────────────────────────────────────
  internet:      "IT.NET.USER.ZS",      // Internet users (% of population)
  mobile:        "IT.CEL.SETS.P2",      // Mobile subscriptions per 100 people
  broadband:     "IT.NET.BBND.P2",      // Fixed broadband subscriptions per 100 people (IT.NET.BBN.P2 was retired)

  // ── Education & labour ──────────────────────────────────────────────────────
  tertiary:           "SE.TER.ENRR",        // Tertiary school enrollment (%)
  labor_productivity: "SL.GDP.PCAP.EM.KD", // GDP per person employed (constant 2017 PPP$)

  // ── R&D ──────────────────────────────────────────────────────────────────────
  rd: "GB.XPD.RSDV.GD.ZS",             // R&D expenditure (% of GDP)

  // ── Infrastructure ───────────────────────────────────────────────────────────
  electricity: "EG.ELC.ACCS.ZS",       // Access to electricity (% of population)

  // ── Governance (World Governance Indicators, WGI) ───────────────────────────
  // WGI estimates are z-scores: range ≈ −2.5 to +2.5 (higher = better).
  // The legacy GE.EST / RL.EST / RQ.EST codes were archived; GOV_WGI_* are the current series.
  gov_effectiveness:  "GOV_WGI_GE.EST", // Government Effectiveness
  rule_of_law:        "GOV_WGI_RL.EST", // Rule of Law
  regulatory_quality: "GOV_WGI_RQ.EST", // Regulatory Quality

  // ── Investment & capital flows ───────────────────────────────────────────────
  fdi: "BX.KLT.DINV.WD.GD.ZS",        // FDI net inflows (% of GDP)

  // ── Economic structure ───────────────────────────────────────────────────────
  gdp_ppp:       "NY.GDP.PCAP.PP.KD",  // GDP per capita PPP (constant 2017 intl $) — removes currency/price-level bias
  gdp:           "NY.GDP.PCAP.CD",     // GDP per capita (current USD) — kept for trajectory growth rate only
  private_credit: "FS.AST.PRVT.GD.ZS", // Domestic credit to private sector (% of GDP) — financial depth proxy
  trade_openness: "NE.TRD.GNFS.ZS",    // Trade in goods & services (% of GDP)
  services_share: "NV.SRV.TOTL.ZS",    // Services, value added (% of GDP) — knowledge-economy proxy

  // ── Innovation output (for Trajectory) ──────────────────────────────────────
  hightech_exports: "TX.VAL.TECH.MF.ZS", // High-technology exports (% of manufactured exports)
} as const;

export type IndicatorKey = keyof typeof INDICATORS;

export interface IndicatorValues {
  current: number | null;
  previous: number | null;
  year: number | null;   // calendar year of the most recent data point
}

export type WorldBankData = Record<
  string, // ISO2 country code
  {
    internet: IndicatorValues;
    mobile: IndicatorValues;
    broadband: IndicatorValues;
    tertiary: IndicatorValues;
    labor_productivity: IndicatorValues;
    rd: IndicatorValues;
    electricity: IndicatorValues;
    gov_effectiveness: IndicatorValues;
    rule_of_law: IndicatorValues;
    regulatory_quality: IndicatorValues;
    fdi: IndicatorValues;
    gdp_ppp: IndicatorValues;
    gdp: IndicatorValues;
    private_credit: IndicatorValues;
    trade_openness: IndicatorValues;
    services_share: IndicatorValues;
    hightech_exports: IndicatorValues;
  }
>;

interface WBDataPoint {
  country: { id: string };
  value: number | null;
  date: string;
}

interface WBPageMeta { page?: number; pages?: number; total?: number }

// Per-indicator fetch status, so callers can report honestly what actually loaded.
export interface IndicatorFetchStatus {
  indicator: string;
  ok: boolean;
  countries: number;
  error?: string;
}

const PER_PAGE = 1000;
const MAX_PAGES = 10;

// The World Bank returns HTTP 200 with `[{ message: [...] }]` for unknown/archived indicators
// or invalid parameters. Treat that as a failure instead of "no data".
export function worldBankError(json: unknown): string | null {
  if (!Array.isArray(json)) return "unexpected response shape";
  const first = json[0] as { message?: { key?: string; value?: string }[] } | undefined;
  if (first && Array.isArray(first.message) && first.message.length) {
    return first.message.map((m) => [m.key, m.value].filter(Boolean).join(": ")).join("; ");
  }
  if (!Array.isArray(json[1])) return "no data array in response";
  return null;
}

// Group raw points (newest first per country) into current/previous values. Exported for tests.
export function groupPoints(points: WBDataPoint[]): Record<string, IndicatorValues> {
  const byCountry: Record<string, { value: number | null; date: string }[]> = {};
  for (const point of points) {
    const iso = point.country?.id;
    if (!iso) continue; // territories without an ISO code (e.g. some WGI rows)
    if (point.value === null || point.value === undefined) continue;
    (byCountry[iso] ??= []).push({ value: point.value, date: point.date });
  }
  const result: Record<string, IndicatorValues> = {};
  for (const [iso, pts] of Object.entries(byCountry)) {
    pts.sort((a, b) => b.date.localeCompare(a.date));
    result[iso] = {
      current:  pts[0]?.value ?? null,
      previous: pts[1]?.value ?? null,
      year:     pts[0]?.date ? parseInt(pts[0].date.slice(0, 4), 10) : null,
    };
  }
  return result;
}

export async function fetchIndicatorPoints(indicator: string): Promise<WBDataPoint[]> {
  const points: WBDataPoint[] = [];
  for (let page = 1, pages = 1; page <= pages && page <= MAX_PAGES; page++) {
    const url = `${WB_BASE}/country/all/indicator/${indicator}?format=json&mrnev=2&per_page=${PER_PAGE}&page=${page}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // 24-hour cache via Next.js data cache
    if (!res.ok) throw new Error(`World Bank API error for ${indicator}: HTTP ${res.status}`);
    const json = await res.json();
    const err = worldBankError(json);
    if (err) throw new Error(`World Bank API error for ${indicator}: ${err}`);
    const meta = (json[0] ?? {}) as WBPageMeta;
    pages = Number(meta.pages) || 1;
    points.push(...(json[1] as WBDataPoint[]));
  }
  return points;
}

async function fetchIndicator(
  indicator: string,
  status: IndicatorFetchStatus[]
): Promise<Record<string, IndicatorValues>> {
  try {
    const grouped = groupPoints(await fetchIndicatorPoints(indicator));
    status.push({ indicator, ok: true, countries: Object.keys(grouped).length });
    return grouped;
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[worldbank] ${error}`);
    status.push({ indicator, ok: false, countries: 0, error });
    return {};
  }
}

// Fetch every indicator and report per-indicator status alongside the merged data.
export async function fetchWorldBank(): Promise<{ data: WorldBankData; status: IndicatorFetchStatus[] }> {
  const status: IndicatorFetchStatus[] = [];
  const [
    internet, mobile, broadband,
    tertiary, labor_productivity, rd, electricity,
    gov_effectiveness, rule_of_law, regulatory_quality,
    fdi,
    gdp_ppp, gdp, private_credit, trade_openness, services_share,
    hightech_exports,
  ] = await Promise.all([
    fetchIndicator(INDICATORS.internet, status),
    fetchIndicator(INDICATORS.mobile, status),
    fetchIndicator(INDICATORS.broadband, status),
    fetchIndicator(INDICATORS.tertiary, status),
    fetchIndicator(INDICATORS.labor_productivity, status),
    fetchIndicator(INDICATORS.rd, status),
    fetchIndicator(INDICATORS.electricity, status),
    fetchIndicator(INDICATORS.gov_effectiveness, status),
    fetchIndicator(INDICATORS.rule_of_law, status),
    fetchIndicator(INDICATORS.regulatory_quality, status),
    fetchIndicator(INDICATORS.fdi, status),
    fetchIndicator(INDICATORS.gdp_ppp, status),
    fetchIndicator(INDICATORS.gdp, status),
    fetchIndicator(INDICATORS.private_credit, status),
    fetchIndicator(INDICATORS.trade_openness, status),
    fetchIndicator(INDICATORS.services_share, status),
    fetchIndicator(INDICATORS.hightech_exports, status),
  ]);

  // Merge all indicators keyed by ISO2
  const allIsos = Array.from(
    new Set([
      ...Object.keys(internet),
      ...Object.keys(mobile),
      ...Object.keys(broadband),
      ...Object.keys(tertiary),
      ...Object.keys(labor_productivity),
      ...Object.keys(rd),
      ...Object.keys(electricity),
      ...Object.keys(gov_effectiveness),
      ...Object.keys(rule_of_law),
      ...Object.keys(regulatory_quality),
      ...Object.keys(fdi),
      ...Object.keys(gdp_ppp),
      ...Object.keys(gdp),
      ...Object.keys(private_credit),
      ...Object.keys(trade_openness),
      ...Object.keys(services_share),
      ...Object.keys(hightech_exports),
    ])
  );

  const empty: IndicatorValues = { current: null, previous: null, year: null };
  const merged: WorldBankData = {};

  for (const iso of allIsos) {
    merged[iso] = {
      internet:           internet[iso]           ?? empty,
      mobile:             mobile[iso]             ?? empty,
      broadband:          broadband[iso]          ?? empty,
      tertiary:           tertiary[iso]           ?? empty,
      labor_productivity: labor_productivity[iso] ?? empty,
      rd:                 rd[iso]                 ?? empty,
      electricity:        electricity[iso]        ?? empty,
      gov_effectiveness:  gov_effectiveness[iso]  ?? empty,
      rule_of_law:        rule_of_law[iso]        ?? empty,
      regulatory_quality: regulatory_quality[iso] ?? empty,
      fdi:                fdi[iso]                ?? empty,
      gdp_ppp:            gdp_ppp[iso]            ?? empty,
      gdp:                gdp[iso]                ?? empty,
      private_credit:     private_credit[iso]     ?? empty,
      trade_openness:     trade_openness[iso]     ?? empty,
      services_share:     services_share[iso]     ?? empty,
      hightech_exports:   hightech_exports[iso]   ?? empty,
    };
  }

  if (status.every((st) => !st.ok)) throw new Error("World Bank: every indicator request failed");
  return { data: merged, status };
}

export async function fetchWorldBankIndicators(): Promise<WorldBankData> {
  return (await fetchWorldBank()).data;
}
