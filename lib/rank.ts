// Standard competition ranking for the readiness table.
//
// The index scores 186 economies on an integer 0-100 scale, so ties are the norm rather than
// the exception: in the 2026-10-18 snapshot, 172 of 186 economies share a total with at least
// one other, and six economies share 84. Sorting by score alone and reading off the array
// index made those six economies "4th" through "9th", an order that came from the position of
// the row in data/countries.json rather than from any measurement. Equal scores now receive
// equal ranks (1, 2, 3, 4, 4, 4, 4, 4, 4, 10, ...).
//
// `tied` marks the economies that share their rank, so the UI can say so instead of implying
// a separation the data does not support.

export interface RankEntry {
  rank: number;
  tied: boolean;
}

export function competitionRankEntries<T extends { slug: string; total_score: number }>(
  countries: readonly T[],
): Record<string, RankEntry> {
  const ordered = [...countries].sort((a, b) => b.total_score - a.total_score);
  const entries: Record<string, RankEntry> = {};
  let rank = 0;
  let seen = 0;
  let previous: number | null = null;

  for (const country of ordered) {
    seen += 1;
    if (previous === null || country.total_score !== previous) {
      rank = seen;
      previous = country.total_score;
    }
    entries[country.slug] = { rank, tied: false };
  }

  const counts = new Map<number, number>();
  for (const entry of Object.values(entries)) counts.set(entry.rank, (counts.get(entry.rank) ?? 0) + 1);
  for (const entry of Object.values(entries)) entry.tied = (counts.get(entry.rank) ?? 0) > 1;

  return entries;
}

export function competitionRanks<T extends { slug: string; total_score: number }>(
  countries: readonly T[],
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(competitionRankEntries(countries)).map(([slug, entry]) => [slug, entry.rank]),
  );
}

// "4" when the rank is unique, "=4" when it is shared.
export function formatRank(entry: RankEntry | undefined): string {
  if (!entry) return "—";
  return entry.tied ? `=${entry.rank}` : String(entry.rank);
}
