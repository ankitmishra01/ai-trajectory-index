// OECD SDMX-JSON API client
// Endpoint: https://sdmx.oecd.org/public/rest/data/
// Rate limit: 60 queries/hour — this module makes 2 requests total.
// Country codes: ISO 3166-1 alpha-3
// Indicators:
//   GPERD  — Gross domestic expenditure on R&D (% of GDP)
//   HC_R   — Researchers (head count per 1000 employed)

import type { IndicatorValues } from "./worldbank";

export type OECDData = Record<
  string, // ISO3 country code
  {
    rd_expenditure: IndicatorValues; // % of GDP (more granular than World Bank for OECD members)
    researchers:    IndicatorValues; // per 1000 employed
  }
>;

// SDMX-JSON response shape (simplified)
interface SDMXDataSet {
  series: Record<string, { observations: Record<string, [number | null, ...unknown[]]> }>;
}
interface SDMXDimensionValue { id: string }
interface SDMXDimension { id: string; values: SDMXDimensionValue[] }
interface SDMXStructure {
  dimensions: {
    series:      SDMXDimension[];
    observation: SDMXDimension[];
  };
}
interface SDMXResponse {
  data: {
    dataSets:  SDMXDataSet[];
    structure: SDMXStructure;
  };
}

function parseSDMX(json: SDMXResponse): Record<string, IndicatorValues> {
  const dataSet   = json?.data?.dataSets?.[0];
  const structure = json?.data?.structure;
  if (!dataSet || !structure) return {};

  // Identify which series dimension index is REF_AREA (country)
  const seriesDims = structure.dimensions.series;
  const refAreaIdx = seriesDims.findIndex((d) => d.id === "REF_AREA");
  if (refAreaIdx === -1) return {};

  // Observation dimension = TIME_PERIOD
  const timeDim = structure.dimensions.observation.find((d) => d.id === "TIME_PERIOD");
  if (!timeDim) return {};
  const timeValues = timeDim.values.map((v) => parseInt(v.id, 10));

  const result: Record<string, IndicatorValues> = {};

  for (const [seriesKey, seriesData] of Object.entries(dataSet.series)) {
    const dimIndices = seriesKey.split(":").map(Number);
    const countryIdx = dimIndices[refAreaIdx];
    const iso3 = seriesDims[refAreaIdx]?.values?.[countryIdx]?.id;
    if (!iso3) continue;

    // Collect all (year, value) pairs and pick two most recent non-null
    const pairs: { year: number; value: number }[] = [];
    for (const [obsIdx, obs] of Object.entries(seriesData.observations)) {
      const year  = timeValues[parseInt(obsIdx, 10)];
      const value = obs[0];
      if (year && value !== null && value !== undefined && !isNaN(value as number)) {
        pairs.push({ year, value: value as number });
      }
    }
    pairs.sort((a, b) => b.year - a.year);

    result[iso3] = {
      current:  pairs[0]?.value ?? null,
      previous: pairs[1]?.value ?? null,
      year:     pairs[0]?.year  ?? null,
    };
  }

  return result;
}

async function fetchOECDIndicator(
  filter: string,
  label: string
): Promise<Record<string, IndicatorValues>> {
  // OECD Data Explorer SDMX-JSON endpoint
  const base = "https://sdmx.oecd.org/public/rest/data";
  const flow = "OECD.STI.STP,DSD_MSTI@DF_MSTI,1.0";
  const url  = `${base}/${flow}/${filter}?format=jsondata&startPeriod=2018&endPeriod=2025&dimensionAtObservation=TIME_PERIOD`;

  const res = await fetch(url, {
    next: { revalidate: 86400 },
    headers: { "Accept": "application/vnd.sdmx.data+json;version=2" },
  });

  if (!res.ok) throw new Error(`OECD API error for ${label}: ${res.status}`);

  const json: SDMXResponse = await res.json();
  return parseSDMX(json);
}

export async function fetchOECDData(): Promise<OECDData> {
  // Fetch R&D (% GDP) and Researchers (/1000 employed) in parallel
  // Filter: Annual, all countries (..), all entity types (..), variable, all HC types (..), measure
  const [rdRaw, researchersRaw] = await Promise.all([
    fetchOECDIndicator("A...GPERD..PC_GDP",    "R&D expenditure % GDP"),
    fetchOECDIndicator("A...GPERD..PC_1000EMP","Researchers per 1000 employed"),
  ]);

  const allIso3s = Array.from(new Set([...Object.keys(rdRaw), ...Object.keys(researchersRaw)]));
  const empty: IndicatorValues = { current: null, previous: null, year: null };
  const merged: OECDData = {};

  for (const iso3 of allIso3s) {
    merged[iso3] = {
      rd_expenditure: rdRaw[iso3]          ?? empty,
      researchers:    researchersRaw[iso3] ?? empty,
    };
  }

  return merged;
}
