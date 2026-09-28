import { describe, expect, it } from "vitest";
import { clampSeekTime, stepTime } from "./seek";

describe("clampSeekTime", () => {
  it("keeps times inside the clip unchanged", () => {
    expect(clampSeekTime(0.5, 1.6)).toBe(0.5);
    expect(clampSeekTime(0, 1.6)).toBe(0);
  });
  it("keeps the landing keypoint (t = duration) on the last frame instead of wrapping to 0", () => {
    const t = clampSeekTime(1.6, 1.6);
    expect(t).toBeLessThan(1.6);
    expect(t).toBeGreaterThan(1.59);
  });
  it("clamps negative and out-of-range values", () => {
    expect(clampSeekTime(-1, 1.6)).toBe(0);
    expect(clampSeekTime(5, 1.6)).toBeLessThan(1.6);
  });
  it("returns 0 for an empty clip", () => {
    expect(clampSeekTime(1, 0)).toBe(0);
  });
});

describe("stepTime", () => {
  it("steps one 30fps frame forward and back", () => {
    expect(stepTime(0.5, 1.6, 1)).toBeCloseTo(0.5 + 1 / 30);
    expect(stepTime(0.5, 1.6, -1)).toBeCloseTo(0.5 - 1 / 30);
  });
  it("wraps around the loop", () => {
    expect(stepTime(0, 1.6, -1)).toBeCloseTo(1.6 - 1 / 30);
    expect(stepTime(1.59, 1.6, 1)).toBeCloseTo(1.59 + 1 / 30 - 1.6);
  });
});
