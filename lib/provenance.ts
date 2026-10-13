import {
  METHODOLOGY_BY_KEY,
  METHODOLOGY_COMPONENTS,
  PILLAR_KEYS,
} from "./methodology";
import type {
  Country,
  CountryCoverage,
  CountryProvenance,
  ScoreComponentProvenance,
} from "./types";

export function buildCoverage(provenance: CountryProvenance): CountryCoverage {
  const components = PILLAR_KEYS.flatMap((pillar) => provenance[pillar]);
  const expected = components.filter(
    (item) => METHODOLOGY_BY_KEY.get(item.key)?.countsTowardCoverage,
  );
  const liveIndicators = expected.filter((item) => item.status === "live").length;
  const enrichedIndicators = expected.filter(
    (item) => item.status === "enriched",
  ).length;
  const policyIndicators = expected.filter(
    (item) => item.status === "policy" && item.value !== null,
  ).length;
  const fallbackComponents = expected.filter(
    (item) => item.status === "fallback",
  ).length;
  const fallbackShare = Math.round(
    components
      .filter((item) => item.status === "fallback")
      .reduce((sum, item) => sum + item.pointsAvailable, 0),
  );
  const liveYears = expected
    .filter((item) => item.status === "live" && item.year !== null)
    .map((item) => item.year as number);
  const expectedIndicators = expected.length;
  const observedRatio =
    expectedIndicators === 0
      ? 0
      : (liveIndicators + enrichedIndicators) / expectedIndicators;
  const label =
    observedRatio >= 0.75 && fallbackShare <= 30
      ? "High"
      : observedRatio >= 0.5 && fallbackShare <= 55
        ? "Medium"
        : "Limited";

  return {
    label,
    liveIndicators,
    expectedIndicators,
    enrichedIndicators,
    policyIndicators,
    fallbackComponents,
    fallbackShare,
    oldestYear: liveYears.length > 0 ? Math.min(...liveYears) : null,
    newestYear: liveYears.length > 0 ? Math.max(...liveYears) : null,
  };
}

export function buildStaticProvenance(country: Country): CountryProvenance {
  return Object.fromEntries(
    PILLAR_KEYS.map((pillar) => {
      const staticScore = country.scores[pillar].score;
      const components: ScoreComponentProvenance[] = METHODOLOGY_COMPONENTS
        .filter(
          (item) =>
            item.pillar === pillar &&
            (item.pointsAvailable > 0 || item.countsTowardCoverage),
        )
        .map((item) => ({
          key: item.key,
          label: item.label,
          pillar,
          source: item.source,
          sourceUrl: item.sourceUrl,
          indicatorCode: item.indicatorCode,
          value: null,
          unit: item.unit,
          year: null,
          pointsEarned: (staticScore / 20) * item.pointsAvailable,
          pointsAvailable: item.pointsAvailable,
          status: "fallback" as const,
          substitution:
            item.pointsAvailable > 0
              ? `${item.label} unavailable; used ${item.pointsAvailable}/20 of the static ${item.pillar === "economic_readiness" ? "Economic Readiness" : item.pillar[0].toUpperCase() + item.pillar.slice(1)} baseline.`
              : `${item.label} unavailable; no score adjustment was applied.`,
        }));
      return [pillar, components];
    }),
  ) as CountryProvenance;
}
