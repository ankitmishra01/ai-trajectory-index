import { describe, expect, it } from "vitest";

import countriesData from "@/data/countries.json";
import { calculateScores, type ExternalIndices, type PolicyData } from "@/lib/scoring";
import type { Country, CountryCoverage, CountryProvenance } from "@/lib/types";
import type { IMFData } from "@/lib/imf";
import type { OECDData } from "@/lib/oecd";
import type { IndicatorValues, WorldBankData } from "@/lib/worldbank";

const countries = countriesData.countries as Country[];
const usa = countries.find((country) => country.slug === "usa")!;

const indicator = (
  current: number | null,
  previous: number | null = null,
  year: number | null = current === null ? null : 2024,
): IndicatorValues => ({ current, previous, year });

const completeWorldBank: WorldBankData = {
  US: {
    internet: indicator(90),
    mobile: indicator(130),
    broadband: indicator(40, 37),
    tertiary: indicator(75),
    labor_productivity: indicator(100_000, 90_000),
    rd: indicator(4, 3.5),
    electricity: indicator(99),
    gov_effectiveness: indicator(2.5),
    rule_of_law: indicator(2.5),
    regulatory_quality: indicator(2.5),
    fdi: indicator(11),
    gdp_ppp: indicator(60_000),
    gdp: indicator(100, 90),
    private_credit: indicator(160),
    trade_openness: indicator(130),
    services_share: indicator(80),
    hightech_exports: indicator(20, 15),
  },
};

const completePolicies: Record<string, PolicyData> = {
  usa: {
    has_national_ai_strategy: true,
    strategy_year: 2025,
    has_ai_regulation: true,
    oecd_member: true,
  },
};

const completeImf: IMFData = {
  USA: {
    govt_expenditure: indicator(50, null, 2024),
    govt_debt: indicator(50, null, 2024),
  },
};

const completeOecd: OECDData = {
  USA: {
    rd_expenditure: indicator(4, null, 2023),
    researchers: indicator(11, null, 2023),
  },
};

const completeExternal: ExternalIndices = {
  countries: {
    usa: {
      oxford_insights: 70,
      stanford_hai: null,
      tortoise: null,
      wipo_gii: 60,
      wef_gci: null,
      itu_idi: null,
    },
  },
};

const emptyExternal: ExternalIndices = { countries: {} };

const score = (
  wbData: WorldBankData,
  policies: Record<string, PolicyData> = {},
  imfData: IMFData = {},
  oecdData: OECDData = {},
  anthropicData: Record<string, number> = {},
  externalIndices: ExternalIndices = emptyExternal,
) =>
  calculateScores(
    usa,
    "US",
    "USA",
    wbData,
    policies,
    imfData,
    oecdData,
    anthropicData,
    externalIndices,
  );

const readinessSnapshot = (country: ReturnType<typeof calculateScores>) => ({
  infrastructure: country.scores.infrastructure.score,
  talent: country.scores.talent.score,
  governance: country.scores.governance.score,
  investment: country.scores.investment.score,
  economicReadiness: country.scores.economic_readiness.score,
  total: country.total_score,
  trajectory: country.trajectory_score,
  projected: country.projected_score_2028,
});

describe("calculateScores score preservation", () => {
  it("keeps literal results for complete source data", () => {
    const result = score(
      completeWorldBank,
      completePolicies,
      completeImf,
      completeOecd,
      { USA: 70 },
      completeExternal,
    );

    expect(readinessSnapshot(result)).toEqual({
      infrastructure: 20,
      talent: 20,
      governance: 20,
      investment: 20,
      economicReadiness: 20,
      total: 100,
      trajectory: 10,
      projected: 100,
    });
  });

  it("keeps literal results for partial source data", () => {
    const partial = { ...completeWorldBank.US };
    for (const key of Object.keys(partial) as (keyof typeof partial)[]) {
      partial[key] = indicator(null);
    }
    partial.internet = indicator(65, null, 2022);

    expect(readinessSnapshot(score({ US: partial }))).toEqual({
      infrastructure: 18,
      talent: 20,
      governance: 10,
      investment: 20,
      economicReadiness: 18,
      total: 86,
      trajectory: 4,
      projected: 92,
    });
  });

  it("characterizes empty-source output for every static country", () => {
    const results = countries.map((country) => {
      const result = calculateScores(country, "", "", {}, {}, {}, {}, {}, emptyExternal);
      return [country.slug, readinessSnapshot(result)];
    });

    expect(results).toMatchSnapshot();
  });
});

describe("calculateScores provenance", () => {
  it("returns five auditable pillar component collections", () => {
    const result = score(
      completeWorldBank,
      completePolicies,
      completeImf,
      completeOecd,
      { USA: 70 },
      completeExternal,
    ) as ReturnType<typeof calculateScores> & { provenance?: CountryProvenance };

    expect(result.provenance).toBeDefined();
    expect(Object.keys(result.provenance ?? {})).toEqual([
      "infrastructure",
      "talent",
      "governance",
      "investment",
      "economic_readiness",
    ]);
  });

  it("preserves strict World Bank and inclusive enrichment boundaries", () => {
    const boundaryWorldBank = { ...completeWorldBank.US };
    for (const key of Object.keys(boundaryWorldBank) as (keyof typeof boundaryWorldBank)[]) {
      boundaryWorldBank[key] = indicator(null);
    }
    boundaryWorldBank.internet = indicator(85, null, 2021);

    const result = score(
      { US: boundaryWorldBank },
      completePolicies,
      { USA: { govt_expenditure: indicator(45), govt_debt: indicator(null) } },
      {},
      {},
      { countries: { usa: { ...completeExternal.countries.usa, oxford_insights: 65 } } },
    ) as ReturnType<typeof calculateScores> & {
      provenance: CountryProvenance;
      coverage: CountryCoverage;
    };

    expect(
      result.provenance.infrastructure.find((item) => item.key === "internet_users")
        ?.pointsEarned,
    ).toBe(2.2);
    expect(
      result.provenance.governance.find((item) => item.key === "oxford_readiness"),
    ).toMatchObject({ pointsEarned: 2, status: "enriched" });
    expect(
      result.provenance.investment.find((item) => item.key === "government_expenditure"),
    ).toMatchObject({ pointsEarned: 3, status: "live" });
  });

  it("makes component contributions auditable against every rounded pillar score", () => {
    const result = score(
      completeWorldBank,
      completePolicies,
      completeImf,
      completeOecd,
      { USA: 70 },
      completeExternal,
    ) as ReturnType<typeof calculateScores> & {
      provenance: CountryProvenance;
      coverage: CountryCoverage;
    };

    for (const [pillar, components] of Object.entries(result.provenance)) {
      const rawPoints = components.reduce((sum, item) => sum + item.pointsEarned, 0);
      expect(Math.round(rawPoints), `${pillar} contributions`).toBe(
        result.scores[pillar as keyof Country["scores"]].score,
      );
    }
    expect(
      result.provenance.governance.filter((item) => item.status === "policy"),
    ).toHaveLength(3);
    expect(result.coverage).toMatchObject({
      label: "High",
      oldestYear: 2023,
      newestYear: 2024,
    });
    expect(result).toMatchObject({
      data_source: "live",
      wb_data_year: 2024,
      imf_data: true,
      oecd_data: true,
      anthropic_data: true,
      raw_indicators: expect.any(Object),
      scores: expect.any(Object),
    });
    expect(JSON.stringify(result)).not.toContain("undefined");
  });
});
