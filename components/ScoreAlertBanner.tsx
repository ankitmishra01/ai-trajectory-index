"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ScoredCountry } from "@/lib/types";

interface ScoreSnapshot {
  slug: string;
  score: number;
  ts: number;
}

interface Change {
  slug:   string;
  name:   string;
  flag:   string;
  before: number;
  after:  number;
  delta:  number;
}

const STORAGE_KEY = "ati_score_snapshot";

interface Props {
  countries: ScoredCountry[];
}

export default function ScoreAlertBanner({ countries }: Props) {
  const [changes, setChanges]         = useState<Change[]>([]);
  const [dismissed, setDismissed]     = useState(false);
  const [emailOpen, setEmailOpen]     = useState(false);
  const [email, setEmail]             = useState("");
  const [emailSaved, setEmailSaved]   = useState(false);

  useEffect(() => {
    if (!countries.length) return;

    // Load previous snapshot
    let prev: ScoreSnapshot[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) prev = JSON.parse(raw);
    } catch { /* ignore */ }

    // Detect changes
    if (prev.length > 0) {
      const detected: Change[] = [];
      for (const c of countries) {
        const old = prev.find((p) => p.slug === c.slug);
        if (old && old.score !== c.total_score) {
          detected.push({ slug: c.slug, name: c.name, flag: c.flag, before: old.score, after: c.total_score, delta: c.total_score - old.score });
        }
      }
      if (detected.length > 0) setChanges(detected);
    }

    // Save new snapshot
    try {
      const snapshot: ScoreSnapshot[] = countries.map((c) => ({ slug: c.slug, score: c.total_score, ts: Date.now() }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch { /* ignore */ }
  }, [countries]);

  // Load saved email opt-in
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ati_alert_email");
      if (saved) { setEmail(saved); setEmailSaved(true); }
    } catch { /* ignore */ }
  }, []);

  function saveEmail() {
    if (!email.includes("@")) return;
    try { localStorage.setItem("ati_alert_email", email); } catch { /* ignore */ }
    setEmailSaved(true);
    setEmailOpen(false);
  }

  function removeEmail() {
    try { localStorage.removeItem("ati_alert_email"); } catch { /* ignore */ }
    setEmail(""); setEmailSaved(false);
  }

  if (dismissed) return null;

  // Show email opt-in even when no changes detected
  const showBanner = changes.length > 0 || emailOpen;
  if (!showBanner) return (
    <div className="mb-4">
      <button
        onClick={() => setEmailOpen(true)}
        className="flex items-center gap-2 text-xs transition-colors hover:text-white"
        style={{ color: "var(--text-3)" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {emailSaved ? `Alerts on for ${email}` : "Get score alerts"}
      </button>
    </div>
  );

  return (
    <div className="mb-6 rounded-2xl overflow-hidden fade-up"
      style={{ border: "1px solid rgba(59,130,246,.25)", background: "rgba(59,130,246,.05)" }}>

      {/* Change rows */}
      {changes.length > 0 && (
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Scores updated since your last visit
            </p>
            <button onClick={() => setDismissed(true)} className="ml-auto text-xs transition-colors hover:text-white"
              style={{ color: "var(--text-3)" }}>Dismiss ×</button>
          </div>
          <div className="space-y-2">
            {changes.slice(0, 5).map((ch) => (
              <Link key={ch.slug} href={`/country/${ch.slug}`}
                className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <span className="text-lg">{ch.flag}</span>
                <span className="text-sm font-medium flex-1" style={{ color: "var(--text-1)" }}>{ch.name}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-3)" }}>
                  {ch.before} →{" "}
                </span>
                <span className="text-sm font-black tabular-nums"
                  style={{ color: ch.delta > 0 ? "#4ade80" : "#f87171" }}>
                  {ch.after}
                </span>
                <span className="text-xs font-bold" style={{ color: ch.delta > 0 ? "#4ade80" : "#f87171" }}>
                  ({ch.delta > 0 ? "+" : ""}{ch.delta})
                </span>
              </Link>
            ))}
            {changes.length > 5 && (
              <p className="text-xs" style={{ color: "var(--text-3)" }}>+{changes.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* Email opt-in */}
      {(emailOpen || !emailSaved) && (
        <div className="px-5 py-3 flex items-center gap-3 flex-wrap"
          style={{ borderTop: changes.length > 0 ? "1px solid rgba(59,130,246,.18)" : "none" }}>
          {emailSaved ? (
            <>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                ✓ Alerts configured for <strong style={{ color: "var(--text-2)" }}>{email}</strong>
              </span>
              <button onClick={removeEmail} className="text-xs transition-colors hover:text-red-400 ml-auto"
                style={{ color: "var(--text-3)" }}>Remove ×</button>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: "var(--accent)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveEmail(); }}
                className="flex-1 min-w-[180px] input-base text-sm py-1"
                style={{ background: "var(--raised)" }}
              />
              <button onClick={saveEmail}
                disabled={!email.includes("@")}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#fff" }}>
                Notify me
              </button>
              <button onClick={() => setEmailOpen(false)} className="text-xs transition-colors hover:text-white"
                style={{ color: "var(--text-3)" }}>Cancel</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
