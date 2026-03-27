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

**Score formula summary:**
- Infrastructure: internet users + mobile subs + electricity access → scale /18 × 20
- Talent: tertiary enrollment + R&D spend (each 8pts) + static quality proxy (4pts)
- Governance: AI strategy (8+2 bonus) + regulation (5) + OECD (3) + static proxy (2)
- Investment: R&D spend (6) + GDP per capita (6) + static VC proxy (8)
- Economic Readiness: GDP (8) + electricity (4) + internet+mobile (4) + static (4)
- Trajectory (-10→+10): GDP growth (25%) + internet growth (20%) + AI strategy recency (25%) + R&D trend (15%) + static (15%)
- projected_score_2028 = clamp(total + trajectory × 1.5, 0, 100)

**Routing:**
- `/` — filterable grid, fetches `/api/scores` on mount, static data shown instantly then replaced
- `/country/[slug]` — detail page, same pattern (static → live upgrade)
- `/api/scores` — GET, returns `{ countries, last_updated, using_live_data }`
- `/api/narrative` — stub, returns 501

**Components:**
- `CountryCard` — card with mini dimension bars, trajectory badge, accelerator/risk
- `SkeletonCard` — animated pulse placeholder shown during `/api/scores` fetch
- `ScoreGauge` — SVG semicircle gauge (arc from -210° to 30°, 240° sweep)
- `DimensionBar` — labelled progress bar, each dimension has a distinct colour
- `TrajectoryArrow` — pill badge mapping trajectory_label to ↑↑/↑/→/↓/↓↓ with colour
- `FilterBar` — search input, region pills, sort dropdown

**Types:** `lib/types.ts` — `Country`, `ScoredCountry` (adds `data_source: "live" | "fallback"`), `ScoresResponse`

**Styling:** Dark navy `#0a0f1e` background, electric blue `#3b82f6` accent, green `#22c55e` positive, red `#ef4444` negative. Inter font via Google Fonts import in `globals.css`.

## Adding a country

Add to `/data/countries.json` and `/data/ai-policies.json`, and add the slug→ISO2 mapping in `lib/slugToIso.ts`. Slug must be lowercase with hyphens. `comparable_countries` must reference valid slugs.

## Deployment

Deployed to Vercel. `OPENROUTER_API_KEY` needed only for Phase 3 (AI narratives). `NEXT_PUBLIC_SITE_URL` should be set to `https://ai-index.ankitmishra.ca`.
