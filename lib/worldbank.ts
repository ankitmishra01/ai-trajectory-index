// World Bank API client
// Endpoint: https://api.worldbank.org/v2/
// mrv=2 fetches the two most recent values per country (used for growth rate calculation)

const WB_BASE = "https://api.worldbank.org/v2";

const INDICATORS = {
  internet: "IT.NET.USER.ZS", // Internet users (% of population)
  mobile: "IT.CEL.SETS.P2", // Mobile subscriptions per 100 people
  tertiary: "SE.TER.ENRR", // Tertiary school enrollment (%)
  rd: "GB.XPD.RSDV.GD.ZS", // R&D expenditure (% of GDP)
  gdp: "NY.GDP.PCAP.CD", // GDP per capita (current USD)
  electricity: "EG.ELC.ACCS.ZS", // Access to electricity (% of population)
} as const;

export type IndicatorKey = keyof typeof INDICATORS;

export interface IndicatorValues {
  current: number | null;
  previous: number | null;
}

export type WorldBankData = Record<
  string, // ISO2 country code
  {
    internet: IndicatorValues;
    mobile: IndicatorValues;
    tertiary: IndicatorValues;
    rd: IndicatorValues;
    gdp: IndicatorValues;
    electricity: IndicatorValues;
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
  const byCountry: Record<string, (number | null)[]> = {};
  for (const point of dataArray) {
    const iso = point.country.id;
    if (!byCountry[iso]) byCountry[iso] = [];
    byCountry[iso].push(point.value);
  }

  const result: Record<string, IndicatorValues> = {};
  for (const [iso, values] of Object.entries(byCountry)) {
    result[iso] = {
      current: values[0] ?? null,
      previous: values[1] ?? null,
    };
  }
  return result;
}

export async function fetchWorldBankIndicators(): Promise<WorldBankData> {
  const [internet, mobile, tertiary, rd, gdp, electricity] = await Promise.all([
    fetchIndicator(INDICATORS.internet),
    fetchIndicator(INDICATORS.mobile),
    fetchIndicator(INDICATORS.tertiary),
    fetchIndicator(INDICATORS.rd),
    fetchIndicator(INDICATORS.gdp),
    fetchIndicator(INDICATORS.electricity),
  ]);

  // Merge all indicators keyed by ISO2
  const allIsos = Array.from(
    new Set([
      ...Object.keys(internet),
      ...Object.keys(mobile),
      ...Object.keys(tertiary),
      ...Object.keys(rd),
      ...Object.keys(gdp),
      ...Object.keys(electricity),
    ])
  );

  const empty: IndicatorValues = { current: null, previous: null };
  const merged: WorldBankData = {};

  for (const iso of allIsos) {
    merged[iso] = {
      internet: internet[iso] ?? empty,
      mobile: mobile[iso] ?? empty,
      tertiary: tertiary[iso] ?? empty,
      rd: rd[iso] ?? empty,
      gdp: gdp[iso] ?? empty,
      electricity: electricity[iso] ?? empty,
    };
  }

  return merged;
}
