# Provenance, Confidence, and Research UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exact component-level score provenance and coverage indicators, rebuild Methodology as a compact research reference, simplify the country page, and render homepage rankings immediately without changing any score.

**Architecture:** Instrument the existing scoring branches so every awarded point emits provenance at the source of truth. A static methodology registry supplies labels, links, threshold copy, and CSV rows but never calculates scores. The API adds backward-compatible `provenance` and `coverage` fields; focused UI components consume them on country and methodology pages while the homepage displays its existing static state during background refresh.

**Tech Stack:** Next.js 14 App Router, TypeScript, React 18, Tailwind CSS, Recharts, Vitest as a development-only scoring regression runner.

**Spec:** `docs/superpowers/specs/2026-10-13-provenance-confidence-research-ui-design.md`

## Global Constraints

- Do not change scoring indicators, thresholds, weights, policy values, country data, Adoption data, or trajectory formulas.
- Preserve all existing URLs, query parameters, API fields, exports, and the `/widget/[slug]` contract.
- Keep `OPENROUTER_API_KEY` optional and retain deterministic country narratives.
- Add no runtime dependency or paid service. Vitest is the only permitted new package and must remain a dev dependency.
- Use the canonical URL `https://ai-trajectory-index.vercel.app`; never restore `ai-index.ankitmishra.ca`.
- Coverage describes source availability, not statistical certainty or country quality.
- Keep the editorial design system and canonical pillar colors consistent across all new UI.
- New interactive controls must be keyboard-operable, visibly focused, and at least 44 by 44 CSS pixels on touch layouts.
- Avoid em dashes in new or edited copy.

## Review Focus

- Exact threshold boundaries must preserve existing strict `>` and inclusive `>=` behavior while emitting the correct points and provenance.
- Partial source failure must retain the correct proportional fallback and must not label maintained policy or external-index data as live.
- Coverage with no dated observations must return null years and display “Year not reported,” never fabricate a year.
- Background homepage refresh failure must leave all baseline rankings, filters, URL state, and comparison controls usable.
- Provenance payload growth must remain reasonable; verify the compressed API response and keep it below the 500 KB target where practical.

---

## File map

**Create**

- `lib/methodology.ts`: descriptive indicator and pillar registry shared by Methodology and CSV output.
- `lib/provenance.ts`: coverage calculation and fallback provenance helpers.
- `lib/homeRefresh.ts`: pure homepage refresh reducer that preserves baseline countries through loading and errors.
- `components/CoverageBadge.tsx`: compact coverage status and tooltip copy.
- `components/PillarProvenance.tsx`: accessible per-pillar disclosure and source table.
- `components/CountrySection.tsx`: consistent primary-section wrapper for the country page.
- `app/api/methodology.csv/route.ts`: deterministic methodology CSV download.
- `lib/__tests__/scoring-provenance.test.ts`: score-preservation and provenance tests.
- `lib/__tests__/coverage.test.ts`: coverage boundaries, years, and fallback-share tests.
- `lib/__tests__/homeRefresh.test.ts`: baseline-first refresh state transitions.
- `app/api/methodology.csv/route.test.ts`: CSV headers, escaping, and registry completeness.
- `vitest.config.ts`: test configuration with the project path alias.

**Modify**

- `package.json`, `package-lock.json`: add Vitest and `npm test`.
- `lib/types.ts`: provenance, coverage, and expanded response types.
- `lib/scoring.ts`: return exact component contributions and coverage without changing scores.
- `app/api/scores/route.ts`: return the new fields and keep existing source status.
- `app/methodology/page.tsx`: replace the long narrative/card sequence with the research instrument.
- `components/CountryPageClient.tsx`: adopt the five-section hierarchy and analysis-tools disclosure.
- `app/country/[slug]/page.tsx`: generate complete fallback provenance for initial static rendering.
- `app/page.tsx`: display baseline data immediately and treat loading as background refresh.
- `app/globals.css`: provenance tables, print rules, stable chart state, and touch targets.
- `README.md`, `CLAUDE.md`: document API additions, coverage meaning, registry, CSV, and loading behavior.

---

### Task 1: Establish test runner, methodology registry, and public types

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/methodology.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `lib/types.ts`
- Test: `lib/__tests__/coverage.test.ts`

**Interfaces:**
- Produces: `PILLAR_KEYS`, `METHODOLOGY_COMPONENTS`, `PILLAR_METADATA`, `PillarKey`, `ProvenanceStatus`, `ScoreComponentProvenance`, `CountryCoverage`, and `CountryProvenance`. The new types remain standalone until Task 3 makes them required on `ScoredCountry`.
- Consumes: existing `Country`, `ScoredCountry`, and `ScoresResponse` shapes from `lib/types.ts`.

- [ ] **Step 1: Add the failing registry completeness test**

Create `lib/__tests__/coverage.test.ts` with a first test asserting that the registry contains all five pillars, unique component keys, point allocations of 20 per pillar, official `https://` source links, and all 17 World Bank indicator codes.

```ts
import { describe, expect, it } from "vitest";
import { METHODOLOGY_COMPONENTS, PILLAR_KEYS } from "@/lib/methodology";

describe("methodology registry", () => {
  it("defines a complete 20-point budget for each pillar", () => {
    expect(new Set(METHODOLOGY_COMPONENTS.map((item) => item.key)).size)
      .toBe(METHODOLOGY_COMPONENTS.length);
    for (const pillar of PILLAR_KEYS) {
      const budget = METHODOLOGY_COMPONENTS
        .filter((item) => item.pillar === pillar)
        .reduce((sum, item) => sum + item.pointsAvailable, 0);
      expect(budget).toBe(20);
    }
  });
});
```

- [ ] **Step 2: Install and configure Vitest**

Run `npm install --save-dev vitest`. Add `"test": "vitest run"` to `package.json`. Create `vitest.config.ts` using `defineConfig`, environment `node`, and alias `@` to the repository root.

- [ ] **Step 3: Run the test and verify it fails**

Run: `npm test -- lib/__tests__/coverage.test.ts`  
Expected: FAIL because `lib/methodology.ts` does not exist.

- [ ] **Step 4: Define the registry and standalone types**

Create the metadata interfaces and entries described by the spec. Use the exact official URLs already verified in README. Represent residual static allocations as registry entries so every pillar budget totals 20. Define these interfaces without changing `ScoredCountry` yet, so this task ends with a compiling tree:

```ts
export type PillarKey = keyof Country["scores"];
export type ProvenanceStatus = "live" | "enriched" | "fallback" | "policy";

export interface ScoreComponentProvenance {
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

- [ ] **Step 5: Run registry tests and type-check**

Run: `npm test -- lib/__tests__/coverage.test.ts && npx tsc --noEmit`  
Expected: tests PASS and TypeScript reports no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/types.ts lib/methodology.ts lib/__tests__/coverage.test.ts
git commit -m "test: establish methodology registry and provenance types"
```

---

### Task 2: Instrument scoring without changing results

**Files:**
- Modify: `lib/scoring.ts`
- Create: `lib/provenance.ts`
- Test: `lib/__tests__/scoring-provenance.test.ts`
- Test: `lib/__tests__/coverage.test.ts`

**Interfaces:**
- Consumes: `METHODOLOGY_COMPONENTS` and the public provenance types from Task 1.
- Produces: `buildCoverage(provenance: CountryProvenance): CountryCoverage`, `buildStaticProvenance(country: Country): CountryProvenance`, and `calculateScores(...)` with populated required fields.

- [ ] **Step 1: Capture a score-regression fixture before refactoring**

Write a test that calls the current public `calculateScores` for representative complete, partial, and empty source inputs. Assert the five pillar scores, total, trajectory, and projection against literal expected values obtained from the existing implementation. Add a dataset-wide test using empty source objects that asserts every one of the 186 results equals its static input score and trajectory.

```ts
expect(result.scores.infrastructure.score).toBe(expected.infrastructure);
expect(result.total_score).toBe(expected.total);
expect(result.trajectory_score).toBe(expected.trajectory);
expect(result.projected_score_2028).toBe(expected.projected);
```

- [ ] **Step 2: Run the regression test against the unmodified scorer**

Run: `npm test -- lib/__tests__/scoring-provenance.test.ts`  
Expected: PASS for captured score assertions and FAIL only for the not-yet-added provenance assertions.

- [ ] **Step 3: Introduce calculation helpers**

Change each private pillar function to return:

```ts
interface PillarCalculation {
  score: number;
  rawPoints: number;
  components: ScoreComponentProvenance[];
}
```

At each existing branch, record the raw value, its real observation year, awarded points, available points, and source status. Keep every comparison and `Math.round` exactly as it is. Add a small `component()` factory that looks up labels and URLs by registry key and throws in development/tests when a key is missing.

- [ ] **Step 4: Record substitutions explicitly**

For a missing preferred value, record a `fallback` component with the proportional static points and substitution text such as:

```text
World Bank fixed-broadband value unavailable; used 6/20 of the static Infrastructure baseline.
```

Record the intentionally retained residual static proxy as `fallback` with copy explaining that it is a designed baseline component, not a fetch failure.

- [ ] **Step 5: Implement coverage calculation**

In `lib/provenance.ts`, flatten pillar components and calculate counts, dated year range, allocated fallback share, and labels using exact spec boundaries:

```ts
const observedRatio = expectedIndicators === 0
  ? 0
  : (liveIndicators + enrichedIndicators) / expectedIndicators;
const label = observedRatio >= 0.75 && fallbackShare <= 30
  ? "High"
  : observedRatio >= 0.5 && fallbackShare <= 55
    ? "Medium"
    : "Limited";
```

- [ ] **Step 6: Add boundary and source-classification tests**

Test strict World Bank threshold boundaries, inclusive enrichment thresholds, missing years, zero dated values, policy classification, and the 75%/30% and 50%/55% label boundaries. Assert that component `pointsEarned` sums to `rawPoints` and `Math.round(rawPoints)` equals the existing pillar score.

- [ ] **Step 7: Run score, coverage, and type checks**

Run: `npm test -- lib/__tests__/scoring-provenance.test.ts lib/__tests__/coverage.test.ts && npx tsc --noEmit`  
Expected: all tests PASS and all pre-refactor score snapshots remain identical.

- [ ] **Step 8: Commit**

```bash
git add lib/scoring.ts lib/provenance.ts lib/__tests__/scoring-provenance.test.ts lib/__tests__/coverage.test.ts
git commit -m "feat: expose exact score provenance and coverage"
```

---

### Task 3: Complete the backward-compatible API and static fallback contract

**Files:**
- Modify: `app/api/scores/route.ts`
- Modify: `app/country/[slug]/page.tsx`
- Modify: `app/page.tsx`
- Modify: any static `ScoredCountry` constructors identified by TypeScript
- Test: `lib/__tests__/scoring-provenance.test.ts`

**Interfaces:**
- Consumes: `buildStaticProvenance`, `buildCoverage`, and the required types from Tasks 1–2.
- Produces: complete `ScoredCountry` objects before and after live refresh; unchanged `/api/scores` legacy fields.

- [ ] **Step 1: Add API-shape tests**

Add assertions that a scored country retains `data_source`, `raw_indicators`, source booleans, score fields, and now contains five provenance arrays plus coverage. Assert `JSON.stringify` succeeds with no `undefined` numeric fields.

- [ ] **Step 2: Generate fallback objects through one helper**

Make `coverage` and `provenance` required on `ScoredCountry` and add the existing `sources` object to `ScoresResponse`. Export `asFallbackScoredCountry(country: Country): ScoredCountry` from `lib/provenance.ts`. Use it in the homepage and country route instead of duplicating object literals. It must build static provenance, Limited coverage where appropriate, null years, and all existing source booleans as false.

- [ ] **Step 3: Preserve API source semantics**

Keep `using_live_data` tied to a fulfilled World Bank request and keep the `sources` booleans for World Bank, IMF, OECD, and Anthropic. Do not classify policy or external JSON as live API sources.

- [ ] **Step 4: Measure the payload**

Build and run the app, request `/api/scores` with compression, and record raw and compressed byte counts:

```bash
curl -sS http://localhost:3000/api/scores -o /private/tmp/ati-scores.json
gzip -c /private/tmp/ati-scores.json | wc -c
```

Expected: valid JSON for 186 countries; compressed response is below the 500 KB target. If it exceeds the target, replace repeated source names/URLs in country components with stable `methodologyKey` references and resolve them client-side from the registry.

- [ ] **Step 5: Run checks and commit**

Run: `npm test && npm run lint && npx tsc --noEmit`

```bash
git add app/api/scores/route.ts 'app/country/[slug]/page.tsx' app/page.tsx lib/provenance.ts lib/__tests__/scoring-provenance.test.ts
git commit -m "feat: extend score API with research metadata"
```

---

### Task 4: Build the methodology CSV and compact research page

**Files:**
- Create: `app/api/methodology.csv/route.ts`
- Create: `app/api/methodology.csv/route.test.ts`
- Modify: `app/methodology/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `METHODOLOGY_COMPONENTS` and `PILLAR_METADATA` from Task 1.
- Produces: GET `/api/methodology.csv` and a compact methodology page whose tables use the same registry.

- [ ] **Step 1: Write failing CSV tests**

Test status 200, `text/csv; charset=utf-8`, attachment filename `ai-trajectory-index-methodology-v3.csv`, the exact header, one row per registry component, quoted commas, doubled embedded quotes, and official source URLs.

- [ ] **Step 2: Implement RFC 4180 serialization**

Use a local `csvCell(value)` helper:

```ts
const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
```

Return deterministic rows in pillar and component display order with no network calls.

- [ ] **Step 3: Run CSV tests**

Run: `npm test -- app/api/methodology.csv/route.test.ts`  
Expected: PASS.

- [ ] **Step 4: Replace the Methodology page structure**

Render these seven sections in order: formula overview, pillar-weight table, searchable indicator dictionary, CSS source-precedence flow, missing-data policy, limitations, downloads/citation. Remove claims that Stanford, Tortoise, ITU, or WEF directly affect production scores. Use official links from the registry and README.

- [ ] **Step 5: Add print and table styles**

Add `.methodology-*` styles using existing tokens. Under `@media print`, hide navigation/actions, expand clipped tables, show source URLs, avoid splitting table rows, and preserve black-on-white contrast.

- [ ] **Step 6: Verify responsive and accessible behavior**

At 390, 768, and 1440 pixels, confirm no horizontal page overflow, tables scroll inside labeled regions, search has a visible label, and the download is a normal link with descriptive text.

- [ ] **Step 7: Commit**

```bash
git add app/api/methodology.csv/route.ts app/api/methodology.csv/route.test.ts app/methodology/page.tsx app/globals.css
git commit -m "feat: turn methodology into a research reference"
```

---

### Task 5: Add country coverage and pillar provenance UI

**Files:**
- Create: `components/CoverageBadge.tsx`
- Create: `components/PillarProvenance.tsx`
- Create: `components/CountrySection.tsx`
- Modify: `components/CountryPageClient.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `CountryCoverage`, `CountryProvenance`, `PillarKey`, and existing country/adoption props.
- Produces: accessible coverage summary, provenance disclosures, five primary country sections, and a secondary Analysis Tools disclosure.

- [ ] **Step 1: Build coverage presentation**

Render label, live count, date range, and fallback share. The accessible label must read, for example, “High data coverage. 15 live indicators. Observation years 2022 to 2024. 24 percent fallback allocation.” When years are null, render “Year not reported.” Include a tooltip stating “Coverage describes source availability, not statistical certainty.”

- [ ] **Step 2: Build pillar provenance disclosure**

Use a native `<details>`/`<summary>` control or an equivalent button with `aria-expanded`. Render a captioned table with Input, Value, Year, Source, Contribution, and Status. Contribution uses tabular numerals and displays `earned / available pts`. Link source names to official URLs. Render substitution text beneath fallback rows.

- [ ] **Step 3: Recompose the country page**

Group existing content under exactly five `CountrySection` headings: Executive summary; Readiness and Adoption; Pillar evidence; Outlook and policy gaps; News and supporting tools. Move What-if, AI chat, embed controls, and detailed tools into one collapsed Analysis Tools disclosure. Do not remove existing capabilities.

- [ ] **Step 4: Stabilize the radar states**

Reserve the chart's final dimensions during loading. When data is unavailable, show a direct message and the five-pillar table in the same frame. Give the rendered chart an accessible summary and keep the table available to screen readers.

- [ ] **Step 5: Apply responsive and touch rules**

On mobile, default all secondary tools closed and keep the five primary sections in order. Ensure every disclosure and icon action has a 44-pixel touch target. Retain the sticky desktop country switcher and mobile drawer.

- [ ] **Step 6: Browser verification**

Verify USA and a Limited-coverage country at 390, 768, and 1440 pixels. Test keyboard traversal through all disclosures, confirm source links open correctly, and check the browser console.

- [ ] **Step 7: Commit**

```bash
git add components/CoverageBadge.tsx components/PillarProvenance.tsx components/CountrySection.tsx components/CountryPageClient.tsx app/globals.css
git commit -m "feat: add country score provenance and coverage"
```

---

### Task 6: Render baseline rankings immediately and refresh quietly

**Files:**
- Modify: `app/page.tsx`
- Create: `lib/homeRefresh.ts`
- Create: `lib/__tests__/homeRefresh.test.ts`
- Delete only if unused: `components/SkeletonCard.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `asFallbackScoredCountry` from Task 3 and existing `ScoresResponse`.
- Produces: immediate baseline ranking, background refresh status, retry behavior, and unchanged URL/filter state.

- [ ] **Step 1: Write the state-transition test**

Create a pure reducer in `lib/homeRefresh.ts` with states `refreshing`, `live`, and `baseline-error`. Test `refreshing -> live`, `refreshing -> baseline-error`, and retry in `lib/__tests__/homeRefresh.test.ts`. Assert that countries remain populated through every state. Keep filters and view mode outside the reducer so refresh actions cannot reset them.

- [ ] **Step 2: Remove the skeleton gate**

Render table/cards and regional summaries regardless of refresh state. Replace the 12-card skeleton branch with a compact status near the existing freshness label: “Refreshing with live sources,” “Live sources applied,” or “Baseline shown. Retry live refresh.”

- [ ] **Step 3: Preserve layout and interaction state**

Do not remount the grid when live data arrives. Keep stable country keys, current filters, selected view, comparison list, watchlist, and scroll position. Use the existing country array replacement only.

- [ ] **Step 4: Verify slow and failed networks**

In the browser, intercept or delay `/api/scores`. Confirm baseline cards appear immediately, remain interactive, and do not shift when the response resolves. Force a failure and confirm retry works without clearing state.

- [ ] **Step 5: Run checks and commit**

Run: `npm test && npm run lint && npx tsc --noEmit`

```bash
git add app/page.tsx app/globals.css components/SkeletonCard.tsx lib/homeRefresh.ts lib/__tests__/homeRefresh.test.ts
git commit -m "feat: render baseline rankings before live refresh"
```

---

### Task 7: Documentation, score audit, and visual regression pass

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Create: `docs/redesign/provenance-after/` screenshots
- Modify only if the audit finds a real inconsistency: affected UI or type file

**Interfaces:**
- Consumes: all completed implementation tasks.
- Produces: current documentation, score equality evidence, responsive screenshots, and a release-ready branch.

- [ ] **Step 1: Update documentation**

Document required provenance/coverage fields, label thresholds, the fact that coverage is not confidence, the shared registry, `/api/methodology.csv`, and baseline-first homepage rendering. Preserve the complete methodology already in README.

- [ ] **Step 2: Run the full score equality audit**

Use the regression fixtures to compare all 186 static results and representative live fixtures. The audit must fail on any change to pillar, total, trajectory, or projected score.

- [ ] **Step 3: Run all automated checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: zero test, lint, type, or build errors.

- [ ] **Step 4: Capture visual QA evidence**

Capture home, methodology, USA, and the chosen Limited-coverage country at 390, 768, and 1440 pixels under `docs/redesign/provenance-after/`. Inspect each image for hierarchy, clipping, table overflow, chart states, and consistency with the homepage system.

- [ ] **Step 5: Run accessibility and browser QA**

Verify semantic headings, table captions, keyboard operation, focus visibility, 44-pixel targets, reduced motion, no horizontal page overflow, and no console errors. Test `/api/scores` and `/api/methodology.csv` directly.

- [ ] **Step 6: Commit documentation and QA artifacts**

```bash
git add README.md CLAUDE.md docs/redesign/provenance-after
git commit -m "docs: document provenance and coverage release"
```

---

### Task 8: Review, merge, deploy, and production verification

**Files:**
- No planned source changes. Any review fix receives its own focused commit.

**Interfaces:**
- Consumes: the completed branch and existing Vercel project link.
- Produces: pushed `main`, production deployment, and verified canonical release.

- [ ] **Step 1: Review the complete diff**

Check for scoring drift, misleading source labels, optional fields that should be required, duplicated methodology metadata, inaccessible disclosures, and unintended URL/export changes.

- [ ] **Step 2: Re-run clean verification after review fixes**

Run: `npm test && npm run lint && npm run build`  
Expected: all PASS from a clean working tree.

- [ ] **Step 3: Fast-forward merge and push**

```bash
git switch main
git merge --ff-only research/provenance-confidence
git push origin main
```

- [ ] **Step 4: Deploy to the existing free-scope project**

Run:

```bash
vercel deploy --prod --yes --scope ankitmishra01s-projects
```

Confirm the alias is exactly `https://ai-trajectory-index.vercel.app` and do not create or link another project.

- [ ] **Step 5: Verify production**

Check `/`, `/methodology`, `/country/usa`, one Limited-coverage country, `/map`, `/compare/usa/china`, `/adoption`, `/europe`, `/widget/usa`, `/api/scores`, and `/api/methodology.csv`. Confirm HTTP 200, current design, populated provenance, correct `last_updated`, no console errors, downloadable CSV headers, and clean Vercel build logs.

- [ ] **Step 6: Roll back on regression**

If scoring, routes, or production rendering is broken, run `vercel rollback`, verify the prior deployment is restored, and report the failing check rather than leaving the canonical site degraded.
