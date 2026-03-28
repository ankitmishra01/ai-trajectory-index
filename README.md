# AI Trajectory Index

**Live tool:** [ai-trajectory-index.vercel.app](https://ai-trajectory-index.vercel.app)

A live, interactive index scoring **186 countries** on their current AI readiness and 3–5 year trajectory — built for investors, policymakers, and researchers who need to understand which nations are winning the AI race and why.

---

## What it does

- Scores 186 economies across **5 pillars**: Infrastructure, Talent, Governance, Investment, and Economic Readiness (each 0–20, total 0–100)
- Shows **forward trajectory** — which countries are accelerating, plateauing, or falling behind, with a projected 2028 score
- Generates **AI-powered country narratives** explaining the drivers behind each score (via OpenRouter, free tier)
- **Interactive world map** with country selection and AI-powered country comparison chat
- **Country comparison tool** — side-by-side radar charts and pillar breakdowns
- **Region deep-dives** — Americas, Europe, Asia-Pacific, Middle East, Africa with sub-regional analysis
- **Live news feeds** per country via GDELT, with AI signal analysis
- **Shareable filtered URLs** — all filter state encoded in query params
- **Export** to CSV or JSON
- Live data from 17 World Bank indicators, updated every 24 hours

## Screenshots

![Homepage](public/screenshots/homepage.png)
*186 countries scored across 5 AI readiness pillars*

![Map View](public/screenshots/map.png)
*Interactive world map with country selection and AI-powered chat*

![Country Detail](public/screenshots/country-detail.png)
*Individual country profiles with pillar breakdown, trajectory, and live news signal*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Charts | Recharts (radar, bar) + react-simple-maps |
| AI Narratives | OpenRouter API (Gemini 2.0 Flash — free tier) |
| Live News | GDELT 2.0 Document API (free, no key) |
| World Data | World Bank Open Data API (17 indicators, free) |
| Policy Data | OECD AI Policy Observatory (static dataset) |
| Governance | World Governance Indicators — WGI (via World Bank API) |
| Cron | Vercel Cron (news cache warming, nightly) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- An OpenRouter API key (free at [openrouter.ai](https://openrouter.ai))

### Installation

```bash
# Clone the repo
git clone https://github.com/ankitmishra01/ai-trajectory-index.git
cd ai-trajectory-index

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your OPENROUTER_API_KEY

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | AI narrative generation + map chat |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL for OG meta tags |
| `CRON_SECRET` | No | Protects `/api/news-cron` from unauthorised calls |

### Deployment

One-click Vercel deployment:

1. Fork this repo
2. Import to [Vercel](https://vercel.com)
3. Add `OPENROUTER_API_KEY` as an environment variable
4. Deploy — World Bank data fetches automatically, no other setup needed

---

## Scoring Methodology

Five equally-weighted pillars, each scored 0–20:

| Pillar | What it measures | Key live indicators |
|--------|-----------------|----------------|
| **Infrastructure** | Digital and physical foundations | Fixed broadband/100 (IT.NET.BBN.P2), internet users %, electricity access % |
| **Talent** | Human capital pipeline and deployment | Tertiary enrollment (SE.TER.ENRR), labor productivity (SL.GDP.PCAP.EM.KD) |
| **Governance** | Institutional quality + AI policy | Rule of Law WGI (RL.EST), Govt Effectiveness (GE.EST), Regulatory Quality (RQ.EST), national AI strategy |
| **Investment** | Capital environment | R&D spend % GDP (GB.XPD.RSDV.GD.ZS), FDI net inflows (BX.KLT.DINV.WD.GD.ZS) |
| **Economic Readiness** | Market conditions | GDP per capita PPP (NY.GDP.PCAP.PP.KD), private credit % GDP, trade openness, services share |

Full methodology: [ai-trajectory-index.vercel.app/methodology](https://ai-trajectory-index.vercel.app/methodology)

### Design Principles

- **No double-counting**: R&D spend only in Investment; GDP only in Economic Readiness; electricity/internet only in Infrastructure
- **Continuous > binary**: Governance replaced binary flags (has_strategy, oecd_member) with continuous WGI z-scores, normalised as `((estimate + 2.5) / 5.0) × maxPts`
- **PPP-adjusted**: Economic Readiness uses constant 2017 PPP$ GDP rather than nominal USD to remove currency/price-level bias
- **Quality over access**: Infrastructure weights fixed broadband (quality signal) over internet user % (saturated for OECD)
- **Forward signals in trajectory**: AI strategy weight cut from 25% → 10% (categorical event); replaced with high-tech exports trend (innovation output) and broadband growth

### Tiers

| Score | Tier | Description |
|-------|------|-------------|
| 75–100 | 🟢 Leading | Frontier AI readiness |
| 55–74 | 🔵 Advanced | Strong foundations |
| 40–54 | 🟡 Developing | Building blocks in place |
| 0–39 | 🔴 Nascent | Early stage |

### Trajectory

| Label | Points | Meaning |
|-------|--------|---------|
| ↑↑ Strong Positive | +6 to +10 | Structural acceleration |
| ↑ Positive | +2 to +5 | Measurable momentum |
| → Neutral | -1 to +1 | Steady state |
| ↓ Negative | -5 to -2 | Structural headwinds |
| ↓↓ Strong Negative | -10 to -6 | Falling behind |

Projected 2028 score = `clamp(total + trajectory × 1.5, 0, 100)`

---

## Data Sources

| Source | What it provides | Update frequency |
|--------|-----------------|-----------------|
| [World Bank Open Data API](https://data.worldbank.org) | 17 macro indicators (infrastructure, labour, economics, governance) | Daily fetch, 24h cache |
| [World Governance Indicators](https://info.worldbank.org/governance/wgi/) | Rule of Law, Govt Effectiveness, Regulatory Quality | Via World Bank API |
| [OECD AI Policy Observatory](https://oecd.ai) | National AI strategies, regulation status | Static dataset |
| [GDELT 2.0](https://www.gdeltproject.org) | Country-level AI news headlines | On-demand, 1h cache |
| [OpenRouter](https://openrouter.ai) | AI country narratives, news signal analysis | On-demand, 7d/24h cache |

World Bank indicators typically lag 1–2 years — most recent data is from 2023–2024.

---

## Project Structure

```
/app
  page.tsx                  — Main country index
  /map/page.tsx             — Interactive world map + AI chat
  /africa|americas|europe|asia-pacific|middle-east/page.tsx — Region deep-dives
  /country/[slug]/page.tsx  — Individual country profiles
  /methodology/page.tsx     — Full scoring methodology
  /api/
    scores/route.ts         — Live scoring endpoint (24h cache)
    narrative/[country]/    — OpenRouter narrative generation (7d cache)
    news/[slug]/            — GDELT news feed (1h cache)
    news-signal/[slug]/     — AI signal analysis (24h cache)
    news-cron/route.ts      — Vercel Cron: warms top-50 news cache nightly

/components
  CountryCard.tsx           — Card with mini dimension bars + trajectory badge
  CountryPageClient.tsx     — Country detail page (client component)
  CountryNewsFeed.tsx       — Live news + AI signal panel
  ComparisonPanel.tsx       — Radar chart comparison (up to 4 countries)
  FilterBar.tsx             — Search + consolidated filter + sort (slide-out panel)
  FastestMovers.tsx         — Top 5 trajectory countries (compact tiles)
  KeyInsights.tsx           — Auto-generated insights from live data
  LastVisitBanner.tsx       — localStorage delta: shows changes since last visit
  RegionDeepDive.tsx        — Shared region deep-dive layout (bar charts)
  WorldMap.tsx              — react-simple-maps SVG world map
  ScoreGauge.tsx            — SVG semicircle gauge
  RankingsTable.tsx         — Sortable tabular view
  ExportButton.tsx          — CSV/JSON export

/lib
  worldbank.ts              — WB API client (17 indicators, parallel fetch, 24h cache)
  scoring.ts                — Score calculation engine (5 pillars + trajectory)
  openrouter.ts             — OpenRouter client (narratives + news signal analysis)
  gdelt.ts                  — GDELT news client (1h in-memory cache, disambiguation)
  slugToIso.ts              — 186 slug → ISO2 mappings
  regionConfigs.ts          — Region deep-dive configuration
  types.ts                  — Country, ScoredCountry, ScoresResponse

/data
  countries.json            — 186 countries: static baseline scores + evidence
  ai-policies.json          — Policy metadata keyed by slug
  narratives/.gitkeep       — Cached narratives directory (files are gitignored)
```

---

## Contributing

Issues and pull requests are welcome. If you spot a data error, have a methodology suggestion, or want to add a feature, please open an issue first.

Areas where contributions are especially welcome:
- Additional governance data sources (Freedom House, V-Dem)
- Improved trajectory modelling (patent filings, AI publication growth)
- Better data for smaller economies where World Bank coverage is thin
- Translation and localisation

---

## Citing This Index

If you reference this tool in research or journalism:

> Mishra, A. (2026). *AI Trajectory Index: Scoring 186 Economies on AI Readiness and 3–5 Year Trajectory*. Retrieved from https://ai-trajectory-index.vercel.app

---

## About

Built by **[Ankit Mishra](https://ankitmishra.ca)** as an independent research tool at the intersection of AI governance, emerging markets, and technology policy.

- Commercial Portfolio Director at a leading African climatetech venture fund
- Member, [Schwartz Reisman Institute AI & Trust Working Group](https://srinstitute.utoronto.ca), University of Toronto
- Forbes contributor — [50+ articles](https://www.forbes.com/sites/ankitmishra/), 200,000+ readers

[LinkedIn](https://www.linkedin.com/in/ankitmishra3/) · [ankitmishra.ca](https://ankitmishra.ca)

---

## License

[MIT License](LICENSE) — free to use, modify, and distribute with attribution.
