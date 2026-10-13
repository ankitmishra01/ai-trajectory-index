# Provenance, Confidence, and Research UI Design

Date: 2026-10-13  
Status: Proposed  
Scope: scoring transparency, methodology, country-page hierarchy, and homepage loading  
Canonical deployment: https://ai-trajectory-index.vercel.app

## Purpose

Make the AI Trajectory Index auditable as a research product without changing its scores, indicators, thresholds, weights, or source data. A reader should be able to trace every country pillar score to its inputs, understand data coverage, distinguish live data from maintained enrichment and fallback values, and download the methodology in a reusable format.

The interface should remain useful for investors, policymakers, and researchers. Research detail must be available on demand without turning the primary country view into a technical appendix.

## Success criteria

1. Every scored country returned by `/api/scores` includes exact component-level provenance for all five readiness pillars.
2. The sum of recorded component contributions reproduces each pillar's pre-rounded calculation and final score.
3. Existing country totals, trajectory values, rankings, and projections remain unchanged for identical inputs.
4. Each country reports live-indicator count, total expected inputs, oldest and newest observation years, fallback share, and a High, Medium, or Limited coverage label.
5. The country page exposes provenance and confidence without adding another long sequence of equally prominent cards.
6. The Methodology page becomes a compact reference instrument backed by the same metadata registry used for its CSV download.
7. The homepage renders static baseline rankings immediately and upgrades them quietly when live scores arrive.
8. Existing routes, URL state, widget output, exports, and API fields remain backward-compatible.

## Non-goals

- Changing the readiness or trajectory methodology.
- Re-scoring the curated Adoption dataset.
- Replacing maintained static baselines with a new statistical model.
- Adding authentication, accounts, paid services, or new API keys.
- Presenting coverage as statistical confidence or predictive probability.

## Architecture

### Shared methodology registry

Create `lib/methodology.ts` as the single descriptive registry for readiness inputs. It contains stable metadata only:

- pillar and display order
- component key and label
- source organization and source URL
- indicator code where one exists
- point allocation
- unit and formatting rule
- threshold summary
- source kind: `live`, `maintained`, or `fallback`
- short methodology note

The registry does not calculate scores. `lib/scoring.ts` remains the formula authority. The Methodology page and CSV generator consume this registry so labels, links, codes, and allocations cannot drift independently.

### Provenance calculation

Refactor each private pillar scorer in `lib/scoring.ts` to return a structured result rather than only a number:

```ts
interface PillarCalculation {
  score: number;
  rawPoints: number;
  components: ScoreComponentProvenance[];
}
```

Each component is recorded at the exact branch where points are awarded. This avoids rebuilding or approximating the formula in a second explainability layer.

```ts
type ProvenanceStatus = "live" | "enriched" | "fallback" | "policy";

interface ScoreComponentProvenance {
  key: string;
  label: string;
  pillar: PillarKey;
  source: string;
  sourceUrl: string;
  indicatorCode: string | null;
  value: number | boolean | null;
  unit: string | null;
  year: number | null;
  pointsEarned: number;
  pointsAvailable: number;
  status: ProvenanceStatus;
  substitution: string | null;
}
```

Status meanings:

- `live`: fetched from World Bank, IMF, OECD, or the public Anthropic dataset during the scoring request.
- `enriched`: maintained external-index value from `external-indices.json`.
- `policy`: maintained national-policy value from `ai-policies.json`.
- `fallback`: points derived from a country's static baseline because the preferred input was unavailable, including the residual static proxy intentionally retained by the methodology.

The API will not call a maintained file value “live.”

### API additions

Extend `ScoredCountry` without removing or renaming existing fields:

```ts
interface CountryCoverage {
  label: "High" | "Medium" | "Limited";
  liveIndicators: number;
  expectedIndicators: number;
  enrichedIndicators: number;
  policyIndicators: number;
  fallbackComponents: number;
  fallbackShare: number;
  oldestYear: number | null;
  newestYear: number | null;
}

interface CountryProvenance {
  infrastructure: ScoreComponentProvenance[];
  talent: ScoreComponentProvenance[];
  governance: ScoreComponentProvenance[];
  investment: ScoreComponentProvenance[];
  economic_readiness: ScoreComponentProvenance[];
}
```

New `ScoredCountry` fields:

```ts
coverage: CountryCoverage;
provenance: CountryProvenance;
```

`ScoresResponse` keeps all existing properties and its existing `sources` object. Static countries used before the request resolves receive generated fallback provenance and coverage so components never need null checks for the complete object.

## Coverage calculation

Coverage describes source availability, not the country's readiness quality.

### Denominator

`expectedIndicators` counts externally sourced readiness components that can carry a country-specific observation:

- Infrastructure: broadband, internet, mobile, electricity
- Talent: tertiary enrolment, labour productivity, OECD researchers, WIPO GII
- Governance: three WGI indicators, national AI strategy, strategy year, AI regulation, Oxford Insights
- Investment: R&D expenditure, FDI, IMF government expenditure
- Economic Readiness: GDP PPP, private credit, trade openness, services share, IMF government debt

Intentional residual static proxy components are included in fallback-share points but not in `expectedIndicators`, because no live replacement is defined for those residual allocations.

### Counts and years

- `liveIndicators` counts available values fetched during the request.
- `enrichedIndicators` counts available maintained external-index values.
- `policyIndicators` counts populated maintained policy components.
- `fallbackComponents` counts expected components for which fallback points were used.
- `oldestYear` and `newestYear` use dated live observations only. Maintained inputs without a reliable observation year do not fabricate one.

### Fallback share

`fallbackShare` is the percentage of the 100-point readiness score budget awarded through static baseline allocations:

```text
fallbackShare = round((fallback points available / 100) × 100)
```

The denominator uses allocated points, not points earned. This measures methodological dependence on fallbacks independently of whether the country scores well or poorly.

### Coverage labels

- **High:** at least 75% of expected indicators are live or enriched and fallback share is at most 30%.
- **Medium:** at least 50% of expected indicators are live or enriched and fallback share is at most 55%.
- **Limited:** all other cases.

Policy values count in the displayed breakdown but not in the live-or-enriched ratio. Tooltips explicitly say that the labels measure coverage, not certainty or data quality.

## Country-page information architecture

Retain the desktop country switcher and mobile drawer. Reorganize the main column into five primary sections:

### 1. Executive summary

- Country identity, rank, readiness score, trajectory, projected 2028 score
- One direct summary sentence
- Coverage badge with live count, date range, and fallback share
- Readiness and Adoption lens switch

### 2. Readiness and Adoption

- Readiness and Adoption summary scores
- Radar visualization with three explicit states:
  - loading skeleton matching final chart dimensions
  - chart available
  - unavailable message plus accessible comparison table
- Pillar and adoption bars

### 3. Pillar evidence

- Five compact pillar rows with score and evidence summary
- Expandable “View score inputs” disclosure for each pillar
- Provenance table columns: Input, Value, Year, Source, Contribution, Status
- Status chips use text and icons, never color alone
- Missing substitutions state what was unavailable and which baseline allocation replaced it

### 4. Outlook and policy gaps

- Trajectory and projected 2028 score
- Accelerator and risk
- Policy-gap analysis
- Five-section country brief
- Roadmap remains available but is visually subordinate within this section

### 5. News and supporting tools

- News signal and headlines
- Comparable countries
- A collapsed `Analysis tools` disclosure containing What-if Simulator, AI chat, embed, print, and technical controls

On mobile, primary sections remain in this order. Secondary tools default closed. On desktop, the summary/coverage panel may remain sticky while the content column scrolls, but no new permanent rail is added beside the existing country switcher.

## Methodology research instrument

Replace the source-card narrative with a compact reference page in this order:

1. **Formula overview:** Readiness, Trajectory, projected 2028, and Adoption separation.
2. **Pillar-weight table:** each component, allocation, preferred source, and fallback behavior.
3. **Indicator data dictionary:** searchable/filterable table generated from `lib/methodology.ts`.
4. **Source-precedence diagram:** a semantic CSS flow showing live input, maintained enrichment, proportional fallback, pillar rounding, and total score.
5. **Missing-data policy:** exact substitution rules and coverage-label definitions.
6. **Limitations:** threshold sensitivity, uneven years, expert-judgment baselines, projection limits, and Adoption's curated nature.
7. **Downloads and citation:** methodology CSV, README methodology, source code, and citation action.

The page must distinguish direct scoring sources from calibration-only references. Source links must use official URLs from the corrected README.

### Methodology CSV

Add `app/api/methodology.csv/route.ts`, or an equivalent static download route, returning UTF-8 CSV with a content-disposition filename such as `ai-trajectory-index-methodology-v3.csv`.

Columns:

```text
pillar,component_key,component,source,source_url,indicator_code,unit,
points_available,source_kind,threshold_rule,fallback_rule,notes
```

CSV values are escaped according to RFC 4180. The route is deterministic and requires no network access.

PDF generation is out of scope because it would add layout maintenance and a rendering dependency. The methodology page itself receives print styles so users can save a clean PDF through the browser.

## Homepage initial rendering

The homepage already initializes `countries` from `countries.json` but hides those values behind a `loading` branch. Remove that visual gate.

- Render the complete baseline ranking on the first client render.
- Keep `loading` only as a background refresh state.
- Replace the skeleton grid with a compact “Refreshing with live sources” status beside freshness metadata.
- When the request succeeds, replace the dataset without resetting filters, view, compare list, scroll, or layout dimensions.
- When it fails, retain baseline data and show “Baseline data shown; live refresh unavailable” with a retry action.
- Regional summaries and ranking controls render immediately from baseline data.
- Preserve URL query initialization and avoid changing the sort/filter contract.

## Error, loading, and empty states

- Provenance unavailable: show the existing pillar score and a short explanation that detailed inputs could not be loaded.
- Coverage year unavailable: show “Year not reported,” never zero or the current year.
- Methodology CSV failure: return a clear HTTP error and keep the page links usable.
- Live homepage refresh failure: baseline remains interactive and receives an inline retry control.
- Radar data unavailable: show the accessible pillar table in the chart frame.
- All disclosures support keyboard activation and visible focus states.

## Accessibility

- Use semantic headings beginning with one `h1` per page.
- Provenance tables include captions and scoped column headers.
- Charts receive concise `aria-label` summaries and equivalent tabular content.
- Coverage and status never rely on color alone.
- Interactive targets are at least 44 by 44 CSS pixels on touch layouts.
- Disclosures expose `aria-expanded` and `aria-controls`.
- Print styles preserve tables and source URLs.
- Reduced-motion behavior remains respected.

## Performance

- No new runtime dependency.
- Provenance is calculated in the existing scoring pass.
- The methodology registry is static and tree-shakeable.
- Country provenance is returned in `/api/scores`; no per-pillar follow-up requests are introduced.
- If payload growth is excessive, compact repeated source metadata through registry keys before considering a new endpoint. The initial target is a gzipped `/api/scores` response below 500 KB.
- Heavy charts remain lazy-loaded or isolated from the first meaningful content.

## Compatibility

- Preserve every existing `ScoredCountry` and `ScoresResponse` field.
- Preserve `/api/scores`, country slugs, compare routes, query parameters, widget markup contract, and exports.
- Do not add provenance columns to existing CSV/JSON country exports without an explicit user selection.
- Keep OpenRouter optional and retain deterministic narratives.
- Keep `countries.json`, policy data, adoption data, indicators, scoring weights, and thresholds unchanged.

## Testing and verification

### Calculation tests

- Every threshold boundary and adjacent value for each live indicator.
- Missing-value substitution for every component.
- OECD, IMF, WIPO, and Oxford replacement precedence.
- Provenance points sum to `rawPoints` and round to the existing pillar score.
- Total, trajectory, and projection remain identical before and after refactoring for all 186 static fixtures and representative live fixtures.
- Coverage labels at every boundary.
- Oldest/newest year behavior with partial and absent dates.
- Methodology CSV escaping and column completeness.

### UI tests

- Baseline countries are visible before `/api/scores` resolves.
- Successful refresh preserves filters and scroll state.
- Failed refresh keeps baseline content and exposes retry.
- Pillar disclosures are keyboard-operable.
- Radar loading and unavailable states occupy stable dimensions.
- Analysis tools default closed on mobile.

### Release verification

- `npm run lint` and `npm run build` pass.
- Compare pre-refactor and post-refactor score snapshots for all countries.
- Capture 390, 768, and 1440 screenshots for home, methodology, and leading/limited-coverage country pages.
- Verify canonical production routes and `/api/scores` in a browser with no console errors.
- Confirm the methodology CSV downloads with the correct content type and filename.
- Inspect the Vercel build log and roll back if production behavior regresses.

## Documentation

Update README.md and CLAUDE.md with:

- provenance and coverage API fields
- coverage-label definition
- methodology registry ownership
- CSV download route
- homepage baseline-first loading behavior
- explicit statement that coverage is not statistical confidence

No edition or methodology-version bump is required because the scoring formula does not change. The release notes should describe this as an explainability and research-interface update.
