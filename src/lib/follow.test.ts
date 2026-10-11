import { describe, expect, it } from "vitest";
import { IN_PLACE_RADIUS, STILL, buildFollowPath, followOffsetAt } from "./follow";

/** Hips samples (xyz) evenly spread over a clip, from a function of normalized time. */
function samples(n: number, at: (u: number) => [number, number]): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const [x, z] = at(i / (n - 1));
    out.push(x, 0.95, z);
  }
  return out;
}

describe("buildFollowPath", () => {
  it("keeps tricks that stay in place on the fixed framing", () => {
    const path = buildFollowPath(samples(90, (u) => [0.2 * Math.sin(u * 6), 0.3 * u]), 1.6);
    expect(path.active).toBe(false);
    expect(path.zoom).toBe(1);
    expect(path.center).toEqual({ x: 0, z: 0 });
    for (const t of [0, 0.4, 0.8, 1.6]) expect(followOffsetAt(path, t)).toEqual({ x: 0, z: 0 });
  });

  it("treats the in-place radius as the boundary", () => {
    const edge = buildFollowPath(samples(90, (u) => [0, IN_PLACE_RADIUS * u]), 1.6);
    expect(edge.active).toBe(false);
    const beyond = buildFollowPath(samples(90, (u) => [0, (IN_PLACE_RADIUS + 0.05) * u]), 1.6);
    expect(beyond.active).toBe(true);
  });

  it("follows a travelling trick smoothly from the start to near the end", () => {
    // Cartwheel-like: still for a third of the clip, then 4 m sideways, then still.
    const path = buildFollowPath(
      samples(90, (u) => [u < 1 / 3 ? 0 : u > 2 / 3 ? 4 : (u - 1 / 3) * 12, 0]),
      1.8,
    );
    expect(path.active).toBe(true);
    const start = followOffsetAt(path, 0);
    const end = followOffsetAt(path, 1.8);
    expect(Math.abs(start.x)).toBeLessThan(0.05);
    expect(end.x).toBeGreaterThan(3.95);
    // Monotone and without jumps: no step bigger than the body itself moves.
    let prev = start.x;
    let maxStep = 0;
    for (let i = 1; i <= 180; i++) {
      const x = followOffsetAt(path, (1.8 * i) / 180).x;
      expect(x).toBeGreaterThanOrEqual(prev - 1e-9);
      maxStep = Math.max(maxStep, x - prev);
      prev = x;
    }
    expect(maxStep).toBeLessThan((4 / 0.6) * 0.01 * 1.01);
  });

  it("smooths out the bobbing of the hips instead of echoing it", () => {
    // Six side-to-side wobbles (3.3 Hz) that start and end centred, while travelling 2 m.
    const wobble = (u: number): [number, number] => [0.25 * Math.sin(u * Math.PI * 12), 2 * u];
    const path = buildFollowPath(samples(120, wobble), 1.8);
    let maxSide = 0;
    for (let i = 0; i <= 100; i++) maxSide = Math.max(maxSide, Math.abs(followOffsetAt(path, (1.8 * i) / 100).x));
    expect(maxSide).toBeLessThan(0.08);
  });

  it("frames the whole travelled area for reduced motion", () => {
    const short = buildFollowPath(samples(90, (u) => [0, 1.2 * u]), 1.7);
    expect(short.center.x).toBeCloseTo(0, 6);
    expect(short.center.z).toBeCloseTo(0.6, 6);
    expect(short.zoom).toBe(1);
    const long = buildFollowPath(samples(90, (u) => [4.5 * u, 0]), 1.8);
    expect(long.center.x).toBeCloseTo(2.25, 6);
    expect(long.zoom).toBeGreaterThan(1.5);
    const huge = buildFollowPath(samples(90, (u) => [10 * u, 0]), 1.8);
    expect(huge.zoom).toBe(1.8);
  });

  it("measures the path from where the hips start", () => {
    const shifted = buildFollowPath(samples(90, (u) => [3 + 2 * u, -1]), 1.8);
    const fromOrigin = buildFollowPath(samples(90, (u) => [2 * u, 0]), 1.8);
    for (const t of [0, 0.5, 1.1, 1.8]) {
      expect(followOffsetAt(shifted, t).x).toBeCloseTo(followOffsetAt(fromOrigin, t).x, 9);
      expect(followOffsetAt(shifted, t).z).toBeCloseTo(0, 9);
    }
    expect(shifted.center.x).toBeCloseTo(1, 9);
    expect(shifted.center.z).toBeCloseTo(0, 9);
  });

  it("clamps times outside the clip and handles degenerate input", () => {
    const path = buildFollowPath(samples(30, (u) => [0, 3 * u]), 1.5);
    expect(followOffsetAt(path, -1)).toEqual(followOffsetAt(path, 0));
    expect(followOffsetAt(path, 9)).toEqual(followOffsetAt(path, 1.5));
    expect(buildFollowPath([0, 1, 0], 1.5)).toBe(STILL);
    expect(buildFollowPath(samples(30, (u) => [0, 3 * u]), 0)).toBe(STILL);
  });
});
