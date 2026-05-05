"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import staticData from "@/data/countries.json";
import adoptionRaw from "@/data/adoption.json";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";
import type { CountryContext } from "@/lib/openrouter";
import type { MapMode } from "@/components/WorldMap";
import SiteHeader from "@/components/SiteHeader";

// Dynamic import — react-simple-maps uses browser APIs
const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div style={{ background: "var(--dt-raised)", border: "1px solid var(--dt-border)" }} className="w-full aspect-[900/460] animate-pulse flex items-center justify-center">
      <span style={{ color: "var(--dt-text-3)", fontSize: 14 }}>Loading map…</span>
    </div>
  ),
});

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
}

const DIMS = [
  "infrastructure",
  "talent",
  "governance",
  "investment",
  "economic_readiness",
] as const;
const PILLAR_KEYS = DIMS;
const DIM_LABELS: Record<string, string> = {
  infrastructure: "Infra",
  talent: "Talent",
  governance: "Gov",
  investment: "Invest",
  economic_readiness: "Econ",
};

export default function MapPage() {
  const [countries, setCountries] = useState<ScoredCountry[]>(() =>
    staticData.countries.map((c) => ({
      ...c,
      data_source: "fallback" as const,
      wb_data_year: null,
    }))
  );
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<MapMode>("view");
  type MapLens = "readiness" | "adoption" | "infrastructure" | "talent" | "governance" | "investment" | "economic_readiness";
  const [mapLens, setMapLens] = useState<MapLens>("readiness");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Adoption score lookup
  const adoptionScores = useMemo(
    () => Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (adoptionRaw.countries as any[]).map((a) => [a.slug, a.adoption_total])
    ) as Record<string, number>,
    []
  );

  // Derived lookups
  const readinessScores = useMemo(
    () => Object.fromEntries(countries.map((c) => [c.slug, c.total_score])) as Record<string, number>,
    [countries]
  );

  type PillarKey = typeof PILLAR_KEYS[number];

  const pillarScores = useMemo(() => {
    const result: Record<PillarKey, Record<string, number>> = {} as Record<PillarKey, Record<string, number>>;
    for (const key of PILLAR_KEYS) {
      result[key] = Object.fromEntries(
        countries.map((c) => [c.slug, Math.round((c.scores[key].score / 20) * 100)])
      );
    }
    return result;
  }, [countries]);

  const scores = mapLens === "adoption" ? adoptionScores
    : PILLAR_KEYS.includes(mapLens as PillarKey) ? pillarScores[mapLens as PillarKey]
    : readinessScores;
  const countryNames = useMemo(
    () =>
      Object.fromEntries(countries.map((c) => [c.slug, c.name])) as Record<
        string,
        string
      >,
    [countries]
  );
  const countryFlags = useMemo(
    () =>
      Object.fromEntries(countries.map((c) => [c.slug, c.flag])) as Record<
        string,
        string
      >,
    [countries]
  );
  const bySlug = useMemo(
    () =>
      Object.fromEntries(countries.map((c) => [c.slug, c])) as Record<
        string,
        ScoredCountry
      >,
    [countries]
  );

  const selectedCountries = useMemo(
    () =>
      Array.from(selectedSlugs)
        .map((s) => bySlug[s])
        .filter(Boolean) as ScoredCountry[],
    [selectedSlugs, bySlug]
  );

  // Fetch live scores
  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then((data: ScoresResponse) => setCountries(data.countries))
      .catch(() => {});
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLassoSelection = (slugs: string[]) => {
    setSelectedSlugs(new Set(slugs));
    setMode("view");
  };

  const handleCountryClick = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || selectedCountries.length === 0 || thinking) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setThinking(true);

    const context: CountryContext[] = selectedCountries.map((c) => ({
      name: c.name,
      flag: c.flag,
      region: c.region,
      total_score: c.total_score,
      trajectory_label: c.trajectory_label,
      trajectory_score: c.trajectory_score,
      projected_score_2028: c.projected_score_2028,
      top_accelerator: c.top_accelerator,
      top_risk: c.top_risk,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, countries: context }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "error", content: data.error },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Network error — please try again." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--dt-bg)", display: "flex", flexDirection: "column" }}>
      <SiteHeader activePage="map" />

      {/* Control bar */}
      <div style={{ background: "var(--dt-bg)", borderBottom: "1px solid var(--dt-border)", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
          {([
            { key: "readiness",          label: "Readiness", color: "#D64528" },
            { key: "adoption",           label: "Adoption",  color: "#3F7A4D" },
            { key: "infrastructure",     label: "Infra",     color: "#3B5BA5" },
            { key: "talent",             label: "Talent",    color: "#7A4F8C" },
            { key: "governance",         label: "Gov",       color: "#3F7A4D" },
            { key: "investment",         label: "Invest",    color: "#B58A2E" },
            { key: "economic_readiness", label: "Econ",      color: "#8B4A3F" },
          ] as const).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setMapLens(key)}
              style={{
                padding: "3px 10px",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                border: "1px solid",
                cursor: "pointer",
                ...(mapLens === key
                  ? { background: color, color: "#fff", borderColor: color }
                  : { background: "transparent", color: "var(--dt-text-3)", borderColor: "var(--dt-border)" })
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setMode(mode === "view" ? "select" : "view")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", fontSize: 11,
              fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.06em",
              border: "1px solid", cursor: "pointer",
              ...(mode === "select"
                ? { background: "var(--signal)", color: "#fff", borderColor: "var(--signal)" }
                : { background: "transparent", color: "var(--dt-text-2)", borderColor: "var(--dt-border)" })
            }}
          >
            <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {mode === "select" ? "Drawing…" : "Draw selection"}
          </button>
          {selectedSlugs.size > 0 && (
            <button
              onClick={() => { setSelectedSlugs(new Set()); setMessages([]); }}
              style={{
                padding: "5px 12px", fontSize: 11,
                fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.06em",
                background: "transparent", color: "var(--dt-text-3)",
                border: "1px solid var(--dt-border)", cursor: "pointer",
              }}
            >
              Clear ({selectedSlugs.size})
            </button>
          )}
        </div>
      </div>

      {/* Mobile panel toggle (floating button) */}
      <button
        className="fixed bottom-4 right-4 z-50 lg:hidden flex items-center gap-2 px-4 py-2.5 text-xs font-bold shadow-xl"
        style={{
          fontFamily: "var(--font-mono)",
          background: mobilePanelOpen ? "var(--signal)" : "var(--dt-raised)",
          border: "1px solid " + (mobilePanelOpen ? "var(--signal)" : "var(--dt-border)"),
          color: mobilePanelOpen ? "#fff" : "var(--dt-text-2)",
        }}
        onClick={() => setMobilePanelOpen((o) => !o)}
      >
        <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
        </svg>
        {mobilePanelOpen ? "Close" : `Chat${selectedSlugs.size > 0 ? ` · ${selectedSlugs.size}` : ""}`}
      </button>

      <div style={{ display: "flex", flex: 1, maxWidth: 1600, margin: "0 auto", width: "100%", flexDirection: "column" }} className="lg:flex-row">
        {/* Left: Map */}
        <div style={{ flex: 1, padding: 16 }}>
          {/* Mode hint */}
          {mode === "select" ? (
            <div style={{ marginBottom: 12, padding: "6px 14px", border: "1px solid var(--signal)", background: "rgba(214,69,40,.08)", color: "var(--signal)", fontSize: 11, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--signal)", display: "inline-block" }} />
              Click and drag on the map to circle countries. Release to select them.
            </div>
          ) : (
            <div style={{ marginBottom: 12, padding: "6px 14px", border: "1px solid var(--dt-border)", background: "var(--dt-raised)", color: "var(--dt-text-3)", fontSize: 11, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>
                Showing{" "}
                <span style={{ fontWeight: 600, color:
                  mapLens === "adoption" ? "#3F7A4D" :
                  mapLens === "talent" ? "#7A4F8C" :
                  mapLens === "governance" ? "#3F7A4D" :
                  mapLens === "investment" ? "#B58A2E" :
                  mapLens === "economic_readiness" ? "#8B4A3F" :
                  mapLens === "infrastructure" ? "#3B5BA5" : "var(--signal)" }}>
                  {mapLens === "readiness" ? "Readiness Scores"
                   : mapLens === "adoption" ? "Adoption Scores"
                   : mapLens.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Scores"}
                </span>{" "}
                · Click a country to select · hover for details
              </span>
            </div>
          )}

          <WorldMap
            scores={scores}
            countryNames={countryNames}
            countryFlags={countryFlags}
            selectedSlugs={selectedSlugs}
            mode={mode}
            onSelectionChange={handleLassoSelection}
            onCountryClick={handleCountryClick}
          />
        </div>

        {/* Right: Selection + Chat */}
        <div
          className={`lg:w-96 xl:w-[420px] flex flex-col ${
            mobilePanelOpen ? "fixed inset-x-0 bottom-0 z-40 max-h-[75vh] overflow-hidden" : "hidden lg:flex"
          }`}
          style={{ background: "var(--dt-bg)", borderLeft: "1px solid var(--dt-border)" }}
        >
          {/* Selected countries panel */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: mobilePanelOpen ? "50vh" : undefined }}>
            <div style={{ position: "sticky", top: 0, background: "var(--dt-bg)", borderBottom: "1px solid var(--dt-border)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--dt-text-0)" }}>
                {selectedCountries.length === 0
                  ? "NO SELECTION"
                  : `${selectedCountries.length} COUNTR${selectedCountries.length === 1 ? "Y" : "IES"} SELECTED`}
              </span>
              {selectedCountries.length > 0 && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)" }}>
                  AVG {Math.round(selectedCountries.reduce((s, c) => s + c.total_score, 0) / selectedCountries.length)}/100
                </span>
              )}
            </div>

            {selectedCountries.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--dt-text-3)" }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>🗺️</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12 }}>Click countries or draw a selection to get started</p>
              </div>
            ) : (
              <div>
                {selectedCountries
                  .sort((a, b) => b.total_score - a.total_score)
                  .map((c) => (
                    <div
                      key={c.slug}
                      style={{ padding: "10px 16px", borderBottom: "1px solid var(--dt-border)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--dt-raised)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{c.flag}</span>
                          <div>
                            <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--dt-text-0)", lineHeight: 1.1 }}>{c.name}</p>
                            <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--dt-text-3)", marginTop: 2 }}>{c.region}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 500, color: "var(--dt-text-0)" }}>{c.total_score}</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)" }}>/100</span>
                          </div>
                          <button onClick={() => handleCountryClick(c.slug)} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                        </div>
                      </div>
                      {/* Mini dimension bars */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                        {DIMS.map((dim, di) => {
                          const s = c.scores[dim].score;
                          const pct = (s / 20) * 100;
                          const colors = ["#3B5BA5", "#7A4F8C", "#3F7A4D", "#B58A2E", "#8B4A3F"];
                          return (
                            <div key={dim} title={`${DIM_LABELS[dim]}: ${s}/20`}>
                              <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: colors[di] }} />
                              </div>
                              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dt-text-3)", marginTop: 2 }}>{DIM_LABELS[dim]}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: c.trajectory_score > 0 ? "var(--positive)" : c.trajectory_score < 0 ? "var(--negative)" : "var(--dt-text-3)" }}>
                          {c.trajectory_score > 0 ? "+" : ""}{c.trajectory_score}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)" }}>→ {c.projected_score_2028} · 2028</span>
                        <Link href={`/country/${c.slug}`} target="_blank" style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--signal)", fontWeight: 600, textDecoration: "none" }}>
                          Detail ↗
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Chat panel */}
          <div style={{ borderTop: "1px solid var(--dt-border)", display: "flex", flexDirection: "column", minHeight: 280 }}>
            <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--dt-border)", background: "var(--dt-bg)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--signal)", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--dt-text-0)" }}>ASK ABOUT SELECTION</span>
              {selectedCountries.length === 0 && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)" }}>— select countries first</span>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", maxHeight: 288 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--dt-text-3)" }}>
                    Ask anything about the selected countries
                  </p>
                  {selectedCountries.length > 0 && (
                    <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap" as const, gap: 6, justifyContent: "center" }}>
                      {[
                        "Which is best positioned for AI?",
                        "Compare their governance approaches",
                        "Who has the strongest trajectory?",
                        "What risks do they share?",
                      ].map((q) => (
                        <button key={q} onClick={() => setInput(q)}
                          style={{ padding: "3px 8px", fontSize: 10, fontFamily: "var(--font-sans)", background: "var(--dt-raised)", color: "var(--dt-text-2)", border: "1px solid var(--dt-border)", cursor: "pointer" }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 10, fontSize: 12, lineHeight: 1.5,
                  color: msg.role === "user" ? "var(--dt-text-0)" : msg.role === "error" ? "var(--negative)" : "var(--dt-text-1)",
                  fontFamily: "var(--font-sans)",
                  ...(msg.role === "error" ? { padding: "8px 10px", border: "1px solid var(--negative)", background: "rgba(168,81,61,.06)" } : {})
                }}>
                  {msg.role === "user" && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--signal)", marginRight: 6, letterSpacing: "0.1em" }}>YOU</span>}
                  {msg.role === "assistant" && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--positive)", marginRight: 6, letterSpacing: "0.1em" }}>AI</span>}
                  {msg.content}
                </div>
              ))}
              {thinking && (
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 0.2, 0.4].map((delay) => (
                    <span key={delay} style={{ width: 6, height: 6, borderRadius: 3, background: "var(--signal)", display: "inline-block", animation: `live-dot-pulse 1.8s ${delay}s ease-in-out infinite` }} />
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: 10, borderTop: "1px solid var(--dt-border)" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={selectedCountries.length === 0 ? "Select countries first…" : "Ask a question…"}
                  disabled={selectedCountries.length === 0 || thinking}
                  className="input-base"
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || selectedCountries.length === 0 || thinking}
                  className="btn-primary"
                  style={{ padding: "0 14px", fontSize: 14 }}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
