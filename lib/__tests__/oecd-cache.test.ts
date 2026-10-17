import { describe, expect, it } from "vitest";
import { fetchOECDDataWithStatus } from "@/lib/oecd-cache";

const sample = { USA: { rd_expenditure: { current: 3.4, previous: 3.2, year: 2023 }, researchers: { current: 10, previous: 9, year: 2023 } } };

describe("OECD with dated cache fallback", () => {
  it("reports live when the gateway answers", async () => {
    const r = await fetchOECDDataWithStatus(async () => sample, () => ({ data: {}, asOf: null }));
    expect(r.status.mode).toBe("live");
    expect(r.data).toEqual(sample);
  });
  it("serves the dated cache, and says so, when the gateway rate-limits", async () => {
    const r = await fetchOECDDataWithStatus(async () => { throw new Error("OECD API error: 429"); }, () => ({ data: sample, asOf: "2026-10-17T16:03:39.312Z" }));
    expect(r.status).toEqual({ mode: "cache", as_of: "2026-10-17T16:03:39.312Z", error: "OECD API error: 429" });
    expect(r.data.USA.rd_expenditure.current).toBe(3.4);
  });
  it("is unavailable (not live) when both fail", async () => {
    const r = await fetchOECDDataWithStatus(async () => { throw new Error("down"); }, () => ({ data: {}, asOf: null }));
    expect(r.status.mode).toBe("unavailable");
    expect(r.data).toEqual({});
  });
});
