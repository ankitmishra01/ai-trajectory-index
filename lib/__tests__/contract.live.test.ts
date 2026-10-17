// Contract tests against the real public APIs. They catch silent upstream changes
// (archived indicator codes, pagination, new response shapes) that fixture tests cannot.
// Run with: LIVE_CONTRACT=1 npx vitest run lib/__tests__/contract.live.test.ts
import { describe, expect, it } from "vitest";
import { fetchIndicatorPoints, groupPoints } from "@/lib/worldbank";

const live = process.env.LIVE_CONTRACT === "1";

describe.skipIf(!live)("World Bank live contract", () => {
  it("returns every page of internet users, including the United States", async () => {
    const grouped = groupPoints(await fetchIndicatorPoints("IT.NET.USER.ZS"));
    expect(Object.keys(grouped).length).toBeGreaterThan(180);
    expect(grouped.US?.current).not.toBeNull();
  }, 60_000);

  it("serves current WGI estimates for the United States", async () => {
    for (const code of ["GOV_WGI_RL.EST", "GOV_WGI_GE.EST", "GOV_WGI_RQ.EST"]) {
      const grouped = groupPoints(await fetchIndicatorPoints(code));
      expect(grouped.US?.current, code).not.toBeNull();
      expect(Object.keys(grouped).length, code).toBeGreaterThan(150);
    }
  }, 90_000);

  it("rejects an archived indicator code instead of returning empty data", async () => {
    await expect(fetchIndicatorPoints("RL.EST")).rejects.toThrow(/World Bank API error/);
  }, 30_000);
});
