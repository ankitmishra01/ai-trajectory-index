// World Bank API client
// Endpoint: https://api.worldbank.org/v2/
// mrv=2 fetches the two most recent values per country (used for growth rate calculation)

const WB_BASE = "https://api.worldbank.org/v2";

const INDICATORS = {
  // ── Digital access ──────────────────────────────────────────────────────────
  internet:      "IT.NET.USER.ZS",      // Internet users (% of population)
  mobile:        "IT.CEL.SETS.P2",      // Mobile subscriptions per 100 people
  broadband:     "IT.NET.BBN.P2",       // Fixed broadband subscriptions per 100 people

  // ── Education & labour ──────────────────────────────────────────────────────
  tertiary:           "SE.TER.ENRR",        // Tertiary school enrollment (%)
  labor_productivity: "SL.GDP.PCAP.EM.KD", // GDP per person employed (constant 2017 PPP$)

  // ── R&D ──────────────────────────────────────────────────────────────────────
  rd: "GB.XPD.RSDV.GD.ZS",             // R&D expenditure (% of GDP)

  // ── Infrastructure ───────────────────────────────────────────────────────────
  electricity: "EG.ELC.ACCS.ZS",       // Access to electricity (% of population)

  // ── Governance (World Governance Indicators, WGI) ───────────────────────────
  // WGI estimates are z-scores: range ≈ −2.5 to +2.5 (higher = better)
  gov_effectiveness:  "GE.EST",         // Government Effectiveness
  rule_of_law:        "RL.EST",         // Rule of Law
  regulatory_quality: "RQ.EST",         // Regulatory Quality

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

async function fetchIndicator(
  indicator: string
): Promise<Record<string, IndicatorValues>> {
  const url = `${WB_BASE}/country/all/indicator/${indicator}?format=json&mrv=2&per_page=500`;

  const res = await fetch(url, {
    next: { revalidate: 86400 }, // 24-hour cache via Next.js data cache
  });

  if (!res.ok) {
    throw new Error(`World Bank API error for ${indicator}: ${res.status}`);
  }

  const json = await res.json();
  // WB response: [metadata, dataArray]
  const dataArray: WBDataPoint[] = Array.isArray(json[1]) ? json[1] : [];

  // Group by country ISO code; WB returns newest first when mrv=2
  const byCountry: Record<string, { value: number | null; date: string }[]> = {};
  for (const point of dataArray) {
    const iso = point.country.id;
    if (!byCountry[iso]) byCountry[iso] = [];
    byCountry[iso].push({ value: point.value, date: point.date });
  }

  const result: Record<string, IndicatorValues> = {};
  for (const [iso, pts] of Object.entries(byCountry)) {
    result[iso] = {
      current:  pts[0]?.value ?? null,
      previous: pts[1]?.value ?? null,
      year:     pts[0]?.date ? parseInt(pts[0].date.slice(0, 4), 10) : null,
    };
  }
  return result;
}

export async function fetchWorldBankIndicators(): Promise<WorldBankData> {
  const [
    internet, mobile, broadband,
    tertiary, labor_productivity, rd, electricity,
    gov_effectiveness, rule_of_law, regulatory_quality,
    fdi,
    gdp_ppp, gdp, private_credit, trade_openness, services_share,
    hightech_exports,
  ] = await Promise.all([
    fetchIndicator(INDICATORS.internet),
    fetchIndicator(INDICATORS.mobile),
    fetchIndicator(INDICATORS.broadband),
    fetchIndicator(INDICATORS.tertiary),
    fetchIndicator(INDICATORS.labor_productivity),
    fetchIndicator(INDICATORS.rd),
    fetchIndicator(INDICATORS.electricity),
    fetchIndicator(INDICATORS.gov_effectiveness),
    fetchIndicator(INDICATORS.rule_of_law),
    fetchIndicator(INDICATORS.regulatory_quality),
    fetchIndicator(INDICATORS.fdi),
    fetchIndicator(INDICATORS.gdp_ppp),
    fetchIndicator(INDICATORS.gdp),
    fetchIndicator(INDICATORS.private_credit),
    fetchIndicator(INDICATORS.trade_openness),
    fetchIndicator(INDICATORS.services_share),
    fetchIndicator(INDICATORS.hightech_exports),
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

  return merged;
}
