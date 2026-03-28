"use client";

import { useState, useEffect } from "react";
import type { NewsArticle } from "@/lib/gdelt";
import type { NewsSignal } from "@/lib/openrouter";

interface Props {
  slug: string;
  countryName: string;
}

const SENTIMENT_STYLES: Record<string, { bg: string; border: string; color: string; label: string }> = {
  positive: { bg: "rgba(34,197,94,.06)",  border: "rgba(34,197,94,.25)",  color: "#4ade80", label: "Positive signal" },
  neutral:  { bg: "rgba(148,163,184,.05)", border: "rgba(148,163,184,.20)", color: "#94a3b8", label: "Neutral"         },
  negative: { bg: "rgba(239,68,68,.06)",  border: "rgba(239,68,68,.25)",  color: "#f87171", label: "Negative signal" },
};

const MOMENTUM_ICON: Record<string, string> = {
  accelerating: "↑↑",
  stable:       "→",
  slowing:      "↓",
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1)  return "just now";
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

export default function CountryNewsFeed({ slug, countryName }: Props) {
  const [articles, setArticles]     = useState<NewsArticle[] | null>(null);
  const [signal, setSignal]         = useState<NewsSignal | null>(null);
  const [signalStatus, setSignalStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [signalError, setSignalError] = useState<string | null>(null);
  const [articleError, setArticleError] = useState<string | null>(null);

  // Fetch articles immediately
  useEffect(() => {
    fetch(`/api/news/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error && !d.articles?.length) {
          setArticleError(d.error);
        } else {
          setArticles(d.articles ?? []);
        }
      })
      .catch(() => setArticleError("Could not load news feed."));
  }, [slug]);

  const fetchSignal = () => {
    setSignalStatus("loading");
    setSignalError(null);
    fetch(`/api/news-signal/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setSignalStatus("error"); setSignalError(d.error); }
        else if (d.signal) { setSignal(d.signal); setSignalStatus("done"); }
        else { setSignalStatus("error"); setSignalError("No signal data returned."); }
      })
      .catch(() => { setSignalStatus("error"); setSignalError("Network error."); });
  };

  const sentStyle = signal ? SENTIMENT_STYLES[signal.sentiment] ?? SENTIMENT_STYLES.neutral : null;

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Live AI News Feed
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Real-time headlines from GDELT · Updated hourly
          </p>
        </div>
        {/* AI Signal button */}
        {signalStatus === "idle" && (
          <button
            onClick={fetchSignal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(59,130,246,.10)", color: "var(--accent)", border: "1px solid rgba(59,130,246,.25)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Signal Analysis
          </button>
        )}
        {signalStatus === "loading" && (
          <span className="text-xs" style={{ color: "var(--text-3)" }}>Analysing headlines…</span>
        )}
      </div>

      <div className="px-6 sm:px-8 py-5 space-y-4">

        {/* ── AI Signal panel ── */}
        {signalStatus === "done" && signal && sentStyle && (
          <div className="rounded-xl p-4"
            style={{ background: sentStyle.bg, border: `1px solid ${sentStyle.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-black" style={{ color: sentStyle.color }}>
                {MOMENTUM_ICON[signal.momentum]}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: sentStyle.color }}>
                {sentStyle.label} · {signal.momentum}
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-2)" }}>
              {signal.summary}
            </p>
            {signal.key_events.length > 0 && (
              <ul className="space-y-1 mb-3">
                {signal.key_events.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-3)" }}>
                    <span className="mt-0.5 flex-shrink-0" style={{ color: sentStyle.color }}>→</span>
                    {e}
                  </li>
                ))}
              </ul>
            )}
            {signal.pillars_affected.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Pillars:</span>
                {signal.pillars_affected.map((p) => (
                  <span key={p} className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: "var(--raised)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                    {p.replace("_", " ")}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] mt-3" style={{ color: "var(--text-3)" }}>
              ⚡ AI-generated signal from recent headlines · Does not modify core pillar scores
            </p>
          </div>
        )}

        {signalStatus === "error" && signalError && (
          <p className="text-xs rounded-xl px-3 py-2"
            style={{ background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.15)", color: "#f87171" }}>
            Signal error: {signalError}
          </p>
        )}

        {/* ── Article list ── */}
        {articles === null && !articleError && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl h-14" />
            ))}
          </div>
        )}

        {articleError && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-3)" }}>
            {articleError}
          </p>
        )}

        {articles !== null && articles.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-3)" }}>
            No recent AI news found for {countryName} in the last 14 days.
          </p>
        )}

        {articles !== null && articles.length > 0 && (
          <div className="space-y-1">
            {articles.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all group"
                style={{ textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--raised)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Source dot */}
                <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--accent)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug transition-colors group-hover:text-white"
                    style={{ color: "var(--text-1)" }}>
                    {a.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
                    {a.domain} · {timeAgo(a.date)}
                  </p>
                </div>
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-3)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
