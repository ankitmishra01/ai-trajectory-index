"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import CoverageBadge from "@/components/CoverageBadge";
import CountryChat from "@/components/CountryChat";
import CountryNewsFeed from "@/components/CountryNewsFeed";
import CountryRoadmap from "@/components/CountryRoadmap";
import CountrySection from "@/components/CountrySection";
import CountrySidebar from "@/components/CountrySidebar";
import DimensionBar from "@/components/DimensionBar";
import DualRadar from "@/components/DualRadar";
import PillarProvenance from "@/components/PillarProvenance";
import PolicyGapAnalyser from "@/components/PolicyGapAnalyser";
import ScoreGauge from "@/components/ScoreGauge";
import ScoreSparkline from "@/components/ScoreSparkline";
import ScoreHistory, { type HistoryPayload } from "@/components/ScoreHistory";
import SiteHeader from "@/components/SiteHeader";
import TrajectoryArrow from "@/components/TrajectoryArrow";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import adoptionData from "@/data/adoption.json";
import { SLUG_TO_ISO3 } from "@/lib/slugToIso3";
import staticData from "@/data/countries.json";
import { DIM_COLORS as ADOPT_DIM_COLORS, DIM_LABELS as ADOPT_DIM_LABELS } from "@/lib/adoption";
import type { AdoptionEntry } from "@/lib/adoption";
import { copyText } from "@/lib/copyText";
import { PILLAR_KEYS } from "@/lib/methodology";
import { asFallbackScoredCountry } from "@/lib/provenance";
import { competitionRankEntries, formatRankLabel, type RankEntry } from "@/lib/rank";
import type { NarrativeSection, ScoresResponse, ScoredCountry } from "@/lib/types";

const DIM_LABELS = {
  infrastructure: "Infrastructure",
  talent: "Talent",
  governance: "Governance",
  investment: "Investment",
  economic_readiness: "Economic Readiness",
} as const;

type PageTab = "readiness" | "adoption" | "combined";

interface NarrativeState {
  status: "idle" | "loading" | "done" | "error";
  sections: NarrativeSection[];
  source?: "ai" | "template";
  generatedAt?: string;
  error?: string;
}

interface Props {
  slug: string;
  initialCountry: ScoredCountry;
  // Competition ranks computed on the server from the same pool the page <title> uses, so the
  // first paint agrees with the tab. Recomputed here once /api/scores returns the live list.
  initialGlobalRank?: RankEntry | null;
  initialRegionRank?: RankEntry | null;
}

// Economies the Global Economic Intelligence dashboard profiles (its World Bank registry has no Taiwan entry).
const GEI_BASE = "https://g20-gamma.vercel.app";
const GEI_EXCLUDED = new Set(["TWN"]);

export default function CountryPageClient({ slug, initialCountry, initialGlobalRank, initialRegionRank }: Props) {
  const geiIso3 = SLUG_TO_ISO3[slug] ?? "";
  const geiUrl = /^[A-Z]{3}$/.test(geiIso3) && !GEI_EXCLUDED.has(geiIso3) ? `${GEI_BASE}/#country/${geiIso3}` : null;
  const [activeTab, setActiveTab] = useState<PageTab>("combined");
  const [country, setCountry] = useState(initialCountry);
  const [allCountries, setAllCountries] = useState<ScoredCountry[]>(() => staticData.countries.map(asFallbackScoredCountry));
  // False until /api/scores answers, while allCountries is still the static seed. The server
  // already ranked this country against the live pool, so we show its answer until we have
  // the same list it used rather than ranking against a different one.
  const [liveListLoaded, setLiveListLoaded] = useState(false);
  const [narrative, setNarrative] = useState<NarrativeState>({ status: "idle", sections: [] });
  const [copied, setCopied] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [usingLive, setUsingLive] = useState(false);
  const [history, setHistory] = useState<HistoryPayload | null>(null);
  const urlInitRef = useRef(false);

  const adoption = (adoptionData.countries as AdoptionEntry[]).find((item) => item.slug === slug) ?? null;

  useEffect(() => {
    if (typeof window === "undefined" || urlInitRef.current) return;
    urlInitRef.current = true;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "readiness" || tab === "adoption" || tab === "combined") setActiveTab(tab);
  }, []);

  useEffect(() => {
    if (!urlInitRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (activeTab === "combined") params.delete("tab");
    else params.set("tab", activeTab);
    const query = params.toString();
    window.history.replaceState({}, "", query ? `?${query}` : window.location.pathname);
  }, [activeTab]);

  useEffect(() => {
    if (!/^[A-Z]{3}$/.test(geiIso3)) return;
    fetch(`/api/history/${geiIso3}`).then((r) => (r.ok ? r.json() : null)).then(setHistory).catch(() => setHistory(null));
  }, [geiIso3]);

  useEffect(() => {
    fetch("/api/scores")
      .then((response) => response.json())
      .then((data: ScoresResponse) => {
        setAllCountries(data.countries);
        setLiveListLoaded(data.countries.length > 0);
        setLastUpdated(data.last_updated);
        setUsingLive(data.using_live_data);
        const liveCountry = data.countries.find((item) => item.slug === slug);
        if (liveCountry) setCountry(liveCountry);
      })
      .catch(() => {});
  }, [slug]);

  const fetchNarrative = async () => {
    setNarrative({ status: "loading", sections: [] });
    try {
      const response = await fetch(`/api/narrative/${slug}`);
      const data = await response.json();
      if (data.error) setNarrative({ status: "error", sections: [], error: data.error });
      else setNarrative({ status: "done", sections: data.sections, source: data.source, generatedAt: data.generatedAt });
    } catch {
      setNarrative({ status: "error", sections: [], error: "Network error. Please try again." });
    }
  };

  const handleCopyLink = async () => {
    if (await copyText(window.location.href)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const embedCode = `<iframe\n  src="https://ai-trajectory-index.vercel.app/widget/${slug}"\n  width="320"\n  height="280"\n  frameborder="0"\n  style="border-radius:12px;"\n  title="${country.name} AI Trajectory Index"\n></iframe>`;

  const comparables = useMemo(() => {
    function distance(a: ScoredCountry, b: ScoredCountry) {
      return Math.sqrt(PILLAR_KEYS.reduce((sum, key) => sum + (a.scores[key].score - b.scores[key].score) ** 2, 0));
    }
    return allCountries.filter((item) => item.slug !== slug).sort((a, b) => distance(country, a) - distance(country, b)).slice(0, 4);
  }, [allCountries, country, slug]);

  const ranked = [...allCountries].sort((a, b) => b.total_score - a.total_score);
  // Same helper, same pool as the page <title> and the JSON-LD Dataset description. Reading
  // the rank off this sorted array index instead is what made the hero say "#17" on a page
  // whose own tab said "=4": the index ordered the six economies tied on 84 by their row
  // position in data/countries.json.
  const regionPeers = ranked.filter((item) => item.region === country.region);
  const globalRank = liveListLoaded ? competitionRankEntries(allCountries)[slug] : initialGlobalRank ?? undefined;
  const regionRank = liveListLoaded ? competitionRankEntries(regionPeers)[slug] : initialRegionRank ?? undefined;
  const delta = country.projected_score_2028 - country.total_score;
  const liveScoreDelta = country.data_source === "live" ? country.total_score - initialCountry.total_score : 0;

  return (
    <main className="country-layout min-h-screen flex">
      <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-0 h-screen country-sidebar-shell">
        <CountrySidebar countries={allCountries} currentSlug={slug} />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex country-drawer-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setSidebarOpen(false); }}>
          <div className="w-80 max-w-[85vw] h-full country-drawer-panel">
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider">Countries</span>
              <button onClick={() => setSidebarOpen(false)} className="country-icon-button" aria-label="Close country browser">×</button>
            </div>
            <CountrySidebar countries={allCountries} currentSlug={slug} onSelect={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <SiteHeader usingLive={usingLive} lastFetched={lastUpdated} citation={`Mishra, A. (2026). ${country.name}: AI readiness country profile. AI Trajectory Index (Version ${history?.index_version ?? "3"}${history?.latest_snapshot ? `, snapshot ${history.latest_snapshot}` : ""}). https://ai-trajectory-index.vercel.app/country/${slug}${history?.snapshot_url ? `. Data snapshot: ${history.snapshot_url}` : ""}${geiUrl ? `. Economic context: Global Economic Intelligence, ${geiUrl}` : ""}`} />
        <div className="country-profile-bar no-print">
          <div className="country-content-width">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden country-bar-action" aria-label="Browse countries">☰ <span>Countries</span></button>
            <span className="country-profile-label">Country profile</span>
            <div className="ml-auto flex items-center gap-2">
              <Link href={`/compare/${slug}/usa`} className="country-bar-action">Compare</Link>
              {geiUrl && <a href={geiUrl} target="_blank" rel="noopener noreferrer" className="country-bar-action" title={`${country.name} on Global Economic Intelligence: growth, inflation, debt, policy rate and FX`}>See the economy ↗</a>}
              <button onClick={handleCopyLink} className="country-bar-action" aria-live="polite">{copied ? "Link copied" : "Share"}</button>
            </div>
          </div>
        </div>

        <div className="country-content-width country-page-stack">
          <CountrySection id="executive-summary" number="01" title="Executive summary" description="Current standing, trajectory, and source coverage.">
            <div className="country-hero card">
              <div className="country-hero-identity">
                <span className="country-flag" aria-hidden="true">{country.flag}</span>
                <div>
                  <p className="eyebrow">{country.region} · {formatRankLabel(regionRank)} in region</p>
                  <h1>{country.name}</h1>
                  <div className="country-hero-meta"><span>{formatRankLabel(globalRank)} globally</span><TrajectoryArrow label={country.trajectory_label} score={country.trajectory_score} size="md" /><span>{country.projected_score_2028}/100 by 2028</span></div>
                </div>
              </div>
              <div className="country-hero-score"><ScoreGauge score={country.total_score} size={180} /><p>AI Readiness Score</p></div>
              <CoverageBadge coverage={country.coverage} />
            </div>
            <ScoreHistory history={history} countryName={country.name} />
            {liveScoreDelta !== 0 && <div className="country-live-change" role="status">Live sources changed the baseline score from {initialCountry.total_score} to {country.total_score} ({liveScoreDelta > 0 ? "+" : ""}{liveScoreDelta} points).</div>}
          </CountrySection>

          <CountrySection id="readiness-adoption" number="02" title="Readiness and Adoption" description="Capacity to build AI compared with evidence of AI use today.">
            {adoption && <div className="country-lens-tabs" role="group" aria-label="Country data lens">{([{ key: "combined", label: "Combined" }, { key: "readiness", label: "Readiness" }, { key: "adoption", label: "Adoption" }] as { key: PageTab; label: string }[]).map((item) => <button key={item.key} onClick={() => setActiveTab(item.key)} aria-pressed={activeTab === item.key}>{item.label}</button>)}</div>}
            <div className="country-score-grid">
              {(!adoption || activeTab !== "adoption") && <article className="research-score-card"><p>Readiness</p><strong>{country.total_score}<small>/100</small></strong><span>Capacity across five enabling pillars</span></article>}
              {adoption && activeTab !== "readiness" && <article className="research-score-card"><p>Adoption</p><strong>{adoption.adoption_total}<small>/100</small></strong><span>{adoption.adoption_tier}</span></article>}
              {(!adoption || activeTab !== "adoption") && <article className="research-score-card"><p>Trajectory</p><strong>{country.trajectory_score > 0 ? "+" : ""}{country.trajectory_score}<small>/10</small></strong><span>{country.trajectory_label}</span></article>}
            </div>
            {adoption && activeTab === "combined" && <DualRadar country={country} adoption={adoption} />}
            {adoption && activeTab !== "readiness" && <div className="card country-adoption-bars"><h3>Adoption dimensions</h3>{Object.entries(adoption.adoption_scores).map(([key, score]) => <div key={key}><div><span>{ADOPT_DIM_LABELS[key as keyof typeof ADOPT_DIM_LABELS]}</span><strong>{score}/20</strong></div><div className="country-mini-track"><span style={{ width: `${(score / 20) * 100}%`, background: ADOPT_DIM_COLORS[key as keyof typeof ADOPT_DIM_COLORS] }} /></div></div>)}</div>}
          </CountrySection>

          <CountrySection id="pillar-evidence" number="03" title="Pillar evidence" description="Scores, supporting evidence, and the exact inputs behind each contribution.">
            <div className="pillar-evidence-list">
              {PILLAR_KEYS.map((key) => {
                const score = country.scores[key];
                return <article key={key} className="pillar-evidence-row card"><div className="pillar-evidence-head"><div><h3>{DIM_LABELS[key]}</h3><p>{score.reasons[0] ?? "No evidence note reported."}</p></div><strong>{score.score}<small>/20</small></strong></div><DimensionBar label={DIM_LABELS[key]} score={score.score} height={8} showScore={false} /><ul>{score.reasons.slice(1).map((reason) => <li key={reason}>{reason}</li>)}</ul><PillarProvenance pillar={key} components={country.provenance[key]} /></article>;
              })}
            </div>
          </CountrySection>

          <CountrySection id="outlook-policy" number="04" title="Outlook and policy gaps" description="Forward direction, constraints, and a structured country brief.">
            <div className="country-outlook-grid">
              <article className="card country-projection"><div><p>Projected 2028</p><strong>{country.projected_score_2028}<small>/100</small></strong><span>{delta > 0 ? "+" : ""}{delta} points from today</span></div><ScoreSparkline score={country.total_score} trajectory={country.trajectory_score} width={104} height={38} /></article>
              <article className="country-signal-card signal-positive"><p>Top accelerator</p><strong>{country.top_accelerator}</strong></article>
              <article className="country-signal-card signal-risk"><p>Top risk</p><strong>{country.top_risk}</strong></article>
            </div>
            <PolicyGapAnalyser country={country} allCountries={allCountries} />
            <article className="card country-brief-card">
              <header><div><p className="eyebrow">Five-section brief</p><h3>Country research brief</h3></div>{(narrative.status === "idle" || narrative.status === "error") && <button onClick={fetchNarrative} className="button-primary">Generate brief</button>}</header>
              {narrative.status === "loading" && <div className="country-brief-loading" role="status"><span /><span /><span /><p>Building the brief</p></div>}
              {narrative.status === "error" && <p className="country-inline-error">{narrative.error ?? "Brief temporarily unavailable. Please try again."}</p>}
              {narrative.status === "idle" && <p className="country-brief-intro">Generate a concise review of standing, infrastructure and talent, governance, investment, and economic outlook.</p>}
              {narrative.status === "done" && <div className="country-brief-sections">{narrative.sections.map((section) => <section key={section.heading}><h4>{section.heading}</h4><p>{section.body}</p></section>)}</div>}
            </article>
          </CountrySection>

          <CountrySection id="news-tools" number="05" title="News and supporting tools" description="Recent signals, comparable economies, and optional analysis controls.">
            <CountryNewsFeed slug={slug} countryName={country.name} />
            <article className="card country-comparables"><header><h3>Comparable countries</h3><p>Nearest neighbours across the five readiness pillars.</p></header><div>{comparables.map((item) => <Link key={item.slug} href={`/country/${item.slug}`}><span>{item.flag}</span><div><strong>{item.name}</strong><small>{item.total_score}/100 · {item.trajectory_label}</small></div><span aria-hidden="true">→</span></Link>)}</div></article>
            <details className="analysis-tools card">
              <summary><div><strong>Analysis tools</strong><span>What-if model, roadmap, AI Q&amp;A, embed, and print controls</span></div><span aria-hidden="true">+</span></summary>
              <div className="analysis-tools-actions no-print"><button onClick={() => window.print()} className="button-secondary">Print or save PDF</button><button onClick={() => setEmbedOpen(true)} className="button-secondary">Embed this profile</button><Link href={`/compare/${slug}/usa`} className="button-secondary">Open comparison</Link></div>
              <WhatIfSimulator country={country} allCountries={allCountries} />
              <CountryRoadmap country={country} />
              <CountryChat country={country} />
            </details>
          </CountrySection>
        </div>

        <footer className="country-footer"><p>World Bank · IMF · OECD · OECD.AI · WGI · Oxford Insights · WIPO</p><p>AI Trajectory Index · Version 3 · 2026 edition</p></footer>
      </div>

      {embedOpen && <div className="country-modal-backdrop no-print" onClick={(event) => { if (event.target === event.currentTarget) setEmbedOpen(false); }}><div className="country-embed-modal" role="dialog" aria-modal="true" aria-labelledby="embed-title"><header><h2 id="embed-title">Embed {country.name}</h2><button onClick={() => setEmbedOpen(false)} className="country-icon-button" aria-label="Close embed dialog">×</button></header><p>Use the compact, iframe-safe country widget.</p><pre>{embedCode}</pre><div><button className="button-primary" onClick={async () => { if (await copyText(embedCode)) setEmbedCopied(true); }}>{embedCopied ? "Code copied" : "Copy embed code"}</button><a className="button-secondary" href={`/widget/${slug}`} target="_blank" rel="noopener noreferrer">Preview widget</a></div></div></div>}
      {copied && <div className="status-toast" role="status">Share link copied</div>}
    </main>
  );
}
