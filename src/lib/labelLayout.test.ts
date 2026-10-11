import { describe, expect, it } from "vitest";
import {
  CELLS,
  MARKER_CELLS,
  type Point,
  type Size,
  boundingRect,
  clampToViewport,
  focusKeypoint,
  isCrowded,
  layoutLabels,
  leaderEnd,
  splitLabel,
} from "./labelLayout";

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

describe("isCrowded", () => {
  it("flags a phone canvas with many labels but not a desktop one", () => {
    const phone = { w: 390, h: 388 };
    const desktop = { w: 740, h: 845 };
    expect(isCrowded(9, { w: 100, h: 32 }, phone)).toBe(true);
    expect(isCrowded(9, { w: 110, h: 35 }, desktop)).toBe(false);
    expect(isCrowded(2, { w: 100, h: 32 }, phone)).toBe(false);
  });

  it("is never crowded without a viewport", () => {
    expect(isCrowded(9, { w: 100, h: 32 }, { w: 0, h: 0 })).toBe(false);
  });
});

describe("focusKeypoint", () => {
  const times = [0, 0.3, 0.65, 0.8, 1.2, 1.6];
  it("picks the keypoint nearest the playhead", () => {
    expect(focusKeypoint(times, 0.66)).toBe(2);
    expect(focusKeypoint(times, 0.75)).toBe(3);
    expect(focusKeypoint(times, 0.45)).toBe(1);
  });

  it("prefers the earlier keypoint on a tie and clamps to the ends", () => {
    expect(focusKeypoint(times, 1.0)).toBe(3);
    expect(focusKeypoint(times, -0.2)).toBe(0);
    expect(focusKeypoint(times, 1.8)).toBe(5);
  });

  it("is -1 without keypoints", () => {
    expect(focusKeypoint([], 0.5)).toBe(-1);
  });
});

describe("layoutLabels with marker cells", () => {
  it("lines small markers up beside and above a label instead of under the anchor", () => {
    const marker: Size = { w: 30, h: 30 };
    const anchor = { x: 500, y: 400 };
    const label = { x: anchor.x - 50, y: anchor.y - 16, w: 100, h: 32 };
    const anchors = Array.from({ length: 7 }, () => ({ ...anchor }));
    const { centers } = layoutLabels(anchors, marker, VIEW, { blocked: [label], cells: MARKER_CELLS });
    expectNoOverlap(centers, marker);
    for (const c of centers) {
      expect(c.y, `${c.x},${c.y}`).toBeLessThanOrEqual(anchor.y);
      const clearOfLabel = c.x + 15 <= label.x || c.x - 15 >= label.x + label.w || c.y + 15 <= label.y || c.y - 15 >= label.y + label.h;
      expect(clearOfLabel).toBe(true);
    }
  });
});

describe("boundingRect", () => {
  it("wraps the points with padding on every side", () => {
    expect(boundingRect([{ x: 10, y: 40 }, { x: 30, y: 20 }, { x: 20, y: 30 }], 5)).toEqual({ x: 5, y: 15, w: 30, h: 30 });
  });

  it("is a padded square around a single point and null without points", () => {
    expect(boundingRect([{ x: 7, y: 9 }], 2)).toEqual({ x: 5, y: 7, w: 4, h: 4 });
    expect(boundingRect([])).toBeNull();
  });

  it("keeps labels off the figure when used as a keep-out area", () => {
    const figure = boundingRect([{ x: 480, y: 380 }, { x: 560, y: 470 }], 10)!;
    const anchors = Array.from({ length: 2 }, () => ({ x: 520, y: 400 }));
    const { centers } = layoutLabels(anchors, SIZE, VIEW, { blocked: [figure] });
    for (const c of centers) {
      const clear =
        c.x + SIZE.w / 2 <= figure.x ||
        c.x - SIZE.w / 2 >= figure.x + figure.w ||
        c.y + SIZE.h / 2 <= figure.y ||
        c.y - SIZE.h / 2 >= figure.y + figure.h;
      expect(clear, `${c.x},${c.y}`).toBe(true);
    }
  });
});

describe("clampToViewport", () => {
  const box: Size = { w: 30, h: 30 };
  it("leaves a box that already fits where it is", () => {
    expect(clampToViewport({ x: 200, y: 150 }, box, VIEW)).toEqual({ x: 200, y: 150 });
  });

  it("pulls a box past any edge back inside, keeping the gap", () => {
    expect(clampToViewport({ x: -40, y: 900 }, box, VIEW)).toEqual({ x: 21, y: VIEW.h - 21 });
    expect(clampToViewport({ x: 1200, y: -5 }, box, VIEW, 0)).toEqual({ x: VIEW.w - 15, y: 15 });
  });
});

describe("splitLabel", () => {
  it("breaks after a middle dot or before an opening bracket", () => {
    expect(splitLabel("半ひねり完了・前宙の形へ")).toEqual(["半ひねり完了・", "前宙の形へ"]);
    expect(splitLabel("両足踏切（後方宙返りの入り）")).toEqual(["両足踏切", "（後方宙返りの入り）"]);
    expect(splitLabel("Chamber the knee, then kick")).toEqual(["Chamber the", "knee, then kick"]);
  });

  it("picks the break nearest the middle", () => {
    expect(splitLabel("抱え込み・回転・開き出し")).toEqual(["抱え込み・", "回転・開き出し"]);
    expect(splitLabel("右足・左足を揃えて・着地")).toEqual(["右足・", "左足を揃えて・着地"]);
  });

  it("splits in the middle when there is no break or it is lopsided", () => {
    expect(splitLabel("後方宙返りで抱え込み")).toEqual(["後方宙返り", "で抱え込み"]);
    expect(splitLabel("着地（前方へ大きく移動する）")).toEqual(["着地（前方へ大", "きく移動する）"]);
  });
});

describe("layoutLabels avoid areas and clamping", () => {
  const clearOf = (c: Point, r: { x: number; y: number; w: number; h: number }) =>
    c.x + SIZE.w / 2 <= r.x || c.x - SIZE.w / 2 >= r.x + r.w || c.y + SIZE.h / 2 <= r.y || c.y - SIZE.h / 2 >= r.y + r.h;

  it("keeps labels off an avoid area while there is room elsewhere", () => {
    const figure = { x: 440, y: 300, w: 160, h: 200 };
    const anchors = Array.from({ length: 3 }, () => ({ x: 520, y: 320 }));
    const { centers } = layoutLabels(anchors, SIZE, VIEW, { avoid: [figure] });
    expectNoOverlap(centers, SIZE);
    for (const c of centers) expect(clearOf(c, figure), `${c.x},${c.y}`).toBe(true);
  });

  it("lets labels cover an avoid area rather than each other when nothing else fits", () => {
    const tight: Size = { w: 140, h: 140 };
    const everywhere = { x: 0, y: 0, w: tight.w, h: tight.h };
    const anchors = Array.from({ length: 2 }, () => ({ x: 70, y: 70 }));
    const { centers } = layoutLabels(anchors, { w: 60, h: 30 }, tight, { avoid: [everywhere], gap: 4 });
    expectNoOverlap(centers, { w: 60, h: 30 });
  });

  it("pulls cells past the edge back inside when clamping", () => {
    const narrow: Size = { w: 390, h: 390 };
    const wide: Size = { w: 125, h: 40 };
    const blockedMiddle = { x: 140, y: 0, w: 110, h: 390 };
    const anchor = { x: 195, y: 200 };
    const plain = layoutLabels([anchor], wide, narrow, { blocked: [blockedMiddle] });
    expect(plain.cells[0]).toBe(0);
    const clamped = layoutLabels([anchor], wide, narrow, { blocked: [blockedMiddle], clamp: true });
    const c = clamped.centers[0];
    expect(c.x - wide.w / 2).toBeGreaterThanOrEqual(6);
    expect(c.x + wide.w / 2).toBeLessThanOrEqual(narrow.w - 6);
    expect(c.x + wide.w / 2 <= blockedMiddle.x || c.x - wide.w / 2 >= blockedMiddle.x + blockedMiddle.w).toBe(true);
  });
});
