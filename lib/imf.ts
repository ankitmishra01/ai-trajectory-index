// IMF DataMapper API client
// Endpoint: https://www.imf.org/external/datamapper/api/v1/
// Country codes: ISO 3166-1 alpha-3 (USA, CHN, GBR…)
// Indicators used:
//   GGEXP — General government total expenditure (% of GDP)
//   GGDEBT — General government gross debt (% of GDP)

import type { IndicatorValues } from "./worldbank";

export type IMFData = Record<
  string, // ISO3 country code
  {
    govt_expenditure: IndicatorValues;
    govt_debt: IndicatorValues;
  }
>;

interface IMFDataMapperResponse {
  values: Record<string, Record<string, Record<string, number>>>;
}

async function fetchIMFIndicator(indicator: string): Promise<Record<string, IndicatorValues>> {
  const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}?periods=2024,2023,2022,2021`;
  const res = await fetch(url, {
    next: { revalidate: 86400 },
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) throw new Error(`IMF API error for ${indicator}: ${res.status}`);

  const json: IMFDataMapperResponse = await res.json();
  const countryData = json?.values?.[indicator] ?? {};

  const result: Record<string, IndicatorValues> = {};
  for (const [iso3, yearValues] of Object.entries(countryData)) {
    // Sort years descending and pick the two most recent non-null values
    const years = Object.keys(yearValues)
      .map(Number)
      .sort((a, b) => b - a);

    let current: number | null = null;
    let currentYear: number | null = null;
    let previous: number | null = null;

    for (const yr of years) {
      const val = yearValues[String(yr)];
      if (val !== null && val !== undefined && !isNaN(val)) {
        if (current === null) { current = val; currentYear = yr; }
        else if (previous === null) { previous = val; break; }
      }
    }

    result[iso3] = { current, previous, year: currentYear };
  }

  return result;
}

export async function fetchIMFData(): Promise<IMFData> {
  const [ggexp, ggdebt] = await Promise.all([
    fetchIMFIndicator("GGEXP"),
    fetchIMFIndicator("GGDEBT"),
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
