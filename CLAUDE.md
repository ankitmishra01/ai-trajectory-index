# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Production build (runs type check + ESLint)
npm run lint       # ESLint only
```

## Architecture

**Data layer:**
- `/data/countries.json` — 186 countries, static baseline scores (5 dimensions × 0–20, trajectory, evidence)
- `/data/ai-policies.json` — policy metadata keyed by slug: `has_national_ai_strategy`, `strategy_year`, `has_ai_regulation`, `oecd_member`

**Live scoring pipeline (Phase 2):**
- `lib/worldbank.ts` — fetches 6 World Bank indicators in parallel (`mrv=2` for growth rates), 24h Next.js cache
- `lib/slugToIso.ts` — maps all 186 slugs to ISO2 codes for World Bank API
- `lib/scoring.ts` — `calculateScores()` computes live dimension scores + trajectory; falls back to static if WB data is null
- `app/api/scores/route.ts` — combines WB data + policy data → returns full scored dataset, `revalidate: 86400`

**Score formula summary (v3 — post-audit):**
- Infrastructure: fixed broadband (6) + internet users (3) + mobile (3) + electricity (3) + static quality (5)
- Talent: tertiary enrollment (6) + labor productivity GDP/worker PPP (6) + static talent proxy (8)
  - Note: R&D spend removed from Talent (was double-counted with Investment)
- Governance: Rule of Law WGI (5) + Govt Effectiveness WGI (4) + Regulatory Quality WGI (3) + AI strategy (3+2 recency) + AI regulation (1) + static (2)
  - WGI estimates normalised: `((estimate + 2.5) / 5.0) × maxPts`
- Investment: R&D spend (6) + FDI net inflows % GDP (5) + static VC proxy (9)
  - Note: GDP per capita removed from Investment (was double-counted with Econ Readiness)
- Economic Readiness: GDP per capita PPP (6) + private credit % GDP (3) + trade openness (3) + services share (3) + static (5)
  - Note: electricity/internet/mobile removed (was triple-counted with Infrastructure)
  - Uses PPP-adjusted GDP (NY.GDP.PCAP.PP.KD) not nominal USD
- Trajectory (-10→+10): GDP growth (20%) + R&D trend (15%) + labor productivity trend (15%) + high-tech exports trend (20%) + broadband growth (10%) + AI strategy (10%) + static (10%)
- projected_score_2028 = clamp(total + trajectory × 1.5, 0, 100)

**WB indicators fetched (17 total, all parallel, 24h cache):**
`IT.NET.USER.ZS`, `IT.CEL.SETS.P2`, `IT.NET.BBN.P2`, `SE.TER.ENRR`, `SL.GDP.PCAP.EM.KD`, `GB.XPD.RSDV.GD.ZS`, `EG.ELC.ACCS.ZS`, `GE.EST`, `RL.EST`, `RQ.EST`, `BX.KLT.DINV.WD.GD.ZS`, `NY.GDP.PCAP.PP.KD`, `NY.GDP.PCAP.CD`, `FS.AST.PRVT.GD.ZS`, `NE.TRD.GNFS.ZS`, `NV.SRV.TOTL.ZS`, `TX.VAL.TECH.MF.ZS`

**Routing:**
- `/` — filterable grid, fetches `/api/scores` on mount, static data shown instantly then replaced
- `/country/[slug]` — detail page, same pattern (static → live upgrade)
- `/api/scores` — GET, returns `{ countries, last_updated, using_live_data }`
- `/api/narrative/[country]` — GET, returns `{ sections: {heading, body}[], source: "ai" | "template", generatedAt }` (see Narrative below)

**Narrative (per-country written brief):**
- `lib/narrativeTemplate.ts` — `buildFactPack()` assembles one shared fact pack per country (scores + evidence bullets, rank, trajectory, policy metadata, live World Bank `raw_indicators` when present). `generateStructuredNarrative()` deterministically stitches that fact pack into 5 headed sections (Standing & Trajectory / Infrastructure & Talent / Governance & Policy / Investment & Capital / Economic Readiness & Outlook), citing real numbers — no network call, no cost, always succeeds. `summarizeFactPack()` renders the same facts as a compact bullet list for the AI prompt.
- `lib/openrouter.ts` — `generateStructuredNarrative()` (AI version) sends `summarizeFactPack()`'s output to a chain of free OpenRouter models and asks for the same 5 `### `-headed sections, parsed back into `{heading, body}[]`. Model IDs go stale — free-tier availability changes; re-check `https://openrouter.ai/api/v1/models` (no key needed) if the chain starts 404ing.
- `app/api/narrative/[country]/route.ts` — tries the AI path first (if `OPENROUTER_API_KEY` is set); on any failure (all models down, or output doesn't parse into exactly 5 sections) it silently falls back to the deterministic template. Response is tagged `source: "ai" | "template"` so the UI can label it. 7-day in-memory cache either way.
- `components/CountryPageClient.tsx` renders the 5 sections as alternating text/`DimensionBar` rows (`.brief-section-row` in `globals.css`), regardless of which source produced them.

**Components:**
- `CountryCard` — card with mini dimension bars, trajectory badge, accelerator/risk
- `SkeletonCard` — animated pulse placeholder shown during `/api/scores` fetch
- `ScoreGauge` — SVG semicircle gauge (arc from -210° to 30°, 240° sweep)
- `DimensionBar` — labelled progress bar, each dimension has a distinct colour
- `TrajectoryArrow` — pill badge mapping trajectory_label to ↑↑/↑/→/↓/↓↓ with colour
- `FilterBar` — search input, region pills, sort dropdown

**Types:** `lib/types.ts` — `Country`, `ScoredCountry` (adds `data_source: "live" | "fallback"`, optional `raw_indicators`), `ScoresResponse`, `NarrativeSection`

**Styling:** Two token systems, both live, used deliberately (not a leftover from the redesign):
- Homepage, region pages, and most cards use the ivory/ink **editorial** theme (`--ed-*` tokens in `globals.css`) — background `#FBF9F4`, serif `Fraunces` display type, `Inter Tight` body, signal-red accent `#D64528`.
- `/country/[slug]` (`CountryPageClient.tsx`) stays on the darker **data-terminal** theme (`--dt-*` tokens, mapped through legacy `--bg`/`--accent`/etc. compat vars) — a deliberate dark-hero-then-panels contrast, not a migration gap.
- Both scales share the 5 pillar colours (`--pillar-infra` etc.) so charts read consistently across themes.

## Adding a country

Add to `/data/countries.json` and `/data/ai-policies.json`, and add the slug→ISO2 mapping in `lib/slugToIso.ts`. Slug must be lowercase with hyphens. `comparable_countries` must reference valid slugs.

## Deployment

Deployed to Vercel. `OPENROUTER_API_KEY` is optional — without it, `/api/narrative` serves the deterministic template directly (`source: "template"`); with it, AI-drafted briefs are tried first and fall back to the template automatically. `NEXT_PUBLIC_SITE_URL` should be set to `https://ai-trajectory-index.vercel.app` (the custom domain referenced in older docs, `ai-index.ankitmishra.ca`, is not configured — don't reintroduce it without setting up DNS first).
