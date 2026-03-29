"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import staticData from "@/data/countries.json";
import { useCountUp } from "@/hooks/useCountUp";

const PILLARS = [
  { key: "infrastructure",     label: "Infrastructure" },
  { key: "talent",             label: "Talent"         },
  { key: "governance",         label: "Governance"     },
  { key: "investment",         label: "Investment"     },
  { key: "economic_readiness", label: "Econ Readiness" },
] as const;

const COLORS = ["#3b82f6", "#22c55e"] as const;

function scoreColor(s: number) {
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#93c5fd";
  if (s >= 40) return "#fcd34d";
  return "#fca5a5";
}

function ScoreNum({ value, color }: { value: number; color: string }) {
  const animated = useCountUp(value, 800);
  return <span style={{ color }}>{animated}</span>;
}

function CountrySearch({ value, onChange, exclude }: {
  value: string; onChange: (s: string) => void; exclude: string;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q.trim()) return [];
    return staticData.countries
      .filter((c) => c.slug !== exclude && c.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 6);
  }, [q, exclude]);

  return (
    <div className="relative">
      <input
        className="input-base w-full text-sm"
        placeholder="Search country…"
        value={q || value}
        onChange={(e) => { setQ(e.target.value); if (!e.target.value) onChange(""); }}
      />
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {results.map((c) => (
            <button key={c.slug}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/5"
              style={{ color: "var(--text-1)" }}
              onClick={() => { onChange(c.slug); setQ(""); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ }}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
              <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>{c.total_score}/100</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComparePage({ params }: { params: { a: string; b: string } }) {
  const router = useRouter();
  const [slugA, setSlugA] = useState(params.a);
  const [slugB, setSlugB] = useState(params.b);

  const ca = staticData.countries.find((c) => c.slug === slugA);
  const cb = staticData.countries.find((c) => c.slug === slugB);

  const ranked = useMemo(
    () => [...staticData.countries].sort((x, y) => y.total_score - x.total_score),
    []
  );
  const rankA = ranked.findIndex((c) => c.slug === slugA) + 1;
  const rankB = ranked.findIndex((c) => c.slug === slugB) + 1;

  const radarData = PILLARS.map(({ key, label }) => ({
    subject: label,
    A: ca?.scores[key].score ?? 0,
    B: cb?.scores[key].score ?? 0,
  }));

  function go() {
    if (slugA && slugB && slugA !== slugB) {
      router.push(`/compare/${slugA}/${slugB}`);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="page-glow" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,11,20,.92)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: "var(--text-3)" }}>
            ← Index
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Head-to-Head
          </span>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Country pickers */}
        <div className="grid grid-cols-2 gap-4">
          {([{ slug: slugA, setSlug: setSlugA, exclude: slugB, color: COLORS[0] },
             { slug: slugB, setSlug: setSlugB, exclude: slugA, color: COLORS[1] }] as const).map(
            ({ setSlug, exclude, color }, i) => {
              const c = i === 0 ? ca : cb;
              return (
                <div key={i} className="card rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color }}>Country {i === 1 ? "B" : "A"}</p>
                  <CountrySearch value={c?.name ?? ""} onChange={(s) => { setSlug(s); }} exclude={exclude} />
                  {c && (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-4xl">{c.flag}</span>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{c.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-3)" }}>#{i === 0 ? rankA : rankB} globally · {c.region}</p>
                      </div>
                      <div className="ml-auto text-3xl font-black">
                        <ScoreNum value={c.total_score} color={scoreColor(c.total_score)} />
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>

        {slugA !== params.a || slugB !== params.b ? (
          <div className="flex justify-center">
            <button onClick={go} className="btn-primary px-6 py-2 rounded-xl text-sm">
              Compare →
            </button>
          </div>
        ) : null}

        {ca && cb && (
          <>
            {/* Radar */}
            <div className="card rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
                5-Pillar Radar
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-3)", fontSize: 11 }} />
                  <Radar name={ca.name} dataKey="A" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
                  <Radar name={cb.name} dataKey="B" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex justify-center gap-8 mt-2">
                {[{ c: ca, color: COLORS[0] }, { c: cb, color: COLORS[1] }].map(({ c, color }) => (
                  <div key={c.slug} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-xs" style={{ color: "var(--text-2)" }}>{c.flag} {c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-pillar bars */}
            <div className="card rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: "var(--text-3)" }}>
                Pillar-by-Pillar
              </h2>
              <div className="space-y-5">
                {PILLARS.map(({ key, label }) => {
                  const sA = ca.scores[key].score;
                  const sB = cb.scores[key].score;
                  const winner = sA > sB ? "A" : sA < sB ? "B" : "tie";
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <span className="font-semibold tabular-nums"
                          style={{ color: winner === "A" ? COLORS[0] : "var(--text-3)" }}>
                          {sA}/20
                        </span>
                        <span className="font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                          {label}
                        </span>
                        <span className="font-semibold tabular-nums"
                          style={{ color: winner === "B" ? COLORS[1] : "var(--text-3)" }}>
                          {sB}/20
                        </span>
                      </div>
                      {/* Dual bar */}
                      <div className="flex gap-1 items-center">
                        {/* A bar — right-aligned */}
                        <div className="flex-1 flex justify-end h-2 rounded-l-full overflow-hidden" style={{ background: "var(--raised)" }}>
                          <div style={{ width: `${(sA / 20) * 100}%`, background: COLORS[0], borderRadius: "2px 0 0 2px" }} />
                        </div>
                        <div className="w-px h-3 flex-shrink-0" style={{ background: "var(--border)" }} />
                        {/* B bar — left-aligned */}
                        <div className="flex-1 h-2 rounded-r-full overflow-hidden" style={{ background: "var(--raised)" }}>
                          <div style={{ width: `${(sB / 20) * 100}%`, background: COLORS[1], borderRadius: "0 2px 2px 0" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trajectory + projection */}
            <div className="grid grid-cols-2 gap-4">
              {[{ c: ca, rank: rankA, color: COLORS[0] }, { c: cb, rank: rankB, color: COLORS[1] }].map(({ c, rank, color }) => {
                const delta = c.projected_score_2028 - c.total_score;
                return (
                  <div key={c.slug} className="card rounded-2xl p-5">
                    <p className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color }}>
                      <span className="text-xl">{c.flag}</span> {c.name}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-3)" }}>Global rank</span>
                        <span className="font-bold" style={{ color: "var(--text-1)" }}>#{rank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-3)" }}>Trajectory</span>
                        <span className="font-bold" style={{ color: "var(--text-2)" }}>{c.trajectory_label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-3)" }}>2028 projection</span>
                        <span className="font-bold" style={{ color }}>
                          {c.projected_score_2028}/100 ({delta > 0 ? "+" : ""}{delta})
                        </span>
                      </div>
                    </div>
                    <Link href={`/country/${c.slug}`}
                      className="mt-4 block text-center text-xs font-semibold py-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
                      Full profile →
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {(!ca || !cb) && (
          <div className="text-center py-16" style={{ color: "var(--text-3)" }}>
            <p className="text-4xl mb-3">⚔</p>
            <p className="text-sm">Search and select two countries above to compare them</p>
          </div>
        )}
      </div>
    </main>
  );
}
