# AI Trajectory Index

A live, interactive tool scoring 186 countries on current AI readiness and 3–5 year trajectory.

## What it does
- Scores every country across 5 dimensions: Infrastructure, Talent, Governance, Investment, Economic Readiness
- Shows trajectory: where each country is headed over 3-5 years based on policy momentum, capital flows, talent pipeline, and infrastructure growth
- Generates AI-powered country narratives explaining the why behind each score
- Live data from World Bank API and OECD AI Policy Observatory, updated daily
- Interactive world map with lasso selection and AI-powered country comparison chat

## Tech stack
Next.js 14 · Tailwind CSS · OpenRouter API (Gemini 2.0 Flash) · World Bank API · Vercel

## Live site
https://ai-trajectory-index.vercel.app

## Built by
[Ankit Mishra](https://ankitmishra.ca) — Commercial Portfolio Director at a leading African climatetech venture fund · Forbes contributor (50+ articles, 200,000+ readers) · Schwartz Reisman Institute AI & Trust Working Group, University of Toronto

## Setup
1. Clone the repo
2. `cp .env.example .env.local`
3. Add your `OPENROUTER_API_KEY`
4. `npm install`
5. `npm run dev`

## Data sources
- World Bank Open Data API (free, no key required)
- OECD AI Policy Observatory (static dataset)
- OpenRouter API for narrative generation (free tier, Gemini 2.0 Flash)

## Architecture
- `/data/countries.json` — 186 countries with static baseline scores
- `/data/ai-policies.json` — policy metadata (AI strategies, OECD membership)
- `/lib/worldbank.ts` — live World Bank API client (6 indicators, 24h cache)
- `/lib/scoring.ts` — score calculation engine
- `/lib/openrouter.ts` — OpenRouter client for AI narrative generation
- `/app/api/scores` — scored country data endpoint
- `/app/api/narrative/[country]` — on-demand AI narrative with 7-day cache
- `/app/api/chat` — map page AI chat for selected country comparison
