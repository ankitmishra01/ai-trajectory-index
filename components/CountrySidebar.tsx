"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ScoredCountry } from "@/lib/types";

// Must match the exact region strings in data/countries.json (there are only
// 4 — Middle East and Africa are combined into one region there).
const REGION_ORDER = ["Americas", "Europe", "Asia-Pacific", "Middle East & Africa"];

interface CountrySidebarProps {
  countries: ScoredCountry[];
  currentSlug: string;
  /** Called after a country link is clicked — used to close the mobile drawer. */
  onSelect?: () => void;
}

/**
 * Persistent country switcher for the country detail page — search + a
 * region-grouped list of all 186 economies, so you can jump straight from
 * one country's page to another without going back to the index.
 */
export default function CountrySidebar({ countries, currentSlug, onSelect }: CountrySidebarProps) {
  const [query, setQuery] = useState("");
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Reveal the current country on mount (and whenever it changes, e.g. after
  // navigating to a different country) instead of leaving the list at an
  // arbitrary scroll position.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? countries.filter((c) => c.name.toLowerCase().includes(q))
      : countries;
    const sorted = [...filtered].sort((a, b) => b.total_score - a.total_score);
    const byRegion = new Map<string, ScoredCountry[]>();
    for (const c of sorted) {
      const list = byRegion.get(c.region) ?? [];
      list.push(c);
      byRegion.set(c.region, list);
    }
    const regions = Array.from(byRegion.keys()).sort(
      (a, b) => REGION_ORDER.indexOf(a) - REGION_ORDER.indexOf(b)
    );
    return regions.map((region) => ({ region, list: byRegion.get(region)! }));
  }, [countries, query]);

  return (
    <nav className="flex flex-col h-full" aria-label="Country switcher">
      <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/" className="text-sm font-black font-serif-display block mb-3"
          style={{ color: "var(--text-1)" }} onClick={onSelect}>
          AI Trajectory Index
        </Link>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 186 countries…"
          className="w-full px-3 py-2 rounded-lg text-xs outline-none"
          style={{ background: "var(--raised)", border: "1px solid var(--border)", color: "var(--text-1)" }}
        />
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {grouped.length === 0 && (
          <p className="text-xs text-center py-6" style={{ color: "var(--text-3)" }}>No matches</p>
        )}
        {grouped.map(({ region, list }) => (
          <div key={region} className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5"
              style={{ color: "var(--text-3)" }}>
              {region}
            </p>
            {list.map((c) => {
              const active = c.slug === currentSlug;
              return (
                <Link
                  key={c.slug}
                  ref={active ? activeRef : undefined}
                  href={`/country/${c.slug}`}
                  onClick={onSelect}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors"
                  style={active
                    ? { background: "var(--accent)", color: "#fff", fontWeight: 700 }
                    : { color: "var(--text-2)" }
                  }
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-[10px] tabular-nums" style={{ color: active ? "rgba(255,255,255,.8)" : "var(--text-3)" }}>
                    {c.total_score}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
