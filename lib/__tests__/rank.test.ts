import { describe, expect, it } from "vitest";

import { competitionRankEntries, competitionRanks, formatRank } from "@/lib/rank";

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

  it("formats shared ranks with an equals sign", () => {
    expect(formatRank({ rank: 4, tied: true })).toBe("=4");
    expect(formatRank({ rank: 4, tied: false })).toBe("4");
    expect(formatRank(undefined)).toBe("—");
  });

  it("handles an empty list", () => {
    expect(competitionRanks([])).toEqual({});
  });
});
