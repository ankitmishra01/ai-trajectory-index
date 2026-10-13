import { describe, expect, it } from "vitest";

import { METHODOLOGY_COMPONENTS, PILLAR_KEYS } from "@/lib/methodology";

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
