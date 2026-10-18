import { describe, expect, it } from "vitest";

import scoresLive from "@/data/scores-live.json";
import {
  competitionRankEntries,
  competitionRankEntriesBy,
  competitionRanks,
  formatRank,
  formatRankLabel,
} from "@/lib/rank";

const c = (slug: string, total_score: number) => ({ slug, total_score });

describe("competitionRanks", () => {
  it("gives equal scores equal ranks and skips the positions they consume", () => {
    const ranks = competitionRanks([c("a", 90), c("b", 84), c("c", 84), c("d", 84), c("e", 80)]);
    expect(ranks).toEqual({ a: 1, b: 2, c: 2, d: 2, e: 5 });
  });

  it("does not depend on input order", () => {
    const forwards = competitionRanks([c("a", 90), c("b", 84), c("c", 84)]);
    const backwards = competitionRanks([c("c", 84), c("b", 84), c("a", 90)]);
    expect(forwards).toEqual(backwards);
  });

  it("marks shared ranks as tied and unique ranks as not tied", () => {
    const entries = competitionRankEntries([c("a", 90), c("b", 84), c("c", 84)]);
    expect(entries.a).toEqual({ rank: 1, tied: false });
    expect(entries.b).toEqual({ rank: 2, tied: true });
    expect(entries.c).toEqual({ rank: 2, tied: true });
  });

  it("handles an empty list", () => {
    expect(competitionRanks([])).toEqual({});
  });
});

describe("competitionRankEntriesBy", () => {
  it("ranks any keyed list on any measure, highest first", () => {
    const rows = [
      { id: "x", gap: 2.5 },
      { id: "y", gap: 7.5 },
      { id: "z", gap: 2.5 },
    ];
    const entries = competitionRankEntriesBy(rows, (r) => r.id, (r) => r.gap);
    expect(entries).toEqual({
      y: { rank: 1, tied: false },
      x: { rank: 2, tied: true },
      z: { rank: 2, tied: true },
    });
  });

  it("agrees with competitionRankEntries on total_score", () => {
    const rows = [c("a", 90), c("b", 84), c("c", 84)];
    expect(competitionRankEntriesBy(rows, (r) => r.slug, (r) => r.total_score))
      .toEqual(competitionRankEntries(rows));
  });
});

describe("rank formatting", () => {
  it("formats the compact token for a column already headed #", () => {
    expect(formatRank({ rank: 4, tied: true })).toBe("=4");
    expect(formatRank({ rank: 4, tied: false })).toBe("4");
    expect(formatRank(undefined)).toBe("—");
  });

  it("formats the display label with the sigil it owns", () => {
    expect(formatRankLabel({ rank: 4, tied: true })).toBe("#4 (tied)");
    expect(formatRankLabel({ rank: 3, tied: false })).toBe("#3");
    expect(formatRankLabel(undefined)).toBe("—");
  });

  // The regression this whole helper exists to prevent: formatRank's "=4" was being
  // interpolated behind a literal "#" in the country page <title>, og:title and JSON-LD
  // description, which published the string "#=4" for six top-ten economies.
  it("never produces a sigil glued to an equals sign", () => {
    for (const entry of [{ rank: 1, tied: false }, { rank: 4, tied: true }, undefined]) {
      expect(formatRankLabel(entry)).not.toContain("#=");
      expect(formatRank(entry)).not.toContain("#");
    }
  });
});

describe("against the published snapshot", () => {
  const countries = (scoresLive as { countries: { slug: string; total_score: number }[] }).countries;
  const entries = competitionRankEntries(countries);

  it("matches the independent definition of a competition rank for every economy", () => {
    expect(countries.length).toBeGreaterThan(100);
    for (const country of countries) {
      const strictlyHigher = countries.filter((other) => other.total_score > country.total_score).length;
      const sameScore = countries.filter((other) => other.total_score === country.total_score).length;
      expect(entries[country.slug]).toEqual({ rank: strictlyHigher + 1, tied: sameScore > 1 });
    }
  });

  it("resolves the six economies tied on the fourth position as a single shared rank", () => {
    const fourth = Object.entries(entries).filter(([, entry]) => entry.rank === 4);
    expect(fourth.length).toBeGreaterThan(1);
    expect(fourth.every(([, entry]) => entry.tied)).toBe(true);
    // The next distinct rank skips the positions the tie consumed.
    const after = Object.values(entries).filter((entry) => entry.rank > 4).map((entry) => entry.rank);
    expect(Math.min(...after)).toBe(4 + fourth.length);
  });
});
