import { describe, expect, it } from "vitest";
import { matchesQuery, normalizeSearch } from "./search";

describe("normalizeSearch", () => {
  it("folds hiragana to katakana and half-width to full-width kana", () => {
    expect(normalizeSearch("ばくちゅう")).toBe("バクチュウ");
    expect(normalizeSearch("ﾊﾞｸ")).toBe("バク");
  });
  it("lowercases and drops spaces, hyphens and middle dots", () => {
    expect(normalizeSearch("Back Flip")).toBe("backflip");
    expect(normalizeSearch("side-flip")).toBe("sideflip");
    expect(normalizeSearch("Ｃｈｅａｔ　Ｋｉｃｋ")).toBe("cheatkick");
    expect(normalizeSearch("踏切・腕")).toBe("踏切腕");
  });
});

describe("matchesQuery", () => {
  const hay = normalizeSearch("バク宙 Backflip back-flip");
  it("matches everything for an empty query", () => {
    expect(matchesQuery(hay, "")).toBe(true);
    expect(matchesQuery(hay, "   ")).toBe(true);
  });
  it("matches leniently typed queries", () => {
    expect(matchesQuery(hay, "ばく")).toBe(true);
    expect(matchesQuery(hay, "back flip")).toBe(true);
    expect(matchesQuery(hay, "BACKFLIP")).toBe(true);
  });
  it("rejects unrelated queries", () => {
    expect(matchesQuery(hay, "コーク")).toBe(false);
  });
});
