"use client";

import { useState, useEffect } from "react";
import type { NewsArticle } from "@/lib/gdelt";

export default function NewsTicker() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    fetch("/api/news/global")
      .then((r) => r.json())
      .then((d) => {
        if (d.articles?.length) setArticles(d.articles);
      })
      .catch(() => {});
  }, []);

  if (!articles.length) return null;

  // Duplicate for seamless infinite loop
  const doubled = [...articles, ...articles];

  return (
    <div
      className="relative flex items-center overflow-hidden flex-shrink-0"
      style={{
        height: 34,
        background: "rgba(6,11,20,.98)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Left label — opaque so text fades behind it */}
      <div
        className="flex-shrink-0 flex items-center gap-2 pl-4 pr-3 z-10"
        style={{
          height: "100%",
          borderRight: "1px solid var(--border)",
          background: "rgba(6,11,20,.98)",
        }}
      >
        <span className="live-dot" />
        <span
          className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
          style={{ color: "var(--accent)" }}
        >
          AI News
        </span>
      </div>

      {/* Fade-out left edge (over the scrolling text) */}
      <div
        className="absolute left-[80px] top-0 bottom-0 w-8 z-10 pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(6,11,20,.95), transparent)" }}
      />

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden" style={{ height: "100%" }}>
        <div
          className="ticker-scroll flex items-center h-full"
          style={{ width: "max-content" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.animationPlayState = "paused")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.animationPlayState = "running")
          }
        >
          {doubled.map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 flex-shrink-0 transition-opacity hover:opacity-70"
              style={{ textDecoration: "none", paddingLeft: 24, paddingRight: 4 }}
            >
              <span
                className="text-[11px] font-medium leading-none whitespace-nowrap"
                style={{ color: "var(--text-2)" }}
              >
                {a.title}
              </span>
              <span
                className="text-[10px] whitespace-nowrap flex-shrink-0"
                style={{ color: "var(--text-3)" }}
              >
                {a.domain}
              </span>
              <span
                className="flex-shrink-0 rounded-full"
                style={{ width: 3, height: 3, background: "var(--border-mid)" }}
              />
            </a>
          ))}
        </div>
      </div>

      {/* Fade-out right edge */}
      <div
        className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none"
        style={{ background: "linear-gradient(270deg, rgba(6,11,20,.98), transparent)" }}
      />
    </div>
  );
}
