// OECD with a dated fallback. The OECD gateway rate-limits (HTTP 429/5xx); a copy of the last
// successful pull (data/oecd-cache.json, refreshed weekly by .github/workflows/oecd-cache.yml)
// keeps the enrichment available, and callers are told when cached values are served and their date.
import oecdCache from "@/data/oecd-cache.json";
import { fetchOECDLive, type OECDData } from "@/lib/oecd";

export type OECDSourceStatus = { mode: "live" | "cache" | "unavailable"; as_of: string | null; error?: string };

type OECDCacheFile = { fetched_at: string | null; data: OECDData };

export function cachedOECD(): { data: OECDData; asOf: string | null } {
  const c = oecdCache as unknown as OECDCacheFile;
  return { data: c && c.data ? c.data : {}, asOf: c ? c.fetched_at : null };
}

export async function fetchOECDDataWithStatus(
  live: () => Promise<OECDData> = fetchOECDLive,
  cache: () => { data: OECDData; asOf: string | null } = cachedOECD,
): Promise<{ data: OECDData; status: OECDSourceStatus }> {
  try {
    const data = await live();
    return { data, status: { mode: "live", as_of: new Date().toISOString() } };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    const cached = cache();
    if (Object.keys(cached.data).length) return { data: cached.data, status: { mode: "cache", as_of: cached.asOf, error } };
    return { data: {}, status: { mode: "unavailable", as_of: null, error } };
  }
}
