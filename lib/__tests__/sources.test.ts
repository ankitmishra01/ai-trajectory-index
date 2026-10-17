import { describe, expect, it } from "vitest";
import { groupPoints, worldBankError } from "@/lib/worldbank";
import { latestActual } from "@/lib/imf";
import { parseSDMX } from "@/lib/oecd";
import countriesData from "@/data/countries.json";
import usage from "@/data/anthropic-usage.json";

describe("World Bank client", () => {
  it("treats a 200 response carrying an error message as a failure", () => {
    const archived = [{ message: [{ id: "175", key: "Invalid format", value: "The indicator was not found. It may have been deleted or archived." }] }];
    expect(worldBankError(archived)).toMatch(/not found/);
    expect(worldBankError([{ page: 1, pages: 1 }, null])).toMatch(/no data array/);
    expect(worldBankError([{ page: 1, pages: 2 }, []])).toBeNull();
  });

  it("groups newest-first values per country and skips rows without an ISO code", () => {
    const grouped = groupPoints([
      { country: { id: "US" }, value: 0.99, date: "2024" },
      { country: { id: "US" }, value: 0.79, date: "2025" },
      { country: { id: "" }, value: 0.64, date: "2025" },
      { country: { id: "FR" }, value: null, date: "2025" },
    ]);
    expect(grouped.US).toEqual({ current: 0.79, previous: 0.99, year: 2025 });
    expect(Object.keys(grouped)).toEqual(["US"]);
  });
});

describe("IMF client", () => {
  it("ignores projection years after the cutoff", () => {
    expect(latestActual({ "2023": 36.8, "2024": 37.9, "2025": 38.1, "2031": 38.6 }, 2025)).toEqual({ current: 38.1, previous: 37.9, year: 2025 });
    expect(latestActual({ "2030": 50 }, 2025)).toEqual({ current: null, previous: null, year: null });
  });
});

describe("OECD client", () => {
  it("parses SDMX-JSON 2.0 responses that use `structures`", () => {
    const json = {
      data: {
        dataSets: [{ series: { "0:0": { observations: { "0": [3.2], "1": [3.4] } } } }],
        structures: [{ dimensions: { series: [{ id: "REF_AREA", values: [{ id: "USA" }] }, { id: "FREQ", values: [{ id: "A" }] }], observation: [{ id: "TIME_PERIOD", values: [{ id: "2022" }, { id: "2023" }] }] } }],
      },
    };
    expect(parseSDMX(json)).toEqual({ USA: { current: 3.4, previous: 3.2, year: 2023 } });
  });
});

describe("static baseline consistency", () => {
  const label = (t: number) => (t >= 6 ? "Strong Positive" : t >= 2 ? "Positive" : t >= -1 ? "Neutral" : t >= -5 ? "Negative" : "Strong Negative");
  it("projects 2028 as total + trajectory × 1.5 and labels trajectories by rule", () => {
    for (const c of countriesData.countries) {
      expect(c.projected_score_2028).toBe(Math.min(100, Math.max(0, Math.round(c.total_score + c.trajectory_score * 1.5))));
      expect(c.trajectory_label).toBe(label(c.trajectory_score));
    }
  });
  it("carries ISO2 and ISO3 codes for every economy", () => {
    for (const c of countriesData.countries as { iso2?: string; iso3?: string }[]) {
      expect(c.iso2).toMatch(/^[A-Z]{2}$/);
      expect(c.iso3).toMatch(/^[A-Z]{3}$/);
    }
  });
});

describe("Anthropic usage file", () => {
  it("is dated and holds 0-100 indices keyed by ISO3", () => {
    expect(usage.period.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const values = Object.entries(usage.values as Record<string, { index: number }>);
    expect(values.length).toBeGreaterThan(50);
    for (const [iso3, v] of values) {
      expect(iso3).toMatch(/^[A-Z]{3}$/);
      expect(v.index).toBeGreaterThanOrEqual(0);
      expect(v.index).toBeLessThanOrEqual(100);
    }
  });
});
