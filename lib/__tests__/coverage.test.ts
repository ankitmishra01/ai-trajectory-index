import { describe, expect, it } from "vitest";

import { METHODOLOGY_COMPONENTS, PILLAR_KEYS } from "@/lib/methodology";
import { asFallbackScoredCountry, buildCoverage } from "@/lib/provenance";
import countriesData from "@/data/countries.json";
import type {
  CountryProvenance,
  PillarKey,
  ProvenanceStatus,
  ScoreComponentProvenance,
} from "@/lib/types";

const WORLD_BANK_CODES = [
  "IT.NET.USER.ZS",
  "IT.CEL.SETS.P2",
  "IT.NET.BBN.P2",
  "SE.TER.ENRR",
  "SL.GDP.PCAP.EM.KD",
  "GB.XPD.RSDV.GD.ZS",
  "EG.ELC.ACCS.ZS",
  "GE.EST",
  "RL.EST",
  "RQ.EST",
  "BX.KLT.DINV.WD.GD.ZS",
  "NY.GDP.PCAP.PP.KD",
  "NY.GDP.PCAP.CD",
  "FS.AST.PRVT.GD.ZS",
  "NE.TRD.GNFS.ZS",
  "NV.SRV.TOTL.ZS",
  "TX.VAL.TECH.MF.ZS",
] as const;

describe("methodology registry", () => {
  it("defines a complete 20-point budget for each pillar", () => {
    expect(PILLAR_KEYS).toHaveLength(5);
    expect(new Set(METHODOLOGY_COMPONENTS.map((item) => item.key)).size).toBe(
      METHODOLOGY_COMPONENTS.length,
    );

    for (const pillar of PILLAR_KEYS) {
      const budget = METHODOLOGY_COMPONENTS
        .filter((item) => item.pillar === pillar)
        .reduce((sum, item) => sum + item.pointsAvailable, 0);
      expect(budget).toBe(20);
    }
  });

  it("uses official secure source links and registers every World Bank series", () => {
    expect(
      METHODOLOGY_COMPONENTS.every((item) => item.sourceUrl.startsWith("https://")),
    ).toBe(true);

    const registeredCodes = new Set(
      METHODOLOGY_COMPONENTS.flatMap((item) =>
        item.indicatorCode ? [item.indicatorCode] : [],
      ),
    );

    for (const code of WORLD_BANK_CODES) {
      expect(registeredCodes.has(code), `Missing World Bank series ${code}`).toBe(true);
    }
  });
});

const emptyProvenance = (): CountryProvenance => ({
  infrastructure: [],
  talent: [],
  governance: [],
  investment: [],
  economic_readiness: [],
});

const coverageComponent = (
  key: string,
  status: ProvenanceStatus,
  pointsAvailable: number,
  year: number | null = null,
): ScoreComponentProvenance => ({
  key,
  label: key,
  pillar: "infrastructure" as PillarKey,
  source: "Test source",
  sourceUrl: "https://example.com",
  indicatorCode: null,
  value: status === "fallback" ? null : 1,
  unit: null,
  year,
  pointsEarned: 0,
  pointsAvailable,
  status,
  substitution: status === "fallback" ? "Test substitution" : null,
});

describe("buildCoverage", () => {
  it("uses the inclusive High boundary and reports live observation years", () => {
    const provenance = emptyProvenance();
    provenance.infrastructure = [
      coverageComponent("fixed_broadband", "live", 10, 2022),
      coverageComponent("internet_users", "live", 10, 2024),
      coverageComponent("mobile_subscriptions", "enriched", 10),
      coverageComponent("electricity_access", "fallback", 0),
      coverageComponent("infrastructure_quality", "fallback", 30),
    ];

    expect(buildCoverage(provenance)).toEqual({
      label: "High",
      liveIndicators: 2,
      expectedIndicators: 4,
      enrichedIndicators: 1,
      policyIndicators: 0,
      fallbackComponents: 1,
      fallbackShare: 30,
      oldestYear: 2022,
      newestYear: 2024,
    });
  });

  it("uses the inclusive Medium boundary and leaves absent years null", () => {
    const provenance = emptyProvenance();
    provenance.infrastructure = [
      coverageComponent("fixed_broadband", "live", 10),
      coverageComponent("internet_users", "enriched", 10),
      coverageComponent("mobile_subscriptions", "fallback", 25),
      coverageComponent("electricity_access", "fallback", 0),
      coverageComponent("infrastructure_quality", "fallback", 30),
    ];
    provenance.governance = [
      coverageComponent("national_ai_strategy", "policy", 0),
    ];
    provenance.talent = [coverageComponent("oecd_researchers", "enriched", 0)];

    expect(buildCoverage(provenance)).toEqual({
      label: "Medium",
      liveIndicators: 1,
      expectedIndicators: 6,
      enrichedIndicators: 2,
      policyIndicators: 1,
      fallbackComponents: 2,
      fallbackShare: 55,
      oldestYear: null,
      newestYear: null,
    });
  });

  it("returns Limited when observed coverage falls below half", () => {
    const provenance = emptyProvenance();
    provenance.infrastructure = [
      coverageComponent("fixed_broadband", "live", 10),
      coverageComponent("internet_users", "fallback", 10),
      coverageComponent("mobile_subscriptions", "fallback", 10),
      coverageComponent("electricity_access", "fallback", 10),
    ];

    expect(buildCoverage(provenance).label).toBe("Limited");
  });
});

describe("asFallbackScoredCountry", () => {
  it("creates a complete Limited-coverage object for immediate rendering", () => {
    const fallback = asFallbackScoredCountry(countriesData.countries[0]);

    expect(fallback.data_source).toBe("fallback");
    expect(fallback.wb_data_year).toBeNull();
    expect(fallback.coverage).toMatchObject({
      label: "Limited",
      liveIndicators: 0,
      oldestYear: null,
      newestYear: null,
      fallbackShare: 100,
    });
    expect(Object.keys(fallback.provenance)).toEqual(PILLAR_KEYS);
  });
});
