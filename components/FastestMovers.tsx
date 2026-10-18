"use client";

import Link from "next/link";
import { ScoredCountry } from "@/lib/types";
import { competitionRankEntriesBy, formatRank } from "@/lib/rank";

interface FastestMoversProps {
  countries: ScoredCountry[];
  onSortClick: () => void;
}

function MiniSparkline({ from, to, width = 120, height = 28 }: { from: number; to: number; width?: number; height?: number }) {
  const trend = to - from;
  const color = trend > 0 ? "var(--positive)" : trend < 0 ? "var(--negative)" : "var(--dt-text-3)";
  const pts = Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    const noise = 0 /* straight line: today's score to the 2028 projection; no synthetic history */;
    return from + trend * t + noise;
  });
  const min = Math.min(...pts) - 1;
  const max = Math.max(...pts) + 1;
  const range = max - min || 1;
  const pathD = pts.map((p, i) => {
    const x = (i / 11) * width;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const lastY = height - ((pts[11] - min) / range) * height;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={pathD} stroke={color} strokeWidth={1.25} fill="none" />
      <circle cx={width} cy={lastY.toFixed(2)} r={2} fill={color} />
    </svg>
  );
}

export default function FastestMovers({ countries, onSortClick }: FastestMoversProps) {
  // Competition rank on the projected gain. Several economies share the same gain, so
  // numbering the five cards 1..5 asserted an order that came from the input array.
  const gainRanks = competitionRankEntriesBy(countries, (c) => c.slug, (c) => c.projected_score_2028 - c.total_score);
  const top5 = countries.length > 0
    ? [...countries]
        .sort((a, b) => (b.projected_score_2028 - b.total_score) - (a.projected_score_2028 - a.total_score))
        .slice(0, 5)
    : null;

  return (
    <section data-movers style={{ background: "var(--dt-bg)", padding: "40px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--signal)", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 4 }}>↑ TRAJECTORY</div>
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, color: "var(--dt-text-0)", margin: 0, letterSpacing: "-0.015em" }}>
            Fastest movers · projected 2028
          </h4>
        </div>
        <button
          onClick={onSortClick}
          style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--dt-text-2)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
        >
          Sort grid by trajectory →
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, background: "var(--dt-border)", border: "1px solid var(--dt-border)" }}>
        {top5 === null
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 160, background: "var(--dt-surface)" }} />
            ))
          : top5.map((c) => {
              const gain = Math.round(c.projected_score_2028 - c.total_score);
              return (
                <Link
                  key={c.slug}
                  href={`/country/${c.slug}`}
                  style={{ background: "var(--dt-surface)", padding: "20px 18px", textDecoration: "none", display: "block", transition: "background .15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--dt-raised)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--dt-surface)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", fontWeight: 600 }}>{formatRank(gainRanks[c.slug])}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--positive)", fontWeight: 600 }}>+{gain} pts</span>
                  </div>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{c.flag}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--dt-text-0)", lineHeight: 1.1, marginBottom: 10 }}>{c.name}</div>
                  <MiniSparkline from={c.total_score} to={c.projected_score_2028} width={120} height={28} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dt-text-2)" }}>
                    <span>{c.total_score}</span>
                    <span style={{ color: "var(--dt-text-3)" }}>→</span>
                    <span style={{ color: "var(--dt-text-0)", fontWeight: 600 }}>{c.projected_score_2028}</span>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
