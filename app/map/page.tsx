"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import staticData from "@/data/countries.json";
import adoptionRaw from "@/data/adoption.json";
import type { ScoredCountry, ScoresResponse } from "@/lib/types";
import type { CountryContext } from "@/lib/openrouter";
import type { MapMode } from "@/components/WorldMap";

// Dynamic import — react-simple-maps uses browser APIs
const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[900/460] bg-[#0f1628] border border-[#1c2847] rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-slate-600 text-sm">Loading map…</span>
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
    }))
  );
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<MapMode>("view");
  const [mapLens, setMapLens] = useState<"readiness" | "adoption">("readiness");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
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
  const scores = mapLens === "adoption" ? adoptionScores : readinessScores;
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
    <main className="min-h-screen bg-[#0a0f1e] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1c2847] sticky top-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5"
          >
            ← Index
          </Link>
          <span className="text-[#1c2847]">|</span>
          <h1 className="text-sm font-bold text-white">
            AI Trajectory Map
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {/* Lens toggle */}
            <div className="flex rounded-lg overflow-hidden border border-[#1c2847]">
              {(["readiness", "adoption"] as const).map((lens) => (
                <button
                  key={lens}
                  onClick={() => setMapLens(lens)}
                  className="px-3 py-1.5 text-xs font-semibold transition-all"
                  style={mapLens === lens
                    ? { background: lens === "adoption" ? "#22c55e" : "#3b82f6", color: "#fff" }
                    : { background: "#0f1628", color: "#64748b" }
                  }
                >
                  {lens === "readiness" ? "Readiness" : "Adoption"}
                </button>
              ))}
            </div>

            {/* Mode toggle */}
            <button
              onClick={() => setMode(mode === "view" ? "select" : "view")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "select"
                  ? "bg-blue-500 text-white"
                  : "bg-[#1c2847] text-slate-400 hover:text-white"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              {mode === "select" ? "Drawing…" : "Draw selection"}
            </button>
            {selectedSlugs.size > 0 && (
              <button
                onClick={() => {
                  setSelectedSlugs(new Set());
                  setMessages([]);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 bg-[#1c2847] transition-colors"
              >
                Clear ({selectedSlugs.size})
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 max-w-[1600px] mx-auto w-full">
        {/* Left: Map */}
        <div className="flex-1 p-4">
          {/* Mode hint */}
          {mode === "select" ? (
            <div className="mb-3 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Click and drag on the map to circle countries. Release to select them.
            </div>
          ) : (
            <div className="mb-3 px-4 py-2 rounded-lg bg-[#0f1628] border border-[#1c2847] text-slate-500 text-xs flex items-center gap-2">
              <span>
                Showing <span style={{ color: mapLens === "adoption" ? "#4ade80" : "#60a5fa", fontWeight: 600 }}>
                  {mapLens === "adoption" ? "Adoption Scores" : "Readiness Scores"}
                </span> · Click a country to select · hover for details
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
        <div className="lg:w-96 xl:w-[420px] flex flex-col border-t lg:border-t-0 lg:border-l border-[#1c2847]">
          {/* Selected countries panel */}
          <div className="flex-1 overflow-y-auto max-h-[50vh] lg:max-h-none">
            <div className="sticky top-0 bg-[#0a0f1e] border-b border-[#1c2847] px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                {selectedCountries.length === 0
                  ? "No countries selected"
                  : `${selectedCountries.length} countr${selectedCountries.length === 1 ? "y" : "ies"} selected`}
              </h2>
              {selectedCountries.length > 0 && (
                <span className="text-xs text-slate-500">
                  Avg{" "}
                  {Math.round(
                    selectedCountries.reduce(
                      (s, c) => s + c.total_score,
                      0
                    ) / selectedCountries.length
                  )}
                  /100
                </span>
              )}
            </div>

            {selectedCountries.length === 0 ? (
              <div className="p-6 text-center text-slate-600 text-sm">
                <p className="text-2xl mb-2">🗺️</p>
                <p>Click countries or draw a selection to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1c2847]">
                {selectedCountries
                  .sort((a, b) => b.total_score - a.total_score)
                  .map((c) => (
                    <div
                      key={c.slug}
                      className="px-4 py-3 hover:bg-[#0f1628] transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{c.flag}</span>
                          <div>
                            <p className="text-sm font-semibold text-white leading-none">
                              {c.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {c.region}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <span
                              className={`text-lg font-black ${
                                c.total_score >= 80
                                  ? "text-emerald-400"
                                  : c.total_score >= 60
                                  ? "text-blue-400"
                                  : c.total_score >= 40
                                  ? "text-amber-400"
                                  : "text-red-400"
                              }`}
                            >
                              {c.total_score}
                            </span>
                            <span className="text-xs text-slate-500">/100</span>
                          </div>
                          <button
                            onClick={() => handleCountryClick(c.slug)}
                            className="text-slate-600 hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      {/* Mini dimension bars */}
                      <div className="flex gap-1">
                        {DIMS.map((dim) => {
                          const s = c.scores[dim].score;
                          const pct = (s / 20) * 100;
                          return (
                            <div
                              key={dim}
                              className="flex-1"
                              title={`${DIM_LABELS[dim]}: ${s}/20`}
                            >
                              <div className="h-1.5 bg-[#1c2847] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-600">
                        <span>
                          Traj:{" "}
                          <span
                            className={
                              c.trajectory_score > 0
                                ? "text-emerald-400"
                                : c.trajectory_score < 0
                                ? "text-red-400"
                                : "text-slate-400"
                            }
                          >
                            {c.trajectory_score > 0 ? "+" : ""}
                            {c.trajectory_score}
                          </span>
                        </span>
                        <span>→ {c.projected_score_2028} by 2028</span>
                        <Link
                          href={`/country/${c.slug}`}
                          className="text-blue-500 hover:text-blue-400 transition-colors"
                          target="_blank"
                        >
                          Detail ↗
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Chat panel */}
          <div className="border-t border-[#1c2847] flex flex-col" style={{ minHeight: "280px" }}>
            <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#1c2847] bg-[#0a0f1e]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Ask about selection
              </h3>
              {selectedCountries.length === 0 && (
                <span className="text-xs text-slate-600 ml-1">
                  — select countries first
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-64 lg:max-h-72">
              {messages.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-600">
                    Ask anything about the selected countries
                  </p>
                  {selectedCountries.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                      {[
                        "Which is best positioned for AI?",
                        "Compare their governance approaches",
                        "Who has the strongest trajectory?",
                        "What risks do they share?",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setInput(q);
                          }}
                          className="px-2 py-1 text-[10px] bg-[#1c2847] text-slate-400 rounded hover:text-blue-400 hover:border-blue-500/30 border border-[#1c2847] transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-white font-medium"
                      : msg.role === "error"
                      ? "text-amber-400 text-xs bg-amber-500/5 border border-amber-500/20 rounded-lg p-3"
                      : "text-slate-300"
                  }`}
                >
                  {msg.role === "user" && (
                    <span className="text-blue-400 mr-1.5 text-xs">You:</span>
                  )}
                  {msg.role === "assistant" && (
                    <span className="text-emerald-400 mr-1.5 text-xs">AI:</span>
                  )}
                  {msg.content}
                </div>
              ))}
              {thinking && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#1c2847]">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={
                    selectedCountries.length === 0
                      ? "Select countries first…"
                      : "Ask a question…"
                  }
                  disabled={selectedCountries.length === 0 || thinking}
                  className="flex-1 bg-[#0f1628] border border-[#1c2847] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    !input.trim() ||
                    selectedCountries.length === 0 ||
                    thinking
                  }
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1c2847] disabled:text-slate-600 text-white rounded-lg text-sm font-semibold transition-all disabled:cursor-not-allowed"
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
