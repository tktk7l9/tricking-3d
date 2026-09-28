import { describe, expect, it } from "vitest";
import { hashForTrick, trickIdFromHash } from "./hash";

const known = ["back-flip", "side-flip"];

describe("trickIdFromHash", () => {
  it("returns the trick id from the hash", () => {
    expect(trickIdFromHash("#side-flip", known)).toBe("side-flip");
    expect(trickIdFromHash("side-flip", known)).toBe("side-flip");
  });
  it("is lenient about case and surrounding spaces", () => {
    expect(trickIdFromHash("#Side-Flip ", known)).toBe("side-flip");
  });
  it("returns null for empty or unknown hashes", () => {
    expect(trickIdFromHash("", known)).toBeNull();
    expect(trickIdFromHash("#", known)).toBeNull();
    expect(trickIdFromHash("#nope", known)).toBeNull();
  });
  it("decodes percent-encoding safely", () => {
    expect(trickIdFromHash("#%E3%81%82", known)).toBeNull();
    expect(trickIdFromHash("#%E0%A4%A", known)).toBeNull();
  });
});

describe("hashForTrick", () => {
  it("builds a hash", () => {
    expect(hashForTrick("side-flip")).toBe("#side-flip");
  });
});
