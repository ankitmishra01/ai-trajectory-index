"use client";

import { useEffect, useState } from "react";
import { ScoredCountry } from "@/lib/types";

interface LastVisitBannerProps {
  countries: ScoredCountry[];
}

interface SavedSnapshot {
  timestamp: number;
  scores: Record<string, number>;
  trajectories: Record<string, string>;
}

const STORAGE_KEY = "ai_traj_last_visit_v2";
const TOP_N = 30;

function buildSnapshot(countries: ScoredCountry[]): SavedSnapshot {
  const top30 = [...countries]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, TOP_N);

  const scores: Record<string, number> = {};
  const trajectories: Record<string, string> = {};

  for (const c of top30) {
    scores[c.slug] = c.total_score;
    trajectories[c.slug] = c.trajectory_label;
  }

  return { timestamp: Date.now(), scores, trajectories };
}

export default function LastVisitBanner({ countries }: LastVisitBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (countries.length === 0) return;

    let saved: SavedSnapshot | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        saved = JSON.parse(raw) as SavedSnapshot;
      }
    } catch {
      // Ignore parse errors
    }

    const newSnapshot = buildSnapshot(countries);

    if (!saved) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSnapshot));
      } catch {
        // Ignore storage errors
      }
      return;
    }

    // Compute score changes (>= 2 pts difference)
    const scoreChanges: Array<{ name: string; slug: string; oldScore: number; newScore: number }> = [];
    const trajectoryChanges: Array<{ name: string; oldLabel: string; newLabel: string }> = [];

    for (const c of countries) {
      const savedScore = saved.scores[c.slug];
      const savedTrajectory = saved.trajectories[c.slug];

      if (savedScore !== undefined && Math.abs(c.total_score - savedScore) >= 2) {
        scoreChanges.push({
          name: c.name,
          slug: c.slug,
          oldScore: savedScore,
          newScore: c.total_score,
        });
      }

      if (savedTrajectory !== undefined && c.trajectory_label !== savedTrajectory) {
        trajectoryChanges.push({
          name: c.name,
          oldLabel: savedTrajectory,
          newLabel: c.trajectory_label,
        });
      }
    }

    const totalChanges = scoreChanges.length + trajectoryChanges.length;

    // Save new snapshot regardless
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSnapshot));
    } catch {
      // Ignore storage errors
    }

    if (totalChanges === 0) {
      return;
    }

    let builtMessage: string;

    if (totalChanges === 1) {
      if (scoreChanges.length === 1) {
        const ch = scoreChanges[0];
        builtMessage = `${ch.name}'s score updated (${ch.oldScore} → ${ch.newScore})`;
      } else {
        const ch = trajectoryChanges[0];
        builtMessage = `${ch.name}'s trajectory strengthened to ${ch.newLabel}`;
      }
    } else if (totalChanges <= 4) {
      builtMessage = `${totalChanges} country scores updated since your last visit`;
    } else {
      builtMessage = `${totalChanges} countries updated with fresh World Bank data`;
    }

    setMessage(builtMessage);
    setDismissed(false);
  }, [countries.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (dismissed || !message) return null;

  return (
    <div
      className="fade-up rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-3"
      style={{
        background: "rgba(16, 185, 129, 0.07)",
        border: "1px solid rgba(16, 185, 129, 0.25)",
        color: "#34d399",
      }}
    >
      <span className="text-sm">🔄 {message}</span>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs transition-colors hover:text-white"
        style={{ color: "var(--text-3)" }}
      >
        ×
      </button>
    </div>
  );
}
