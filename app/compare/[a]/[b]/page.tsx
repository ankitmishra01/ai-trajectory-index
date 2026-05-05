"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import staticData from "@/data/countries.json";
import { useCountUp } from "@/hooks/useCountUp";
import SiteHeader from "@/components/SiteHeader";

const PILLARS = [
  { key: "infrastructure",     label: "Infrastructure" },
  { key: "talent",             label: "Talent"         },
  { key: "governance",         label: "Governance"     },
  { key: "investment",         label: "Investment"     },
  { key: "economic_readiness", label: "Econ Readiness" },
] as const;

const COLORS = ["#D64528", "#3F7A4D"] as const;

function scoreColor(s: number) {
  if (s >= 80) return "var(--positive)";
  if (s >= 60) return "var(--dt-text-0)";
  if (s >= 40) return "#B58A2E";
  return "var(--negative)";
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
    <main style={{ minHeight: "100vh", background: "var(--dt-bg)" }}>
      <SiteHeader activePage="compare" />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>

        {/* Country pickers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {([{ slug: slugA, setSlug: setSlugA, exclude: slugB, color: COLORS[0] },
             { slug: slugB, setSlug: setSlugB, exclude: slugA, color: COLORS[1] }] as const).map(
            ({ setSlug, exclude, color }, i) => {
              const c = i === 0 ? ca : cb;
              return (
                <div key={i} style={{ background: "var(--dt-surface)", border: "1px solid var(--dt-border)", padding: 16 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 10, color }}>
                    COUNTRY {i === 1 ? "B" : "A"}
                  </p>
                  <CountrySearch value={c?.name ?? ""} onChange={(s) => { setSlug(s); }} exclude={exclude} />
                  {c && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 36 }}>{c.flag}</span>
                      <div>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, color: "var(--dt-text-0)" }}>{c.name}</p>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--dt-text-3)", marginTop: 2 }}>#{i === 0 ? rankA : rankB} globally · {c.region}</p>
                      </div>
                      <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 32, fontWeight: 500 }}>
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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <button onClick={go} className="btn-primary" style={{ padding: "8px 24px", fontSize: 13 }}>
              Compare →
            </button>
          </div>
        ) : null}

        {ca && cb && (
          <>
            {/* Radar */}
            <div style={{ background: "var(--dt-surface)", border: "1px solid var(--dt-border)", padding: 24, marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--dt-text-3)", marginBottom: 16 }}>
                5-PILLAR RADAR
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--dt-text-3)", fontSize: 11, fontFamily: "var(--font-sans)" }} />
                  <Radar name={ca.name} dataKey="A" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.12} strokeWidth={2} />
                  <Radar name={cb.name} dataKey="B" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.12} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 8 }}>
                {[{ c: ca, color: COLORS[0] }, { c: cb, color: COLORS[1] }].map(({ c, color }) => (
                  <div key={c.slug} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, background: color, display: "inline-block" }} />
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--dt-text-2)" }}>{c.flag} {c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-pillar bars */}
            <div style={{ background: "var(--dt-surface)", border: "1px solid var(--dt-border)", padding: 24, marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--dt-text-3)", marginBottom: 20 }}>
                PILLAR-BY-PILLAR
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {PILLARS.map(({ key, label }) => {
                  const sA = ca.scores[key].score;
                  const sB = cb.scores[key].score;
                  const winner = sA > sB ? "A" : sA < sB ? "B" : "tie";
                  return (
                    <div key={key}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: winner === "A" ? COLORS[0] : "var(--dt-text-3)" }}>
                          {sA}/20
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--dt-text-3)" }}>
                          {label.toUpperCase()}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: winner === "B" ? COLORS[1] : "var(--dt-text-3)" }}>
                          {sB}/20
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", height: 6, background: "var(--dt-raised)", overflow: "hidden" }}>
                          <div style={{ width: `${(sA / 20) * 100}%`, background: COLORS[0] }} />
                        </div>
                        <div style={{ width: 1, height: 10, flexShrink: 0, background: "var(--dt-border-strong)" }} />
                        <div style={{ flex: 1, height: 6, background: "var(--dt-raised)", overflow: "hidden" }}>
                          <div style={{ width: `${(sB / 20) * 100}%`, background: COLORS[1] }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trajectory + projection */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[{ c: ca, rank: rankA, color: COLORS[0] }, { c: cb, rank: rankB, color: COLORS[1] }].map(({ c, rank, color }) => {
                const delta = c.projected_score_2028 - c.total_score;
                return (
                  <div key={c.slug} style={{ background: "var(--dt-surface)", border: "1px solid var(--dt-border)", padding: 20 }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color }}>
                      <span style={{ fontSize: 20 }}>{c.flag}</span> {c.name.toUpperCase()}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "Global rank", value: `#${rank}` },
                        { label: "Trajectory",  value: c.trajectory_label },
                        { label: "2028 projection", value: `${c.projected_score_2028}/100 (${delta > 0 ? "+" : ""}${delta})`, accent: color },
                      ].map(({ label, value, accent }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--dt-text-3)" }}>{label}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: accent ?? "var(--dt-text-1)" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <Link href={`/country/${c.slug}`}
                      style={{ marginTop: 16, display: "block", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, padding: "6px 0", textDecoration: "none", color, border: `1px solid ${color}`, opacity: 0.9 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
                    >
                      Full profile →
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {(!ca || !cb) && (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--dt-text-3)" }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>⚔</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>Search and select two countries above to compare them</p>
          </div>
        )}
      </div>
    </main>
  );
}
