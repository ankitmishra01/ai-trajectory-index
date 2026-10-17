// Serve the nightly snapshot (data/scores-live.json) while it is fresh, so /api/scores and page
// metadata do not recompute every source on a cold start; otherwise compute live as before.
import scoresLiveJson from "@/data/scores-live.json";
import { computeScoresResponse } from "@/lib/liveScores";
import { isFresh, type ScoresLiveFile } from "@/lib/snapshot";
import type { ScoresResponse } from "@/lib/types";

const scoresLive = scoresLiveJson as unknown as Partial<ScoresLiveFile>;

export function freshSnapshot(now = Date.now()): ScoresLiveFile | null {
  return scoresLive?.countries?.length && isFresh(scoresLive.generated_at, now) ? (scoresLive as ScoresLiveFile) : null;
}

export async function getScoresResponse(): Promise<{ data: ScoresResponse; served: "snapshot" | "live" }> {
  const snap = freshSnapshot();
  if (snap) return { data: snap, served: "snapshot" };
  return { data: await computeScoresResponse(), served: "live" };
}
