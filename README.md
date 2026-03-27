# AI Trajectory Index

A live, interactive tool scoring 20 countries on their current AI readiness AND their forward-looking AI trajectory over 3–5 years. Built by [Ankit Mishra](https://ankitmishra.ca).

**Live:** [ai-index.ankitmishra.ca](https://ai-index.ankitmishra.ca)

## What it does

- Scores 20 countries across 5 dimensions: Infrastructure, Talent, Governance, Investment, Economic Readiness (20 pts each, total 100)
- Shows trajectory scores (-10 to +10) indicating acceleration or decline
- Projects scores to 2028
- Country detail pages with expandable dimension evidence, comparable countries, and a Phase 2 AI narrative placeholder

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env.local`:

```
OPENROUTER_API_KEY=your_key_here
NEXT_PUBLIC_SITE_URL=https://ai-index.ankitmishra.ca
```

`OPENROUTER_API_KEY` is only needed for Phase 2 (AI narratives).

## Tech stack

- Next.js 14 (App Router)
- Tailwind CSS
- Recharts (Phase 2 charts)
- OpenRouter / Gemini 2.0 Flash (Phase 2 narratives)
- Vercel

## Roadmap

**Phase 1 (current):** Hardcoded data, scoring model, filterable grid, country detail pages.

**Phase 2:** Live AI-generated strategic narratives via OpenRouter, animated charts, more countries.
