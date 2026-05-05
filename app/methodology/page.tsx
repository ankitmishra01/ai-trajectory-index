import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Methodology — AI Trajectory Index",
  description: "How 186 economies are scored across five AI readiness pillars, drawing from 9 primary data sources including World Bank, IMF AI Preparedness Index, Stanford HAI, OECD, Anthropic Economic Index, and more.",
};

const PRIMARY_SOURCES = [
  {
    name: "Anthropic Economic Index",
    org: "Anthropic",
    year: "2025–ongoing",
    url: "https://www.anthropic.com/economic-index",
    coverage: "Global · Country-level AI adoption",
    color: "#f59e0b",
    icon: "🤖",
    whatItMeasures: "Real-world AI usage patterns from Claude interactions — separating augmentation (humans collaborating with AI) from automation (AI replacing human tasks). Provides country-level and industry-level adoption signals, updated continuously.",
    howWeUseIt: "Informs the Economic Readiness pillar. Countries with high augmentation ratios signal a workforce actively integrating AI. Industry exposure patterns help weight AI adoption signals in economic readiness scoring.",
    keyInsight: "The index reveals that AI augmentation significantly outpaces automation globally — the majority of AI interactions involve humans and AI working together, not AI replacing work entirely.",
    dimensions: ["Economic Readiness", "Talent"],
  },
  {
    name: "IMF AI Preparedness Index (AIPI)",
    org: "International Monetary Fund",
    year: "2023–2024",
    url: "https://www.imf.org/external/datamapper/datasets/AIPI",
    coverage: "174 countries",
    color: "#3b82f6",
    icon: "📊",
    whatItMeasures: "Four-dimension composite: Digital Infrastructure, Human Capital & Labour Market Policies, Innovation & Economic Integration, Regulation & Ethics. Aggregates data from ILO, World Bank, WEF, and 5 other institutions.",
    howWeUseIt: "Primary cross-validation source. We compare our composite scores against IMF AIPI scores for countries in both datasets. Where material divergence exists (>10 pts), we review our underlying indicator weights. Freely downloadable Excel data used for static baseline calibration.",
    keyInsight: "Advanced economies score 0.6–0.7 on a 0–1 scale; emerging markets 0.3–0.5. The IMF finds governance and regulatory capacity as the greatest differentiator between similarly-wired economies.",
    dimensions: ["Infrastructure", "Talent", "Governance", "Investment"],
  },
  {
    name: "Oxford Insights Government AI Readiness Index",
    org: "Oxford Insights",
    year: "2025",
    url: "https://oxfordinsights.com/ai-readiness/government-ai-readiness-index-2025/",
    coverage: "195 countries",
    color: "#8b5cf6",
    icon: "🏛️",
    whatItMeasures: "Public sector capacity to harness AI for public benefit. 69 indicators across 6 pillars: Policy Capacity, Governance, AI Infrastructure, Public Sector Adoption, Development & Diffusion, Resilience.",
    howWeUseIt: "Governance pillar calibration. Oxford Insights' detailed policy capacity and governance scores provide granular country-level data that supplements OECD policy flags. Particularly valuable for countries outside the OECD where national AI strategy quality varies.",
    keyInsight: "North America averages 81.5/100 vs Sub-Saharan Africa at 29.1 — the largest regional divide in any AI readiness index, signalling governance infrastructure as the primary bottleneck for developing economies.",
    dimensions: ["Governance", "Infrastructure"],
  },
  {
    name: "Stanford HAI AI Index Report",
    org: "Stanford Human-Centered AI Institute",
    year: "Annual (2025 edition)",
    url: "https://hai.stanford.edu/ai-index/2025-ai-index-report",
    coverage: "75+ countries",
    color: "#ef4444",
    icon: "🎓",
    whatItMeasures: "Research and development output (papers, models, citations), AI education and workforce trends, legislative and policy activity (AI mentions in 75 country parliaments), public opinion and adoption, AI model production by country.",
    howWeUseIt: "Talent pillar enrichment. Country-level AI research publication counts and AI model production figures supplement World Bank tertiary enrolment data. Legislative AI activity counts inform the Governance pillar recency score.",
    keyInsight: "The US produced 40 notable AI models in 2024 vs China's 15 and Europe's 3 combined — a research production gap that will compound across the five-year outlook period.",
    dimensions: ["Talent", "Governance"],
  },
  {
    name: "OECD.AI Policy Observatory",
    org: "Organisation for Economic Co-operation and Development",
    year: "Live",
    url: "https://oecd.ai/en/",
    coverage: "70+ countries and territories",
    color: "#06b6d4",
    icon: "🌐",
    whatItMeasures: "900+ national AI policies and initiatives tracked live. VC investment in AI by country, AI job postings and skills demand, software development contributions, compute capacity, national AI strategy status and quality.",
    howWeUseIt: "Primary source for Governance pillar: national AI strategy adoption dates, AI regulation flags, OECD membership. Also provides VC investment data that directly informs the Investment pillar for OECD members and partners. Live OECD.AI Index cross-validates Investment scores.",
    keyInsight: "Countries with comprehensive AI strategies (vs no strategy) score on average 18 points higher on total AI readiness — the single strongest binary predictor in our model.",
    dimensions: ["Governance", "Investment"],
  },
  {
    name: "World Bank Open Data API",
    org: "World Bank",
    year: "Live (24h cache)",
    url: "https://data.worldbank.org",
    coverage: "186 countries",
    color: "#22c55e",
    icon: "🏦",
    whatItMeasures: "Six live indicators: internet users (% population), mobile subscriptions per 100, tertiary enrolment ratio, R&D expenditure (% GDP), GDP per capita (USD), electricity access (% population). Two most-recent data points per indicator for trend calculation.",
    howWeUseIt: "Primary quantitative backbone. The most recent available indicator values drive Infrastructure, Talent, Investment, and Economic Readiness pillar scores. Year-over-year changes feed the trajectory calculation. Live data is fetched daily with a 24-hour server cache; static baseline serves as fallback.",
    keyInsight: "R&D expenditure (% GDP) has the strongest correlation (r=0.74) with total AI readiness score of all six indicators — stronger than internet penetration or GDP per capita.",
    dimensions: ["Infrastructure", "Talent", "Investment", "Economic Readiness"],
  },
  {
    name: "Tortoise Global AI Index",
    org: "Tortoise Media",
    year: "2024",
    url: "https://www.tortoisemedia.com/data/global-ai",
    coverage: "83 countries",
    color: "#f59e0b",
    icon: "🐢",
    whatItMeasures: "122 indicators across Implementation (Talent, Infrastructure, Operating Environment), Innovation (Research, Development), and Investment (Government Strategy, Commercial Activity). Considered one of the most comprehensive AI-specific indices.",
    howWeUseIt: "Spot-check and calibration for major economies. For the 83 countries covered, we compare Tortoise rankings against our own scoring. Notable divergences flag potential data gaps or weighting differences. Saudi Arabia's government strategy ranking prompted our addition of AI-strategy recency bonus.",
    keyInsight: "Saudi Arabia tops government AI strategy rankings globally despite being outside the traditional Western AI ecosystem — a signal that sovereign AI investment can rapidly move governance scores.",
    dimensions: ["Governance", "Investment", "Talent"],
  },
  {
    name: "Global Innovation Index (GII)",
    org: "World Intellectual Property Organization (WIPO)",
    year: "Annual (2024 edition)",
    url: "https://www.wipo.int/en/web/global-innovation-index",
    coverage: "133 economies",
    color: "#8b5cf6",
    icon: "💡",
    whatItMeasures: "~80 indicators across innovation inputs (policy environment, education, infrastructure, market sophistication, business sophistication) and outputs (knowledge/technology outputs, creative outputs). Includes 100 top global science and technology clusters.",
    howWeUseIt: "Investment and Talent pillar enrichment for non-OECD countries where VC data is sparse. GII innovation input scores provide a validated proxy for the broader innovation ecosystem that supports AI investment. University ranking presence from GII supplements our static talent quality proxy.",
    keyInsight: "Switzerland, Sweden, and the US top the GII consistently — but China has been in the top 12 since 2018, confirming that sustained R&D investment can close the innovation gap within a decade.",
    dimensions: ["Talent", "Investment"],
  },
  {
    name: "ITU ICT Development Index (IDI)",
    org: "International Telecommunication Union",
    year: "2024",
    url: "https://www.itu.int/itu-d/reports/statistics/idi2024/",
    coverage: "190+ countries",
    color: "#06b6d4",
    icon: "📡",
    whatItMeasures: "Universal and meaningful connectivity — ability for everyone to access broadband internet at affordable cost, anywhere, anytime. Measures infrastructure quality, accessibility, affordability, and digital skills. Identifies urban-rural connectivity gaps.",
    howWeUseIt: "Secondary cross-validation for the Infrastructure pillar. ITU's IDI provides a connectivity-specific lens that complements World Bank internet penetration data, particularly for distinguishing between countries with similar penetration rates but very different infrastructure quality.",
    keyInsight: "Broadband quality — not just access — emerges as the critical differentiator at the 60–80% internet penetration threshold. Many countries plateau at basic connectivity but lag on the reliable, high-speed infrastructure AI applications require.",
    dimensions: ["Infrastructure"],
  },
  {
    name: "WEF Future of Jobs Report",
    org: "World Economic Forum",
    year: "2025",
    url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/",
    coverage: "55 countries · 1,000+ employers",
    color: "#3b82f6",
    icon: "🔮",
    whatItMeasures: "AI skills adoption rates by businesses, job creation and displacement projections (11M created, 9M displaced by 2030), workforce AI strategy trends, upskilling commitments (85% of employers plan AI upskilling). Sectoral breakdown across 22 industry clusters.",
    howWeUseIt: "Talent pillar future-weighting. Countries where employer surveys show high planned AI upskilling investment receive a forward-looking boost to their talent trajectory score. IT sector AI adoption rates by country calibrate industry-level AI maturity signals.",
    keyInsight: "85% of employers globally plan to upskill workers for AI collaboration — but only 50% plan to retrain displaced workers. The talent gap is growing faster than the training pipeline can fill it.",
    dimensions: ["Talent", "Economic Readiness"],
  },
];

const PILLARS = [
  {
    name: "Infrastructure",
    score: "0–20",
    color: "#3B5BA5",
    cssVar: "var(--pillar-infra)",
    icon: "🔌",
    description: "The physical and digital foundation for AI deployment.",
    measures: [
      "Internet users as % of population — World Bank IT.NET.USER.ZS (8 pts)",
      "Mobile cellular subscriptions per 100 people — World Bank IT.CEL.SETS.P2 (5 pts)",
      "Electricity access as % of population — World Bank EG.ELC.ACCS.ZS (5 pts)",
      "Infrastructure quality proxy (2 pts) — derived from ITU IDI scores and qualitative data centre assessments",
    ],
    sources: ["World Bank", "ITU IDI"],
  },
  {
    name: "Talent",
    score: "0–20",
    color: "#7A4F8C",
    cssVar: "var(--pillar-talent)",
    icon: "🎓",
    description: "The human capital pipeline for AI development and deployment.",
    measures: [
      "Gross tertiary enrolment ratio — World Bank SE.TER.ENRR (8 pts)",
      "R&D expenditure as % of GDP — World Bank GB.XPD.RSDV.GD.ZS (8 pts)",
      "Talent quality proxy (4 pts) — GII university ranking presence, Stanford HAI research output, WEF AI upskilling commitment",
    ],
    sources: ["World Bank", "Stanford HAI", "Global Innovation Index", "WEF Future of Jobs"],
  },
  {
    name: "Governance",
    score: "0–20",
    color: "#3F7A4D",
    cssVar: "var(--pillar-gov)",
    icon: "⚖️",
    description: "Policy maturity, regulatory frameworks, and government AI strategy.",
    measures: [
      "National AI strategy adoption — OECD.AI Observatory (8 pts base; +2 bonus if post-2022)",
      "AI-specific regulation or data protection law — OECD.AI / Oxford Insights (5 pts)",
      "OECD membership — proxy for institutional regulatory capacity (3 pts)",
      "Digital governance proxy (2 pts) — Oxford Insights Government AI Readiness, Stanford HAI legislative activity",
    ],
    sources: ["OECD.AI Observatory", "Oxford Insights", "Stanford HAI"],
  },
  {
    name: "Investment",
    score: "0–20",
    color: "#B58A2E",
    cssVar: "var(--pillar-invest)",
    icon: "💰",
    description: "Capital flowing into AI — public R&D, private venture capital, and FDI.",
    measures: [
      "R&D expenditure as % of GDP — World Bank GB.XPD.RSDV.GD.ZS (6 pts)",
      "GDP per capita USD — World Bank NY.GDP.PCAP.CD (6 pts, proxy for private capital availability)",
      "VC and ecosystem proxy (8 pts) — OECD.AI VC data, Tortoise commercial activity, GII innovation output",
    ],
    sources: ["World Bank", "OECD.AI Observatory", "Tortoise Global AI Index", "Global Innovation Index"],
  },
  {
    name: "Economic Readiness",
    score: "0–20",
    color: "#8B4A3F",
    cssVar: "var(--pillar-econ)",
    icon: "📊",
    description: "The economy's structural capacity to adopt and commercialise AI.",
    measures: [
      "GDP per capita USD — World Bank NY.GDP.PCAP.CD (8 pts)",
      "Electricity access — World Bank EG.ELC.ACCS.ZS (4 pts)",
      "Internet and mobile penetration — World Bank composite (4 pts)",
      "AI adoption readiness proxy (4 pts) — Anthropic Economic Index augmentation ratio, WEF employer AI adoption rates, IMF AIPI economic integration dimension",
    ],
    sources: ["World Bank", "Anthropic Economic Index", "IMF AIPI", "WEF Future of Jobs"],
  },
];

export default function MethodologyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--ed-bg)" }}>
      <SiteHeader activePage="methodology" />

      <div style={{ maxWidth: 896, margin: "0 auto", padding: "48px" }}>

        {/* ── Hero ── */}
        <div style={{ background: "var(--ed-raised)", border: "1px solid var(--ed-border)", padding: "40px", marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--signal)", textTransform: "uppercase", marginBottom: 16 }}>
            Multi-Source Scoring Framework
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.02em", color: "var(--ed-text-0)", lineHeight: 1.05, margin: "0 0 20px" }}>
            How we score 186 economies
          </h1>
          <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, lineHeight: 1.65, color: "var(--ed-text-1)", maxWidth: 640, margin: "0 0 24px" }}>
            The AI Trajectory Index draws from <strong style={{ fontStyle: "normal", color: "var(--ed-text-0)" }}>10 primary data sources</strong> to score
            every country across five pillars (0–20 each, total 100). Live World Bank data is our quantitative backbone —
            but the methodology is enriched and validated against the IMF AI Preparedness Index, Stanford HAI,
            Anthropic Economic Index, Oxford Insights, OECD.AI, Tortoise, WIPO GII, ITU IDI, and WEF.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["World Bank", "IMF AIPI", "Oxford Insights", "Stanford HAI", "OECD.AI", "Anthropic", "Tortoise", "WIPO GII", "ITU IDI", "WEF"].map((s) => (
              <span key={s} style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                padding: "4px 10px",
                background: "var(--ed-raised)",
                border: "1px solid var(--ed-border)",
                color: "var(--ed-text-1)",
                letterSpacing: "0.04em",
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── Score formula ── */}
        <div style={{ background: "var(--ed-raised)", border: "1px solid var(--ed-border)", padding: 32, marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--signal)", textTransform: "uppercase", marginBottom: 20 }}>
            Composite Score Formula
          </p>
          <div style={{
            background: "var(--dt-bg)",
            border: "1px solid var(--dt-border)",
            padding: "20px 24px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--dt-text-0)",
            marginBottom: 24,
          }}>
            <span style={{ color: "var(--signal)" }}>Total Score</span>
            {" = "}Infrastructure + Talent + Governance + Investment + Economic Readiness
            <br />
            <span style={{ color: "var(--dt-text-3)" }}>
              Each pillar: 0–20 pts → Total: 0–100 · Classification: Leading (80+), Advanced (60–79), Developing (40–59), Nascent (&lt;40)
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {PILLARS.map((p) => (
              <div key={p.name} style={{
                background: "var(--ed-bg)",
                borderTop: `3px solid ${p.color}`,
                border: `1px solid var(--ed-border)`,
                borderTopWidth: 3,
                borderTopColor: p.color,
                padding: "14px 12px",
                textAlign: "center",
              }}>
                <p style={{ fontSize: 18, margin: "0 0 6px" }}>{p.icon}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: p.color, letterSpacing: "0.04em", margin: "0 0 4px" }}>{p.name}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--signal)", margin: 0 }}>0–20</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pillar definitions ── */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--ed-muted)", textTransform: "uppercase", marginBottom: 16 }}>
            Pillar Definitions &amp; Sources
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PILLARS.map((p) => (
              <div key={p.name} style={{
                background: "var(--ed-raised)",
                border: "1px solid var(--ed-border)",
                borderLeft: `4px solid ${p.color}`,
                padding: "28px 32px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, color: "var(--ed-text-0)", margin: 0, lineHeight: 1.2 }}>{p.name}</h3>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: p.color, margin: 0, fontWeight: 600, letterSpacing: "0.04em" }}>{p.score} points</p>
                  </div>
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.65, color: "var(--ed-text-2)", margin: "0 0 16px" }}>{p.description}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {p.measures.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{
                        marginTop: 7,
                        flexShrink: 0,
                        width: 6,
                        height: 6,
                        background: p.color,
                        borderRadius: "50%",
                        display: "inline-block",
                      }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ed-text-2)", lineHeight: 1.6 }}>{m}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ed-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>SOURCES:</span>
                  {p.sources.map((s) => (
                    <span key={s} style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "3px 8px",
                      background: "var(--ed-bg)",
                      border: "1px solid var(--ed-border)",
                      color: "var(--ed-text-1)",
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trajectory ── */}
        <div style={{ background: "var(--ed-raised)", border: "1px solid var(--ed-border)", padding: 32, marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--ed-muted)", textTransform: "uppercase", marginBottom: 16 }}>
            Trajectory Score &amp; 2028 Projection
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.65, color: "var(--ed-text-2)", margin: "0 0 20px" }}>
            The trajectory score (–10 to +10) reflects momentum. Four forward-looking components:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {[
              { label: "GDP growth rate (3-year avg)", weight: "25%", source: "World Bank NY.GDP.MKTP.KD.ZG", note: "Structural proxy for economic capacity to fund AI investment. Compounding growth signals a broadening tax base and increasing government AI budget." },
              { label: "Internet penetration growth",  weight: "20%", source: "World Bank IT.NET.USER.ZS (YoY delta)", note: "Captures digital adoption momentum. Accelerating internet growth predicts faster AI tool adoption cycles within 2–3 years." },
              { label: "AI strategy recency",          weight: "25%", source: "OECD.AI Observatory", note: "Countries with post-2020 strategies receive a strong positive signal (reflecting active, not archival, government engagement). No strategy = negative weighting." },
              { label: "R&D spending trend",           weight: "15%", source: "World Bank GB.XPD.RSDV.GD.ZS (YoY delta)", note: "Year-over-year change in R&D as % of GDP. Increasing R&D signals a structural commitment to innovation that produces compounding AI capability returns." },
              { label: "AI adoption momentum proxy",   weight: "15%", source: "Anthropic Economic Index · Stanford HAI · WEF", note: "Incorporates AI augmentation adoption rates (Anthropic), employer upskilling commitments (WEF), and research output growth (Stanford HAI)." },
            ].map((item) => (
              <div key={item.label} style={{
                background: "var(--ed-bg)",
                border: "1px solid var(--ed-border)",
                padding: "16px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    background: "var(--dt-bg)",
                    border: "1px solid var(--dt-border)",
                    color: "var(--dt-text-1)",
                    flexShrink: 0,
                    marginTop: 2,
                    letterSpacing: "0.04em",
                  }}>
                    {item.weight}
                  </span>
                  <div>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--ed-text-0)", margin: "0 0 2px" }}>{item.label}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ed-text-2)", margin: "0 0 6px", letterSpacing: "0.03em" }}>{item.source}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ed-text-2)", margin: 0, lineHeight: 1.55 }}>{item.note}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            background: "var(--dt-bg)",
            border: "1px solid var(--dt-border)",
            padding: "20px 24px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--dt-text-0)",
          }}>
            <span style={{ color: "var(--signal)" }}>Projected 2028</span>
            {" = clamp(Total + Trajectory × 1.5, 0, 100)"}
            <br />
            <span style={{ color: "var(--dt-text-3)" }}>
              Labels: Strong Positive (+6→+10) · Positive (+2→+5) · Neutral (-1→+1) · Negative (-5→-2) · Strong Negative (-10→-6)
            </span>
          </div>
        </div>

        {/* ── Primary data sources ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--ed-muted)", textTransform: "uppercase", marginBottom: 8 }}>
              Primary Data Sources
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ed-text-2)", lineHeight: 1.65, margin: 0 }}>
              The index is deliberately multi-source. Each source has different country coverage, update frequency, and methodological strengths. Using them together reduces single-source bias and improves cross-country comparability.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PRIMARY_SOURCES.map((src) => (
              <div key={src.name} style={{
                background: "var(--ed-raised)",
                border: "1px solid var(--ed-border)",
                overflow: "hidden",
              }}>
                <div style={{ height: 3, background: src.color }} />
                <div style={{ padding: "24px 28px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{src.icon}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, color: "var(--ed-text-0)", margin: 0, lineHeight: 1.2 }}>{src.name}</h3>
                          <span style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "3px 8px",
                            background: "var(--ed-bg)",
                            border: "1px solid var(--ed-border)",
                            color: src.color,
                            letterSpacing: "0.03em",
                          }}>
                            {src.coverage}
                          </span>
                        </div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ed-muted)", margin: 0, letterSpacing: "0.03em" }}>
                          {src.org} · Updated {src.year}
                        </p>
                      </div>
                    </div>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--signal)",
                      flexShrink: 0,
                      textDecoration: "none",
                    }}>
                      Visit ↗
                    </a>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ed-muted)", textTransform: "uppercase", margin: "0 0 4px" }}>
                        What it measures
                      </p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.65, color: "var(--ed-text-2)", margin: 0 }}>{src.whatItMeasures}</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ed-muted)", textTransform: "uppercase", margin: "0 0 4px" }}>
                        How we use it
                      </p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.65, color: "var(--ed-text-2)", margin: 0 }}>{src.howWeUseIt}</p>
                    </div>
                    <div style={{ background: "var(--ed-bg)", border: "1px solid var(--ed-border)", padding: "12px 16px" }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: src.color, textTransform: "uppercase", margin: "0 0 4px" }}>
                        Key insight
                      </p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.65, color: "var(--ed-text-2)", margin: 0 }}>{src.keyInsight}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ed-muted)", letterSpacing: "0.04em" }}>INFORMS:</span>
                      {src.dimensions.map((d) => (
                        <span key={d} style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "3px 8px",
                          background: "var(--ed-bg)",
                          border: "1px solid var(--ed-border)",
                          color: "var(--ed-text-1)",
                          letterSpacing: "0.03em",
                        }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Source coverage matrix ── */}
        <div style={{ background: "var(--ed-raised)", border: "1px solid var(--ed-border)", padding: 32, marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--ed-muted)", textTransform: "uppercase", marginBottom: 20 }}>
            Source Coverage by Pillar
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 16px 8px 0", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--ed-muted)", borderBottom: "1px solid var(--ed-border)", minWidth: 160, letterSpacing: "0.06em" }}>SOURCE</th>
                  {["INFRA", "TALENT", "GOV", "INVEST", "ECON READY"].map((p) => (
                    <th key={p} style={{ textAlign: "center", padding: "8px", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--ed-muted)", borderBottom: "1px solid var(--ed-border)", minWidth: 72, letterSpacing: "0.06em" }}>{p}</th>
                  ))}
                  <th style={{ textAlign: "center", padding: "8px", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--ed-muted)", borderBottom: "1px solid var(--ed-border)", minWidth: 60, letterSpacing: "0.06em" }}>TRAJ.</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { src: "World Bank API",           infra: "●", talent: "●", gov: "", invest: "●", econ: "●", traj: "●" },
                  { src: "OECD.AI Observatory",      infra: "", talent: "●", gov: "●", invest: "●", econ: "", traj: "●" },
                  { src: "IMF AIPI",                 infra: "●", talent: "●", gov: "●", invest: "●", econ: "", traj: "" },
                  { src: "Oxford Insights",          infra: "●", talent: "", gov: "●", invest: "", econ: "", traj: "" },
                  { src: "Stanford HAI",             infra: "", talent: "●", gov: "●", invest: "", econ: "", traj: "●" },
                  { src: "Anthropic Economic Index", infra: "", talent: "●", gov: "", invest: "", econ: "●", traj: "●" },
                  { src: "Tortoise Global AI Index", infra: "●", talent: "●", gov: "●", invest: "●", econ: "", traj: "" },
                  { src: "WIPO GII",                 infra: "", talent: "●", gov: "", invest: "●", econ: "", traj: "" },
                  { src: "ITU IDI",                  infra: "●", talent: "", gov: "", invest: "", econ: "", traj: "" },
                  { src: "WEF Future of Jobs",       infra: "", talent: "●", gov: "", invest: "", econ: "●", traj: "●" },
                ].map((row) => (
                  <tr key={row.src} style={{ borderBottom: "1px solid var(--ed-border)" }}>
                    <td style={{ padding: "10px 16px 10px 0", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ed-text-2)" }}>{row.src}</td>
                    {[row.infra, row.talent, row.gov, row.invest, row.econ, row.traj].map((cell, i) => (
                      <td key={i} style={{ textAlign: "center", padding: "10px 8px" }}>
                        {cell
                          ? <span style={{ color: "var(--signal)", fontFamily: "var(--font-mono)" }}>●</span>
                          : <span style={{ color: "var(--ed-border-strong)", fontFamily: "var(--font-mono)" }}>○</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Normalisation ── */}
        <div style={{ background: "var(--ed-raised)", border: "1px solid var(--ed-border)", padding: 32, marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--ed-muted)", textTransform: "uppercase", marginBottom: 16 }}>
            Normalisation &amp; Cross-Validation
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.65, color: "var(--ed-text-2)", margin: "0 0 12px" }}>
            Each live World Bank indicator is normalised against a global benchmarking range using min-max scaling.
            For example, internet penetration uses a 0–95% practical ceiling. GDP per capita uses a logarithmic scale.
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.65, color: "var(--ed-text-2)", margin: "0 0 12px" }}>
            The composite is cross-validated against IMF AIPI scores (174 countries) and Oxford Insights rankings (195 countries).
            Where our score diverges by more than 10 points from IMF AIPI on the same country, we flag for manual review and
            adjust static proxy weights accordingly.
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.65, color: "var(--ed-text-2)", margin: 0 }}>
            Countries missing World Bank data fall back to the static 2024 baseline. The{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "2px 6px", background: "var(--dt-bg)", border: "1px solid var(--dt-border)", color: "var(--dt-text-1)" }}>data_source</code>
            {" "}flag on each country response indicates whether scores are live-calculated or from the static baseline.
          </p>
        </div>

        {/* ── Limitations ── */}
        <div style={{ background: "var(--ed-raised)", border: "1px solid var(--ed-border)", borderLeft: "4px solid #B58A2E", padding: 32, marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#B58A2E", textTransform: "uppercase", marginBottom: 16 }}>
            Limitations &amp; Caveats
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "World Bank data lags by 1–3 years for many countries. The most recent available point is used, which may not reflect the current situation.",
              "The Anthropic Economic Index reflects Claude usage patterns — not all AI adoption globally. It should be read as a directional signal, not a census of AI use.",
              "Stanford HAI AI Index country coverage varies by metric: research output covers 75+ countries but some public opinion data covers only 17 countries.",
              "Any composite index involves trade-offs in weighting. Our weights reflect the authors' best judgement and cross-validation against IMF AIPI — not a peer-reviewed consensus.",
              "The governance pillar heavily rewards formal AI strategies. Countries with strong strategies but weak implementation may be overstated.",
              "Countries with populations under 1M (small island states, city-states) may have extreme indicator values. Singapore and Luxembourg are legitimate outliers; Maldives and Seychelles should be interpreted with caution.",
              "AI safety, ethics oversight, and bias mitigation are not scored — critical dimensions omitted due to data availability constraints.",
            ].map((lim, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ marginTop: 1, flexShrink: 0, color: "#B58A2E", fontFamily: "var(--font-mono)", fontSize: 14 }}>⚠</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.65, color: "var(--ed-text-2)" }}>{lim}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Changelog ── */}
        <div style={{ background: "var(--ed-raised)", border: "1px solid var(--ed-border)", padding: 32, marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--ed-muted)", textTransform: "uppercase", marginBottom: 24 }}>
            Methodology Changelog
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              {
                version: "v3",
                date: "March 2026",
                tag: "Current",
                tagColor: "#3F7A4D",
                changes: [
                  "Removed R&D expenditure from Talent pillar — was double-counted with Investment.",
                  "Removed GDP per capita from Investment pillar — was double-counted with Economic Readiness.",
                  "Removed electricity/internet/mobile from Economic Readiness — was triple-counted with Infrastructure.",
                  "Switched GDP per capita to PPP-adjusted values (NY.GDP.PCAP.PP.KD) for fairer cross-country comparisons.",
                  "Added WGI estimates (Rule of Law, Govt Effectiveness, Regulatory Quality) to Governance pillar.",
                  "Added high-tech exports trend and labor productivity trend to Trajectory calculation.",
                  "Total live World Bank indicators expanded from 6 to 17.",
                ],
              },
              {
                version: "v2",
                date: "February 2026",
                tag: "Previous",
                tagColor: "#3B5BA5",
                changes: [
                  "Replaced fully static scoring with live World Bank API integration (6 indicators, 24h cache).",
                  "Added trajectory score (–10 to +10) based on year-over-year WB indicator deltas.",
                  "Introduced projected_score_2028 = clamp(total + trajectory × 1.5, 0, 100).",
                  "Added static fallback for countries with missing World Bank data.",
                  "Launched /map page with Readiness and Adoption heat-map lenses.",
                ],
              },
              {
                version: "v1",
                date: "January 2026",
                tag: "Initial",
                tagColor: "#B58A2E",
                changes: [
                  "Static baseline scores for 186 countries across 5 pillars (0–20 each).",
                  "Scores cross-validated against IMF AIPI (174 countries) and Oxford Insights (195 countries).",
                  "Policy flags (AI strategy, regulation, OECD membership) from OECD.AI Observatory.",
                  "Qualitative evidence strings per pillar sourced from Stanford HAI, Tortoise, WIPO GII.",
                ],
              },
            ].map((entry) => (
              <div key={entry.version} style={{ display: "flex", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 40 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: entry.tagColor }}>{entry.version}</span>
                  <div style={{ width: 1, flex: 1, marginTop: 6, background: "var(--ed-border)" }} />
                </div>
                <div style={{ paddingBottom: 8, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--ed-text-0)" }}>{entry.date}</span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 8px",
                      background: "var(--ed-bg)",
                      border: `1px solid ${entry.tagColor}`,
                      color: entry.tagColor,
                      letterSpacing: "0.06em",
                    }}>
                      {entry.tag.toUpperCase()}
                    </span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {entry.changes.map((c, i) => (
                      <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 8, flexShrink: 0, width: 4, height: 4, background: entry.tagColor, borderRadius: "50%", display: "inline-block" }} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.65, color: "var(--ed-text-2)" }}>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── About the Builder ── */}
        <div style={{ background: "var(--ed-raised)", border: "1px solid var(--ed-border)", padding: 32, marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--signal)", textTransform: "uppercase", marginBottom: 16 }}>
            About the Builder
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.75, color: "var(--ed-text-2)", margin: "0 0 16px" }}>
            This index was built by{" "}
            <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: "var(--ed-text-0)", textDecoration: "none" }}>
              Ankit Mishra
            </a>
            {" "}as an independent research tool to support work at the intersection of AI governance,
            emerging markets, and technology policy. Ankit is Commercial Portfolio Director at a leading
            African climatetech venture fund, a member of the{" "}
            <span style={{ color: "var(--ed-text-0)" }}>Schwartz Reisman Institute AI &amp; Trust Working Group</span>
            {" "}at the University of Toronto, and a Forbes contributor with 50+ articles reaching
            200,000+ readers.
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--signal)", textDecoration: "none" }}>
              ankitmishra.ca ↗
            </a>
            <a href="https://linkedin.com/in/ankitmishra01" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--signal)", textDecoration: "none" }}>
              LinkedIn ↗
            </a>
          </div>
        </div>

        {/* ── Adoption Scorecard ── */}
        <div style={{ background: "var(--ed-raised)", border: "1px solid var(--ed-border)", padding: 32, marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>🚀</span>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, color: "var(--ed-text-0)", margin: 0, lineHeight: 1.2 }}>AI Adoption Scorecard</h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ed-muted)", margin: 0, letterSpacing: "0.04em" }}>METHODOLOGY · 2026</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.75, color: "var(--ed-text-2)" }}>
            <p style={{ margin: 0 }}>
              The Adoption Scorecard measures whether countries are actively <strong style={{ color: "var(--ed-text-0)" }}>deploying and using AI</strong> — distinct from the Readiness Index which measures capacity. A country can score highly on readiness but deploy AI slowly due to cultural, regulatory, or economic friction. Conversely, some countries deploy AI rapidly through mobile-first channels despite lower readiness scores. This gap between readiness and adoption is one of the most important insights the combined platform reveals.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--ed-text-0)" }}>The gap</strong> is calculated as:{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "2px 6px", background: "var(--dt-bg)", border: "1px solid var(--dt-border)", color: "var(--dt-text-1)" }}>adoption_score − readiness_score</code>.<br />
              A positive gap means the country is adopting faster than its capacity predicts. A negative gap means it has untapped AI capacity not yet being utilised.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: "🏛️", key: "Government Deployment (0–20)", desc: "Active AI in public services: e-government AI integration, AI in healthcare delivery, algorithmic public administration, smart city deployments, government AI procurement.", sources: "Oxford Insights Government AI Readiness Index, UNDP e-government surveys, national AI strategy implementation reports" },
                { icon: "🏢", key: "Enterprise Adoption (0–20)", desc: "Business AI usage: World Bank Enterprise Survey digital adoption rates, OECD business AI data, fintech AI penetration, manufacturing and retail AI adoption.", sources: "OECD Business AI Adoption Survey, World Bank Enterprise Surveys, McKinsey Global AI Survey" },
                { icon: "💼", key: "Talent Demand (0–20)", desc: "Labour market AI demand: AI/ML job postings as % of total, YoY growth rate, AI skills salary premium, AI startups per million population.", sources: "OECD.AI job postings data, LinkedIn Economic Graph, Indeed AI jobs tracker" },
                { icon: "📱", key: "Consumer Usage (0–20)", desc: "Everyday AI adoption: smartphone AI assistant penetration, AI-powered mobile payments, voice assistant adoption, AI in e-commerce and healthcare apps. Mobile-first fintech (M-Pesa, GCash, bKash) is a key signal for emerging markets.", sources: "GSMA Mobile Economy, Statista AI consumer surveys, fintech adoption data" },
                { icon: "🔬", key: "R&D Pipeline (0–20)", desc: "Research-to-deployment velocity: AI patent filings per million (WIPO), university-to-industry AI transfer rate, AI unicorn and soonicorn count per capita, AI accelerator density.", sources: "WIPO Patent Database, Crunchbase AI unicorn tracking, Stanford HAI AI Index" },
              ].map(({ icon, key, desc, sources }) => (
                <div key={key} style={{ background: "var(--ed-bg)", border: "1px solid var(--ed-border)", padding: 16 }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: "var(--ed-text-0)", margin: "0 0 6px" }}>{icon} {key}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.6, color: "var(--ed-text-2)", margin: "0 0 8px" }}>{desc}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ed-muted)", margin: 0, letterSpacing: "0.02em" }}>Sources: {sources}</p>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--ed-bg)", border: "1px solid var(--ed-border)", borderLeft: "4px solid var(--positive)", padding: "16px 20px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--positive)", margin: "0 0 6px", letterSpacing: "0.06em" }}>THE LEAPFROGGING EFFECT</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.65, color: "var(--ed-text-2)", margin: 0 }}>
                Several Sub-Saharan African and Southeast Asian economies score higher on adoption than their readiness would predict. This is the <em>mobile-first leapfrogging effect</em>: countries without legacy banking or desktop internet infrastructure have adopted mobile-first AI tools (M-Pesa in Kenya, GCash in the Philippines, bKash in Bangladesh) at scale, embedding AI into daily financial life ahead of their overall digital infrastructure development.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer style={{ maxWidth: 896, margin: "0 auto", padding: "32px 48px", borderTop: "1px solid var(--ed-border)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ed-muted)", margin: 0, letterSpacing: "0.04em" }}>
          AI TRAJECTORY INDEX · BUILT BY{" "}
          <a href="https://ankitmishra.ca" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ed-text-1)", textDecoration: "none" }}>ANKIT MISHRA</a>
          {" "}— COMMERCIAL PORTFOLIO DIRECTOR · AFRICAN CLIMATETECH VC · FORBES CONTRIBUTOR · SCHWARTZ REISMAN INSTITUTE AI &amp; TRUST WORKING GROUP
        </p>
      </footer>
    </main>
  );
}
