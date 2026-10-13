import { describe, expect, it } from "vitest";

import {
  createHomeRefreshState,
  homeRefreshReducer,
} from "@/lib/homeRefresh";
import { asFallbackScoredCountry } from "@/lib/provenance";
import countriesData from "@/data/countries.json";

const baseline = countriesData.countries.slice(0, 2).map(asFallbackScoredCountry);

describe("homeRefreshReducer", () => {
  it("replaces baseline countries after a successful live refresh", () => {
    const initial = createHomeRefreshState(baseline);
    const live = baseline.map((country) => ({ ...country, data_source: "live" as const }));
    const next = homeRefreshReducer(initial, {
      type: "success",
      countries: live,
      lastUpdated: "2026-10-13T20:00:00.000Z",
      usingLive: true,
    });

    expect(next.status).toBe("live");
    expect(next.countries).toBe(live);
    expect(next.countries).toHaveLength(2);
  });

  it("keeps baseline countries available after refresh failure", () => {
    const next = homeRefreshReducer(createHomeRefreshState(baseline), {
      type: "error",
      message: "Network unavailable",
    });

    expect(next.status).toBe("baseline-error");
    expect(next.countries).toBe(baseline);
    expect(next.countries).toHaveLength(2);
  });

  it("retries without clearing countries or unrelated page state", () => {
    const failed = homeRefreshReducer(createHomeRefreshState(baseline), {
      type: "error",
      message: "Network unavailable",
    });
    const retrying = homeRefreshReducer(failed, { type: "refresh" });

    expect(retrying.status).toBe("refreshing");
    expect(retrying.countries).toBe(baseline);
    expect(retrying.error).toBeNull();
  });
});
