import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — AI Trajectory Index",
  description: "How 186 economies are scored across five pillars of AI readiness using World Bank data, OECD policy indicators, and trajectory modelling.",
};

const PILLARS = [
  {
    name: "Infrastructure",
    score: "0–20",
    color: "#3b82f6",
    icon: "🔌",
    description: "The physical and digital foundation for AI deployment.",
    measures: [
      "Internet users as % of population (World Bank: IT.NET.USER.ZS) — weighted at 8 points",
      "Mobile cellular subscriptions per 100 people (IT.CEL.SETS.P2) — weighted at 5 points",
      "Electricity access as % of population (EG.ELC.ACCS.ZS) — weighted at 5 points",
      "Static proxy for data centre capacity and cloud infrastructure (2 points) — derived from qualitative country assessments",
    ],
    note: "Higher internet and mobile penetration correlates strongly with AI adoption capacity. Electricity access is foundational for compute and connectivity.",
  },
  {
    name: "Talent",
    score: "0–20",
    color: "#8b5cf6",
    icon: "🎓",
    description: "The human capital pipeline for AI development and deployment.",
    measures: [
      "Gross tertiary enrolment ratio (SE.TER.ENRR) — weighted at 8 points",
      "R&D expenditure as % of GDP (GB.XPD.RSDV.GD.ZS) — weighted at 8 points (proxy for research culture)",
      "Static quality proxy — incorporates OECD membership, university ranking presence, and researcher density estimates (4 points)",
    ],
    note: "R&D spend is used as a structural talent proxy: countries that invest in research systematically develop AI capabilities. Tertiary enrolment shapes the future supply of skilled workers.",
  },
  {
    name: "Governance",
    score: "0–20",
    color: "#06b6d4",
    icon: "⚖️",
    description: "Policy maturity, regulatory frameworks, and government AI strategy.",
    measures: [
      "National AI strategy adoption (OECD AI Policy Observatory) — 8 points base, +2 bonus if strategy was adopted post-2022",
      "AI-specific regulation or data protection law in place — 5 points",
      "OECD membership (proxy for regulatory alignment and institutional capacity) — 3 points",
      "Static governance proxy for digital government services and transparency (2 points)",
    ],
    note: "Governance is the most policy-sensitive pillar. Countries with recent, comprehensive AI strategies receive a recency bonus — reflecting active government engagement rather than dormant policy.",
  },
  {
    name: "Investment",
    score: "0–20",
    color: "#f59e0b",
    icon: "💰",
    description: "Capital flowing into AI — public R&D, private venture capital, and FDI.",
    measures: [
      "R&D expenditure as % of GDP (GB.XPD.RSDV.GD.ZS) — weighted at 6 points",
      "GDP per capita USD (NY.GDP.PCAP.CD) — weighted at 6 points (proxy for private capital availability)",
      "Static VC and tech ecosystem proxy — derived from startup density, unicorn presence, and technology sector FDI estimates (8 points)",
    ],
    note: "GDP per capita is used as a structural investment proxy because higher-income economies have deeper capital markets. The static VC proxy captures the startup ecosystem which pure macro data misses.",
  },
  {
    name: "Economic Readiness",
    score: "0–20",
    color: "#22c55e",
    icon: "📊",
    description: "The economy's structural capacity to adopt and commercialise AI.",
    measures: [
      "GDP per capita USD (NY.GDP.PCAP.CD) — weighted at 8 points",
      "Electricity access (EG.ELC.ACCS.ZS) — weighted at 4 points",
      "Combined internet and mobile penetration — weighted at 4 points (reflects digital commerce readiness)",
      "Static proxy for ease of doing business, market openness, and digital payment adoption (4 points)",
    ],
    note: "Economic readiness measures whether the structural conditions exist for AI to generate commercial value — not just whether AI researchers exist.",
  },
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="page-glow" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.94)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: "var(--text-3)" }}>
            ← Index
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Methodology
          </span>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* Page hero */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(96,165,250,.7)" }}>
            Scoring Framework
          </p>
          <h1 className="font-serif-display text-4xl sm:text-5xl mb-4 leading-tight" style={{ color: "var(--text-1)" }}>
            How we score 186 economies
          </h1>
          <p className="text-base leading-relaxed max-w-2xl" style={{ color: "var(--text-2)" }}>
            The AI Trajectory Index scores every country across five pillars, each worth 0–20 points,
            for a total composite score out of 100. Scores are updated daily using live World Bank
            indicator data with a 24-hour cache.
          </p>
        </div>

        {/* Score formula overview */}
        <div className="card rounded-2xl p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: "var(--text-3)" }}>
            Composite Score Formula
          </h2>
          <div className="rounded-xl p-4 font-mono text-sm mb-5"
            style={{ background: "var(--raised)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
            <span style={{ color: "var(--accent)" }}>Total Score</span> = Infrastructure + Talent + Governance + Investment + Economic Readiness
            <br />
            <span style={{ color: "var(--text-3)" }}>Each pillar: 0–20 points → Total: 0–100</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PILLARS.map((p) => (
              <div key={p.name} className="text-center rounded-xl p-3"
                style={{ background: `${p.color}10`, border: `1px solid ${p.color}25` }}>
                <p className="text-lg mb-1">{p.icon}</p>
                <p className="text-xs font-bold" style={{ color: p.color }}>{p.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>0–20 pts</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar definitions */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Pillar Definitions
          </h2>
          {PILLARS.map((p) => (
            <div key={p.name} className="card rounded-2xl overflow-hidden">
              <div className="h-1 w-full" style={{ background: p.color, opacity: 0.6 }} />
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>{p.name}</h3>
                    <p className="text-xs font-semibold" style={{ color: p.color }}>{p.score} points</p>
                  </div>
                </div>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--text-2)" }}>{p.description}</p>
                <div className="space-y-2 mb-4">
                  {p.measures.map((m, i) => (
                    <div key={i} className="flex gap-3 items-start text-sm" style={{ color: "var(--text-2)" }}>
                      <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                      {m}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3 text-xs leading-relaxed"
                  style={{ background: `${p.color}08`, border: `1px solid ${p.color}20`, color: "var(--text-3)" }}>
                  <span className="font-semibold" style={{ color: p.color }}>Methodology note: </span>
                  {p.note}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trajectory & Projection */}
        <div className="card rounded-2xl p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: "var(--text-3)" }}>
            Trajectory Score &amp; 2028 Projection
          </h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-2)" }}>
            The trajectory score (–10 to +10) reflects momentum — whether a country is accelerating or stagnating
            in its AI readiness. It is calculated from four forward-looking components:
          </p>
          <div className="space-y-3 mb-5">
            {[
              { label: "GDP growth rate (3-year avg)", weight: "25%", note: "Proxy for economic capacity to fund AI investment" },
              { label: "Internet penetration growth", weight: "20%", note: "Captures digital adoption momentum" },
              { label: "AI strategy recency", weight: "25%", note: "Countries that adopted national AI strategies post-2020 receive a strong positive signal; those with no strategy receive negative weighting" },
              { label: "R&D spending trend", weight: "15%", note: "Year-over-year change in R&D as % of GDP" },
              { label: "Static momentum proxy", weight: "15%", note: "Incorporates startup ecosystem growth, educational reform signals, and qualitative country-level factors" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 rounded-xl p-3"
                style={{ background: "var(--raised)", border: "1px solid var(--border)" }}>
                <span className="text-xs font-black px-2 py-0.5 rounded flex-shrink-0"
                  style={{ background: "rgba(59,130,246,.12)", color: "var(--accent)", border: "1px solid rgba(59,130,246,.22)" }}>
                  {item.weight}
                </span>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-1)" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>{item.note}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 font-mono text-sm"
            style={{ background: "var(--raised)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
            <span style={{ color: "var(--accent)" }}>Projected 2028 Score</span> = clamp(Total + Trajectory × 1.5, 0, 100)
            <br />
            <span style={{ color: "var(--text-3)" }}>Trajectory labels: Strong Positive (+6 to +10), Positive (+2 to +5), Neutral (-1 to +1), Negative (-5 to -2), Strong Negative (-10 to -6)</span>
          </div>
        </div>

        {/* Normalisation */}
        <div className="card rounded-2xl p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
            Normalisation Approach
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-2)" }}>
            Each live World Bank indicator is normalised against a global benchmarking range. For example,
            the internet penetration score uses a min-max scale where 0% penetration = 0 points and
            the practical ceiling (95%+) = maximum points. GDP per capita uses a logarithmic scale to
            avoid extreme compression at the top end.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            Countries missing World Bank data for a given indicator fall back to their static baseline
            score derived from 2023/24 secondary sources. The <code className="text-xs px-1 py-0.5 rounded"
              style={{ background: "var(--raised)", color: "var(--accent)" }}>data_source</code> field
            on each country response indicates whether scores are live or from the static baseline.
          </p>
        </div>

        {/* Data Sources */}
        <div className="card rounded-2xl p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: "var(--text-3)" }}>
            Data Sources
          </h2>
          <div className="space-y-4">
            {[
              {
                name: "World Bank Open Data API",
                url: "https://data.worldbank.org",
                desc: "Primary source for quantitative indicators. Fetches the two most recent data points per indicator to calculate growth trends. Cache: 24 hours.",
                indicators: ["IT.NET.USER.ZS", "IT.CEL.SETS.P2", "SE.TER.ENRR", "GB.XPD.RSDV.GD.ZS", "NY.GDP.PCAP.CD", "EG.ELC.ACCS.ZS"],
              },
              {
                name: "OECD AI Policy Observatory",
                url: "https://oecd.ai",
                desc: "Source for national AI strategy status, adoption year, and AI regulation flags. Supplemented with manual country policy research. Updated annually.",
                indicators: ["National AI strategy adoption", "AI regulation status", "OECD membership"],
              },
            ].map((src) => (
              <div key={src.name} className="rounded-xl p-5"
                style={{ background: "var(--raised)", border: "1px solid var(--border)" }}>
                <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-1)" }}>{src.name}</h3>
                <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>{src.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {src.indicators.map((ind) => (
                    <span key={ind} className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{ background: "rgba(59,130,246,.08)", color: "var(--accent)", border: "1px solid rgba(59,130,246,.18)" }}>
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div className="card rounded-2xl p-6 sm:p-8"
          style={{ background: "rgba(245,158,11,.04)", borderColor: "rgba(245,158,11,.18)" }}>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#f59e0b" }}>
            Limitations &amp; Caveats
          </h2>
          <div className="space-y-3">
            {[
              "World Bank data lags by 1–3 years for many countries. The most recent available data point is used, which may not reflect the current situation.",
              "AI readiness is multidimensional and any composite index involves trade-offs in weighting. The weights reflect the authors' best judgement, not a peer-reviewed consensus.",
              "The static baseline scores were set in 2024 and may not capture rapid recent changes — particularly for fast-moving markets like India, UAE, and Southeast Asia.",
              "The governance pillar heavily rewards countries with formal AI strategies. This may overstate readiness in countries with strong strategies but weak implementation.",
              "Countries with populations under 1 million (small island states) may have extreme indicator values that don't represent typical AI readiness patterns.",
              "This index does not assess AI safety, ethics oversight, or bias mitigation frameworks — important dimensions omitted due to data availability constraints.",
            ].map((lim, i) => (
              <div key={i} className="flex gap-3 items-start text-sm" style={{ color: "var(--text-2)" }}>
                <span className="mt-1 flex-shrink-0 text-amber-400">⚠</span>
                {lim}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 mt-4 text-center space-y-1"
        style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          AI Trajectory Index · Built by{" "}
          <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors">Ankit Mishra</a>
          {" "}— Commercial Portfolio Director at Holocene · Forbes contributor
        </p>
      </footer>
    </main>
  );
}
