import type { CountryCoverage } from "@/lib/types";

export default function CoverageBadge({ coverage }: { coverage: CountryCoverage }) {
  const yearText = coverage.oldestYear === null || coverage.newestYear === null
    ? "Year not reported"
    : coverage.oldestYear === coverage.newestYear
      ? `Observation year ${coverage.oldestYear}`
      : `Observation years ${coverage.oldestYear} to ${coverage.newestYear}`;
  const accessibleLabel = `${coverage.label} data coverage. ${coverage.liveIndicators} live indicators. ${yearText}. ${coverage.fallbackShare} percent fallback allocation.`;

  return (
    <div className={`coverage-badge coverage-${coverage.label.toLowerCase()}`} aria-label={accessibleLabel}>
      <div className="coverage-badge-topline">
        <span className="coverage-dot" aria-hidden="true" />
        <strong>{coverage.label} coverage</strong>
        <span className="coverage-info" tabIndex={0} aria-label="Coverage describes source availability, not statistical certainty.">i
          <span role="tooltip">Coverage describes source availability, not statistical certainty.</span>
        </span>
      </div>
      <dl>
        <div><dt>Live</dt><dd>{coverage.liveIndicators}/{coverage.expectedIndicators}</dd></div>
        <div><dt>Years</dt><dd>{coverage.oldestYear === null || coverage.newestYear === null ? "Not reported" : coverage.oldestYear === coverage.newestYear ? coverage.oldestYear : `${coverage.oldestYear}–${coverage.newestYear}`}</dd></div>
        <div><dt>Fallback</dt><dd>{coverage.fallbackShare}%</dd></div>
      </dl>
    </div>
  );
}
