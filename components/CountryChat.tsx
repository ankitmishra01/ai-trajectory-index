"use client";

import { useState, useEffect, useRef } from "react";
import type { ScoredCountry } from "@/lib/types";

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
}

const STARTERS = [
  "Why is this country's governance score relatively low?",
  "What's holding back AI adoption here?",
  "How does this compare to regional peers?",
  "What policy changes would move the needle most?",
];

interface Props {
  country: ScoredCountry;
}

export default function CountryChat({ country }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [open, setOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send(q: string) {
    const text = q.trim();
    if (!text || thinking) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setThinking(true);

    const context = [{
      name:                 country.name,
      flag:                 country.flag,
      region:               country.region,
      total_score:          country.total_score,
      trajectory_label:     country.trajectory_label,
      trajectory_score:     country.trajectory_score,
      projected_score_2028: country.projected_score_2028,
      top_accelerator:      country.top_accelerator,
      top_risk:             country.top_risk,
      pillar_scores: {
        infrastructure:     country.scores.infrastructure.score,
        talent:             country.scores.talent.score,
        governance:         country.scores.governance.score,
        investment:         country.scores.investment.score,
        economic_readiness: country.scores.economic_readiness.score,
      },
    }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.filter((m) => m.role !== "error"), { role: "user", content: text }],
          context,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: "error", content: data.error }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? data.message ?? "No response." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "error", content: "Network error — please try again." }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* Header toggle */}
      <button
        className="w-full px-6 sm:px-8 py-5 flex items-center justify-between text-left"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Ask AI about {country.name}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(59,130,246,.10)", border: "1px solid rgba(59,130,246,.22)", color: "var(--accent)" }}>
              via OpenRouter
            </span>
            {messages.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(59,130,246,.15)", color: "var(--accent)" }}>
                {messages.filter((m) => m.role !== "error").length}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Country score pre-loaded · ask anything about {country.name}&apos;s AI trajectory
          </p>
        </div>
        <span className={`text-sm transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-3)" }}>↓</span>
      </button>

      {open && (
        <div className="flex flex-col" style={{ maxHeight: "480px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 space-y-3" style={{ minHeight: 120 }}>
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
                  Try one of these:
                </p>
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-xl transition-all hover:opacity-90"
                    style={{ background: "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.18)", color: "var(--text-2)" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] text-sm leading-relaxed px-4 py-2.5 rounded-2xl`}
                  style={
                    m.role === "user"
                      ? { background: "rgba(59,130,246,.15)", color: "var(--text-1)", borderBottomRightRadius: 4 }
                      : m.role === "error"
                      ? { background: "rgba(239,68,68,.08)", color: "#f87171", border: "1px solid rgba(239,68,68,.2)", borderBottomLeftRadius: 4 }
                      : { background: "var(--raised)", color: "var(--text-2)", border: "1px solid var(--border)", borderBottomLeftRadius: 4 }
                  }>
                  {m.content}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.4s]" />
                <span className="ml-1">Thinking…</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-6 sm:px-8 py-3 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
              placeholder={`Ask about ${country.name}…`}
              className="flex-1 input-base text-sm"
              disabled={thinking}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || thinking}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
