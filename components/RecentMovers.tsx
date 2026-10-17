"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MoversResult } from "@/lib/history";

interface Named { slug: string; name: string; flag: string }

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// Actual score changes between nightly snapshots (not projections). Shows an honest
// note until there are at least two snapshots to compare.
export default function RecentMovers({ countries }: { countries: Named[] }) {
  const [data, setData] = useState<MoversResult | null>(null);
  useEffect(() => {
    fetch("/api/movers?days=30").then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);
  if (!data) return null;
  const bySlug = new Map(countries.map((c) => [c.slug, c]));
  const top = data.movers.slice(0, 5);

  return (
    <section data-recent-movers style={{ background: "var(--dt-bg)", padding: "0 48px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--signal)", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 4 }}>↕ MEASURED CHANGE</div>
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, color: "var(--dt-text-0)", margin: 0, letterSpacing: "-0.015em" }}>
            Biggest movers · last 30 days
          </h4>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dt-text-3)" }}>
          {data.historyStart ? `History starts ${fmtDate(data.historyStart)}` : "History starts with the first nightly snapshot"}
          {data.baseline && data.latest ? ` · comparing ${fmtDate(data.baseline)} → ${fmtDate(data.latest)}${data.short ? ` (${data.spanDays} days so far)` : ""}` : ""}
        </span>
      </div>
      {top.length === 0 ? (
        <div style={{ background: "var(--dt-surface)", border: "1px solid var(--dt-border)", padding: "20px 18px", fontSize: 13, color: "var(--dt-text-2)" }}>
          {data.latest && data.historyStart === data.latest
            ? "Only one nightly snapshot so far. Movers appear once a second snapshot is recorded."
            : "No score changes between the compared snapshots."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 1, background: "var(--dt-border)", border: "1px solid var(--dt-border)" }}>
          {top.map((m) => {
            const c = bySlug.get(m.slug);
            const up = m.change > 0;
            return (
              <Link key={m.iso3} href={`/country/${m.slug}`} style={{ background: "var(--dt-surface)", padding: "20px 18px", textDecoration: "none", display: "block" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dt-text-3)", fontWeight: 600 }}>{m.iso3}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: up ? "var(--positive)" : "var(--negative)", fontWeight: 600 }}>{up ? "+" : ""}{m.change} pts</span>
                </div>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{c?.flag ?? ""}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--dt-text-0)", lineHeight: 1.1, marginBottom: 10 }}>{c?.name ?? m.slug}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dt-text-2)" }}>
                  <span>{m.from}</span><span style={{ color: "var(--dt-text-3)" }}>→</span><span style={{ color: "var(--dt-text-0)", fontWeight: 600 }}>{m.to}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
