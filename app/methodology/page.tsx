import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import SiteHeader from "@/components/SiteHeader";
import {
  METHODOLOGY_COMPONENTS,
  PILLAR_KEYS,
  PILLAR_METADATA,
} from "@/lib/methodology";

export const metadata: Metadata = {
  title: "Methodology | AI Trajectory Index",
  description:
    "Scoring formulas, indicator definitions, source precedence, missing-data policy, and limitations for the AI Trajectory Index.",
  alternates: { canonical: "https://ai-trajectory-index.vercel.app/methodology" },
};

const SITE_CITATION =
  "Mishra, A. (2026). AI Trajectory Index (Version 3). https://ai-trajectory-index.vercel.app";

const READINESS_COMPONENTS = METHODOLOGY_COMPONENTS.filter(
  (item) => item.pointsAvailable > 0,
);

const sourceKindLabel = {
  live: "Live source",
  maintained: "Maintained source",
  fallback: "Static baseline",
} as const;

interface PageProps {
  searchParams?: { q?: string };
}

export default function MethodologyPage({ searchParams }: PageProps) {
  const query = searchParams?.q?.trim().toLowerCase() ?? "";
  const dictionary = METHODOLOGY_COMPONENTS.filter((item) => {
    if (!query) return true;
    return [item.label, item.key, item.pillar, item.source, item.indicatorCode ?? "", item.notes]
      .some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className="min-h-screen methodology-page">
      <SiteHeader activePage="methodology" citation={SITE_CITATION} />

      <main className="methodology-shell">
        <header className="methodology-hero">
          <p className="eyebrow">Research protocol · Version 3 · 2026 edition</p>
          <h1>How the index is built</h1>
          <p className="methodology-deck">
            The Readiness Index combines five 20-point pillars into a 100-point score.
            Trajectory is a separate directional measure. Adoption is a separate lens and
            never changes the Readiness score.
          </p>
          <div className="methodology-actions no-print" aria-label="Methodology downloads">
            <a className="button-primary" href="/api/methodology.csv" download>Download methodology CSV</a>
            <a className="button-secondary" href="https://github.com/ankitmishra01/ai-trajectory-index#methodology" target="_blank" rel="noopener noreferrer">Read implementation notes</a>
          </div>
        </header>

        <nav className="methodology-jump no-print" aria-label="Methodology sections">
          {[["formula", "Formula"], ["weights", "Pillar weights"], ["dictionary", "Data dictionary"], ["precedence", "Source precedence"], ["missing-data", "Missing data"], ["limitations", "Limitations"], ["downloads", "Downloads"]].map(([id, label]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>

        <section id="formula" className="methodology-section" aria-labelledby="formula-title">
          <SectionHeading number="01" id="formula-title" title="Formula overview">Two analytical lenses, one transparent readiness calculation.</SectionHeading>
          <div className="formula-grid">
            <article className="formula-card formula-card-primary">
              <p className="formula-kicker">Readiness · Primary index</p>
              <strong>Infrastructure + Talent + Governance + Investment + Economic Readiness</strong>
              <code>0–20 + 0–20 + 0–20 + 0–20 + 0–20 = 0–100</code>
              <p>Each pillar is rounded to the nearest whole point before the five pillars are added.</p>
            </article>
            <article className="formula-card">
              <p className="formula-kicker">Trajectory · Directional</p>
              <strong>Seven signals measuring momentum</strong>
              <code>−10 to +10</code>
              <p>Projected 2028 = Readiness + (Trajectory × 1.5), clamped from 0 to 100.</p>
            </article>
            <article className="formula-card">
              <p className="formula-kicker">Adoption · Separate lens</p>
              <strong>Observed use across five domains</strong>
              <code>0–100</code>
              <p>Adoption is curated independently and does not feed the Readiness or Trajectory formulas.</p>
            </article>
          </div>
        </section>

        <section id="weights" className="methodology-section" aria-labelledby="weights-title">
          <SectionHeading number="02" id="weights-title" title="Pillar-weight table">Every readiness point is assigned to a defined component.</SectionHeading>
          <div className="methodology-table-wrap" role="region" aria-label="Pillar weight allocations" tabIndex={0}>
            <table className="methodology-table">
              <caption>Readiness pillar components and point allocations</caption>
              <thead><tr><th scope="col">Pillar</th><th scope="col">Component</th><th scope="col">Points</th><th scope="col">Preferred source</th><th scope="col">Fallback</th></tr></thead>
              <tbody>
                {PILLAR_KEYS.flatMap((pillar) => {
                  const components = READINESS_COMPONENTS.filter((item) => item.pillar === pillar);
                  return components.map((item, index) => (
                    <tr key={item.key}>
                      {index === 0 && <th scope="rowgroup" rowSpan={components.length}>{PILLAR_METADATA[pillar].label}<span>20 points</span></th>}
                      <td>{item.label}</td>
                      <td className="methodology-points">{item.pointsAvailable}</td>
                      <td><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.source}</a></td>
                      <td>{item.fallbackRule}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section id="dictionary" className="methodology-section" aria-labelledby="dictionary-title">
          <SectionHeading number="03" id="dictionary-title" title="Indicator data dictionary">Search the production inputs, codes, thresholds, and source roles.</SectionHeading>
          <form className="methodology-search no-print" action="/methodology" method="get">
            <label htmlFor="methodology-query">Search indicators and sources</label>
            <div>
              <input id="methodology-query" name="q" type="search" defaultValue={searchParams?.q ?? ""} placeholder="Try broadband, WGI, OECD, or GDP" suppressHydrationWarning />
              <button type="submit" className="button-secondary">Search</button>
              {query && <Link href="/methodology">Clear</Link>}
            </div>
          </form>
          <p className="methodology-result-count" role="status">{dictionary.length} {dictionary.length === 1 ? "entry" : "entries"}</p>
          <div className="methodology-table-wrap" role="region" aria-label="Indicator data dictionary" tabIndex={0}>
            <table className="methodology-table methodology-dictionary">
              <caption>Production indicator definitions and scoring rules</caption>
              <thead><tr><th scope="col">Indicator</th><th scope="col">Pillar</th><th scope="col">Code / unit</th><th scope="col">Source role</th><th scope="col">Scoring rule</th></tr></thead>
              <tbody>
                {dictionary.map((item) => (
                  <tr key={item.key}>
                    <th scope="row">{item.label}<span>{item.notes}</span></th>
                    <td>{PILLAR_METADATA[item.pillar].label}</td>
                    <td><code>{item.indicatorCode ?? "Maintained field"}</code><span>{item.unit ?? "Not applicable"}</span></td>
                    <td><span className={`methodology-source-kind source-${item.sourceKind}`}>{sourceKindLabel[item.sourceKind]}</span><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.source}</a></td>
                    <td>{item.thresholdRule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dictionary.length === 0 && <div className="methodology-empty"><h3>No matching indicators</h3><p>Try a pillar name, organization, or indicator code.</p><Link href="/methodology">Reset the dictionary</Link></div>}
        </section>

        <section id="precedence" className="methodology-section" aria-labelledby="precedence-title">
          <SectionHeading number="04" id="precedence-title" title="Source precedence">The scorer follows one deterministic path for each input.</SectionHeading>
          <ol className="precedence-flow" aria-label="Score source precedence">
            <li><span>1</span><strong>Live public input</strong><p>Use the latest available World Bank, IMF, or OECD observation.</p></li>
            <li><span>2</span><strong>Maintained enrichment</strong><p>Use WIPO, Oxford Insights, or maintained national-policy data only where the formula defines it.</p></li>
            <li><span>3</span><strong>Proportional fallback</strong><p>When a preferred value is unavailable, use that component&apos;s share of the static pillar baseline.</p></li>
            <li><span>4</span><strong>Pillar rounding</strong><p>Sum component contributions, round the pillar, and clamp it from 0 to 20.</p></li>
            <li><span>5</span><strong>Readiness total</strong><p>Add the five rounded pillars and clamp the result from 0 to 100.</p></li>
          </ol>
          <p className="methodology-note">Stanford HAI, Tortoise, ITU, and WEF provide useful context and calibration references, but they do not directly contribute points to the production score.</p>
        </section>

        <section id="missing-data" className="methodology-section" aria-labelledby="missing-title">
          <SectionHeading number="05" id="missing-title" title="Missing-data policy">Coverage is disclosed separately from a country&apos;s performance.</SectionHeading>
          <div className="methodology-policy-grid">
            <article><h3>Substitution rule</h3><p>Missing values receive the proportional share of the country&apos;s static pillar baseline. The underlying static baseline is never rewritten during a live request.</p></article>
            <article><h3>Coverage labels</h3><dl><div><dt>High</dt><dd>At least 75% observed and no more than 30% fallback allocation.</dd></div><div><dt>Medium</dt><dd>At least 50% observed and no more than 55% fallback allocation.</dd></div><div><dt>Limited</dt><dd>All other source-availability profiles.</dd></div></dl></article>
            <article><h3>What coverage means</h3><p>Coverage measures source availability. It is not statistical confidence, a margin of error, or a judgment about data quality.</p></article>
          </div>
        </section>

        <section id="limitations" className="methodology-section" aria-labelledby="limitations-title">
          <SectionHeading number="06" id="limitations-title" title="Limitations">Use the index as a structured comparison, not a precise forecast.</SectionHeading>
          <ul className="limitations-list">
            <li><strong>Threshold sensitivity.</strong> Small input changes near a band boundary can change component points.</li>
            <li><strong>Uneven observation years.</strong> Public indicators update on different schedules and may lag current conditions.</li>
            <li><strong>Baseline judgment.</strong> Static residual components encode expert judgment where comparable global data is incomplete.</li>
            <li><strong>Projection limits.</strong> The 2028 value is a directional scenario based on current momentum, not a probability-weighted forecast.</li>
            <li><strong>Adoption separation.</strong> The Adoption lens is curated from a different evidence base and should not be read as part of Readiness.</li>
          </ul>
        </section>

        <section id="downloads" className="methodology-section methodology-downloads" aria-labelledby="downloads-title">
          <SectionHeading number="07" id="downloads-title" title="Downloads and citation">Reuse the method with the version and canonical URL intact.</SectionHeading>
          <div className="download-grid">
            <a href="/api/methodology.csv" download><span>CSV</span><strong>Methodology data dictionary</strong><small>Component keys, source URLs, point budgets, rules, and notes.</small></a>
            <a href="https://github.com/ankitmishra01/ai-trajectory-index" target="_blank" rel="noopener noreferrer"><span>CODE</span><strong>Source and README</strong><small>Scoring implementation, data clients, and full technical documentation.</small></a>
          </div>
          <div className="citation-block"><p>Suggested citation</p><blockquote>{SITE_CITATION}</blockquote><p className="print-source">Canonical URL: https://ai-trajectory-index.vercel.app/methodology</p></div>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({ number, id, title, children }: { number: string; id: string; title: string; children: ReactNode }) {
  return <div className="methodology-section-heading"><p className="section-number">{number}</p><div><h2 id={id}>{title}</h2><p>{children}</p></div></div>;
}
