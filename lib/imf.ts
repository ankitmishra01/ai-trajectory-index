// IMF DataMapper API client
// Endpoint: https://www.imf.org/external/datamapper/api/v1/
// Country codes: ISO 3166-1 alpha-3 (USA, CHN, GBR…)
// Indicators used (verified against /api/v1/indicators, Oct 2026):
//   G_X_G01_GDP_PT — General government expenditure (% of GDP), IMF Fiscal Monitor
//   GGXWDG_NGDP    — General government gross debt (% of GDP), IMF World Economic Outlook
// The old GGEXP / GGDEBT codes do not exist and returned an empty body.
// Both series include multi-year projections, so only years up to last calendar year are used.

import type { IndicatorValues } from "./worldbank";

export type IMFData = Record<
  string, // ISO3 country code
  {
    govt_expenditure: IndicatorValues;
    govt_debt: IndicatorValues;
  }
>;

interface IMFDataMapperResponse {
  values: Record<string, Record<string, Record<string, number | null>>>;
}

export const IMF_EXPENDITURE = "G_X_G01_GDP_PT";
export const IMF_DEBT = "GGXWDG_NGDP";

// Latest and previous values at or before maxYear (projections after maxYear are ignored).
export function latestActual(
  yearValues: Record<string, number | null>,
  maxYear: number
): IndicatorValues {
  const years = Object.keys(yearValues).map(Number).filter((y) => y <= maxYear).sort((a, b) => b - a);
  let current: number | null = null;
  let currentYear: number | null = null;
  let previous: number | null = null;
  for (const yr of years) {
    const val = yearValues[String(yr)];
    if (val !== null && val !== undefined && !isNaN(val)) {
      if (current === null) { current = val; currentYear = yr; }
      else { previous = val; break; }
    }
  }
  return { current, previous, year: currentYear };
}

async function fetchIMFIndicator(indicator: string): Promise<Record<string, IndicatorValues>> {
  // No ?periods filter: it is not honoured by the API and returned an empty body.
  const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}`;
  const res = await fetch(url, {
    next: { revalidate: 86400 },
    // The IMF API blocks Node's default user agent (403); a descriptive agent is accepted.
    headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0 (compatible; AI-Trajectory-Index/1.0; +https://ai-trajectory-index.vercel.app)" },
  });

  if (!res.ok) throw new Error(`IMF API error for ${indicator}: ${res.status}`);

  const json: IMFDataMapperResponse = await res.json();
  const countryData = json?.values?.[indicator];
  if (!countryData || !Object.keys(countryData).length) {
    throw new Error(`IMF API returned no data for ${indicator}`);
  }

  const maxYear = new Date().getUTCFullYear() - 1;
  const result: Record<string, IndicatorValues> = {};
  for (const [iso3, yearValues] of Object.entries(countryData)) {
    const v = latestActual(yearValues, maxYear);
    if (v.current !== null) result[iso3] = v;
  }

  return result;
}

export async function fetchIMFData(): Promise<IMFData> {
  const [ggexp, ggdebt] = await Promise.all([
    fetchIMFIndicator(IMF_EXPENDITURE),
    fetchIMFIndicator(IMF_DEBT),
  ]);

  const allIso3s = Array.from(new Set([...Object.keys(ggexp), ...Object.keys(ggdebt)]));
  const empty: IndicatorValues = { current: null, previous: null, year: null };
  const merged: IMFData = {};

  for (const iso3 of allIso3s) {
    merged[iso3] = {
      govt_expenditure: ggexp[iso3] ?? empty,
      govt_debt:        ggdebt[iso3] ?? empty,
    };
  }

  return merged;
}
