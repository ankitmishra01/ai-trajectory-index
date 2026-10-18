// Standard competition ranking for every ordered list the site publishes.
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
//
// Display convention — ONE convention, used everywhere:
//   * `formatRankLabel` owns the "#" sigil and returns the complete display string,
//     "#4" or "#4 (tied)". Call sites must never prepend their own "#": doing exactly that,
//     to a formatter that returned "=4", is what put the literal "#=4" into the <title>,
//     og:title and JSON-LD description of six top-ten country pages.
//   * `formatRank` is the compact token, "4" or "=4", for a numeric column that is already
//     headed "#". It is the only place "=" appears, and it is never combined with a sigil.

export interface RankEntry {
  rank: number;
  tied: boolean;
}

// Competition rank over any keyed list and any numeric measure, highest value first. Used for
// the readiness table, regional tables, adoption, governance gaps and trajectory movers, so
// that every ordered list on the site resolves ties the same way.
export function competitionRankEntriesBy<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  valueOf: (item: T) => number,
): Record<string, RankEntry> {
  const counts = new Map<number, number>();
  for (const item of items) {
    const value = valueOf(item);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const ordered = [...items].sort((a, b) => valueOf(b) - valueOf(a));
  const entries: Record<string, RankEntry> = {};
  let rank = 0;
  let position = 0;
  let previous: number | null = null;

  for (const item of ordered) {
    position += 1;
    const value = valueOf(item);
    if (previous === null || value !== previous) {
      rank = position;
      previous = value;
    }
    entries[keyOf(item)] = { rank, tied: (counts.get(value) ?? 0) > 1 };
  }

  return entries;
}

export function competitionRankEntries<T extends { slug: string; total_score: number }>(
  countries: readonly T[],
): Record<string, RankEntry> {
  return competitionRankEntriesBy(countries, (c) => c.slug, (c) => c.total_score);
}

export function competitionRanks<T extends { slug: string; total_score: number }>(
  countries: readonly T[],
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(competitionRankEntries(countries)).map(([slug, entry]) => [slug, entry.rank]),
  );
}

// Compact token for a column already headed "#": "4", or "=4" when the rank is shared.
// Never prefix this with "#".
export function formatRank(entry: RankEntry | undefined): string {
  if (!entry) return "—";
  return entry.tied ? `=${entry.rank}` : String(entry.rank);
}

// Full display string including the sigil: "#4", or "#4 (tied)" when the rank is shared.
// This is what titles, metadata, hero lines and prose use.
export function formatRankLabel(entry: RankEntry | undefined): string {
  if (!entry) return "—";
  return entry.tied ? `#${entry.rank} (tied)` : `#${entry.rank}`;
}
