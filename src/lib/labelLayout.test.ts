import { describe, expect, it } from "vitest";
import { CELLS, type Point, type Size, layoutLabels, leaderEnd } from "./labelLayout";

const SIZE: Size = { w: 120, h: 38 };
const VIEW: Size = { w: 1000, h: 800 };

function overlaps(a: Point, b: Point, size: Size): boolean {
  return Math.abs(a.x - b.x) < size.w && Math.abs(a.y - b.y) < size.h;
}

function expectNoOverlap(centers: Point[], size: Size) {
  for (let i = 0; i < centers.length; i++)
    for (let j = i + 1; j < centers.length; j++) expect(overlaps(centers[i], centers[j], size), `${i} vs ${j}`).toBe(false);
}

describe("layoutLabels", () => {
  it("leaves labels that do not collide on their anchors", () => {
    const anchors = [
      { x: 200, y: 300 },
      { x: 500, y: 300 },
      { x: 800, y: 500 },
    ];
    const { centers, cells } = layoutLabels(anchors, SIZE, VIEW);
    expect(centers).toEqual(anchors);
    expect(cells).toEqual([0, 0, 0]);
  });

  it("spreads labels that share one anchor into a grid without overlaps, earliest on the anchor", () => {
    const anchor = { x: 500, y: 420 };
    const anchors = Array.from({ length: 9 }, () => ({ ...anchor }));
    const { centers, cells } = layoutLabels(anchors, SIZE, VIEW);
    expect(centers[0]).toEqual(anchor);
    expect(new Set(cells).size).toBe(9);
    expectNoOverlap(centers, SIZE);
    // The second label goes straight up, so the body under the anchor stays visible.
    expect(centers[1].x).toBe(anchor.x);
    expect(centers[1].y).toBeLessThan(anchor.y);
  });

  it("separates labels whose anchors are only a few pixels apart", () => {
    const anchors = [
      { x: 500, y: 400 },
      { x: 503, y: 398 },
      { x: 497, y: 405 },
    ];
    expectNoOverlap(layoutLabels(anchors, SIZE, VIEW).centers, SIZE);
  });

  it("keeps every label inside the viewport, moving below or aside near the top edge", () => {
    const anchors = Array.from({ length: 5 }, () => ({ x: 500, y: 30 }));
    const { centers } = layoutLabels(anchors, SIZE, VIEW);
    for (const c of centers) {
      expect(c.y - SIZE.h / 2).toBeGreaterThanOrEqual(0);
      expect(c.x - SIZE.w / 2).toBeGreaterThanOrEqual(0);
      expect(c.x + SIZE.w / 2).toBeLessThanOrEqual(VIEW.w);
    }
    expectNoOverlap(centers, SIZE);
  });

  it("keeps last frame's cell while it is still free (no flicker)", () => {
    const anchors = [
      { x: 500, y: 400 },
      { x: 500, y: 400 },
    ];
    const first = layoutLabels(anchors, SIZE, VIEW);
    expect(first.cells[1]).toBe(1);
    // Pretend label 1 previously sat to the left: it stays there instead of jumping up.
    const left = CELLS.findIndex(([x, y]) => x === -1 && y === 0);
    const next = layoutLabels(anchors, SIZE, VIEW, { previous: [0, left] });
    expect(next.cells[1]).toBe(left);
    // An invalid previous cell is ignored.
    expect(layoutLabels(anchors, SIZE, VIEW, { previous: [0, 999] }).cells[1]).toBe(1);
  });

  it("leaves off-screen anchors alone and does not let them reserve space", () => {
    const anchors = [
      { x: -300, y: 400 },
      { x: 500, y: 400 },
    ];
    const { centers, cells } = layoutLabels(anchors, SIZE, VIEW);
    expect(centers[0]).toEqual({ x: -300, y: 400 });
    expect(cells).toEqual([0, 0]);
  });

  it("falls back to the anchor when no cell fits", () => {
    // Room for exactly one label: the second one cannot move anywhere inside.
    const tiny: Size = { w: 140, h: 52 };
    const anchors = [
      { x: 70, y: 26 },
      { x: 70, y: 26 },
    ];
    const { centers, cells } = layoutLabels(anchors, SIZE, tiny);
    expect(cells).toEqual([0, 0]);
    expect(centers[1]).toEqual({ x: 70, y: 26 });
  });
});

describe("layoutLabels keep-out areas", () => {
  it("moves labels off the controls drawn over the view", () => {
    // A camera-button bar across the top right; the anchor sits just below it.
    const bar = { x: 600, y: 0, w: 400, h: 60 };
    const anchors = Array.from({ length: 3 }, () => ({ x: 800, y: 110 }));
    const { centers } = layoutLabels(anchors, SIZE, VIEW, { blocked: [bar] });
    for (const c of centers) {
      const clearOfBar = c.y - SIZE.h / 2 >= bar.y + bar.h || c.x + SIZE.w / 2 <= bar.x;
      expect(clearOfBar, `${c.x},${c.y}`).toBe(true);
    }
    expectNoOverlap(centers, SIZE);
  });

  it("does not move a label whose own spot is clear", () => {
    const anchors = [{ x: 300, y: 400 }];
    const { cells } = layoutLabels(anchors, SIZE, VIEW, { blocked: [{ x: 600, y: 0, w: 400, h: 60 }] });
    expect(cells).toEqual([0]);
  });
});

describe("leaderEnd", () => {
  it("ends on the edge of the label box facing the anchor", () => {
    expect(leaderEnd({ x: 500, y: 400 }, { x: 500, y: 356 }, SIZE)).toEqual({ x: 500, y: 375 });
    const side = leaderEnd({ x: 500, y: 400 }, { x: 374, y: 400 }, SIZE)!;
    expect(side.x).toBeCloseTo(434, 9);
    expect(side.y).toBeCloseTo(400, 9);
  });

  it("draws no line when the anchor is under the label itself", () => {
    expect(leaderEnd({ x: 510, y: 405 }, { x: 500, y: 400 }, SIZE)).toBeNull();
  });
});
