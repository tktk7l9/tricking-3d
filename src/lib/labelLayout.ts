/* Screen-space layout for the keypoint labels drawn in the 3D view.
 *
 * Each label is anchored above the hips at its keypoint time. Tricks that stay
 * in place put several anchors on the same spot, so the labels used to sit on
 * top of each other. Labels are placed greedily in keypoint order: each takes
 * the first free cell of a small grid around its anchor (above the head first,
 * then beside it), inside the viewport and clear of the controls drawn over
 * it. A label keeps last frame's cell while it is still free, so the layout
 * does not flicker as the camera moves.
 */

export type Point = { x: number; y: number };
export type Size = { w: number; h: number };
/** Axis-aligned screen rectangle (top-left corner and size, pixels). */
export type Rect = { x: number; y: number; w: number; h: number };

export type LayoutOptions = {
  /** cell index per label from the previous frame */
  previous?: number[];
  /** spacing between labels and from the edges, pixels */
  gap?: number;
  /** areas covered by other controls that labels must stay clear of */
  blocked?: Rect[];
  /** areas to keep clear when there is room elsewhere (e.g. the figure itself) */
  avoid?: Rect[];
  /** candidate cells in order of preference (default: CELLS) */
  cells?: ReadonlyArray<readonly [number, number]>;
  /** pull cells that cross the viewport edge back inside instead of skipping them (narrow canvases) */
  clamp?: boolean;
};

/**
 * Cells around the anchor in label units (x: widths, y: heights, negative y =
 * up), cheapest first: straight up, then beside, then below (which would cover
 * the body), then further out.
 */
export const CELLS: ReadonlyArray<readonly [number, number]> = (() => {
  const cells: [number, number][] = [];
  for (let dx = -3; dx <= 3; dx++) for (let dy = -6; dy <= 6; dy++) cells.push([dx, dy]);
  const cost = ([dx, dy]: [number, number]) => Math.abs(dx) * 1.6 + Math.abs(dy) + (dy > 0 ? 1 : 0);
  return cells.sort((a, b) => cost(a) - cost(b) || a[1] - b[1] || a[0] - b[0]);
})();

/**
 * Cells for small markers: spread sideways and upward from the anchor, and only
 * then below it, so a row of markers flanks the labels instead of covering the
 * body under the anchor.
 */
export const MARKER_CELLS: ReadonlyArray<readonly [number, number]> = (() => {
  const cells: [number, number][] = [];
  for (let dx = -6; dx <= 6; dx++) for (let dy = -5; dy <= 3; dy++) cells.push([dx, dy]);
  const cost = ([dx, dy]: [number, number]) => Math.abs(dx) + Math.abs(dy) * 1.2 + (dy > 0 ? 4 : 0);
  return cells.sort((a, b) => cost(a) - cost(b) || a[1] - b[1] || a[0] - b[0]);
})();

export type Layout = {
  /** label centres in screen pixels */
  centers: Point[];
  /** chosen cell index per label (feed back as `previous` next frame) */
  cells: number[];
};

/**
 * Place labels of a common size around their anchors without overlaps.
 * Anchors outside the viewport keep their own position and reserve no space.
 */
export function layoutLabels(anchors: Point[], size: Size, viewport: Size, options: LayoutOptions = {}): Layout {
  const { previous = [], gap = 6, blocked = [], avoid = [], cells: order = CELLS, clamp = false } = options;
  const placed: Point[] = [];
  const centers: Point[] = [];
  const cells: number[] = [];
  const stepX = size.w + gap;
  const stepY = size.h + gap;
  const onScreen = (c: Point) =>
    c.x - size.w / 2 >= gap &&
    c.x + size.w / 2 <= viewport.w - gap &&
    c.y - size.h / 2 >= gap &&
    c.y + size.h / 2 <= viewport.h - gap;
  const outside = (rects: Rect[], c: Point) =>
    rects.every(
      (r) =>
        c.x + size.w / 2 + gap <= r.x ||
        c.x - size.w / 2 - gap >= r.x + r.w ||
        c.y + size.h / 2 + gap <= r.y ||
        c.y - size.h / 2 - gap >= r.y + r.h,
    );
  const free = (c: Point) => placed.every((p) => Math.abs(p.x - c.x) >= stepX || Math.abs(p.y - c.y) >= stepY);
  const at = (a: Point, cell: number): Point => {
    const c = { x: a.x + order[cell][0] * stepX, y: a.y + order[cell][1] * stepY };
    return clamp ? clampToViewport(c, size, viewport, gap) : c;
  };
  const fits = (c: Point, strict: boolean) =>
    onScreen(c) && outside(blocked, c) && free(c) && (!strict || outside(avoid, c));

  anchors.forEach((anchor, i) => {
    if (!onScreen(anchor)) {
      centers.push({ ...anchor });
      cells.push(0);
      return;
    }
    const tries = previous[i] !== undefined && previous[i] > 0 && previous[i] < order.length ? [previous[i]] : [];
    for (let c = 0; c < order.length; c++) tries.push(c);
    // First a cell that also keeps clear of `avoid`, then any free cell.
    const cell = tries.find((c) => fits(at(anchor, c), true)) ?? tries.find((c) => fits(at(anchor, c), false));
    const chosen = cell ?? 0;
    const centre = at(anchor, chosen);
    placed.push(centre);
    centers.push(centre);
    cells.push(chosen);
  });
  return { centers, cells };
}

/**
 * Where a leader line from the anchor meets the edge of a label box centred at
 * `center`, or null when the anchor lies inside the box (no line needed).
 */
export function leaderEnd(anchor: Point, center: Point, size: Size): Point | null {
  const dx = anchor.x - center.x;
  const dy = anchor.y - center.y;
  const reach = Math.max(Math.abs(dx) / (size.w / 2), Math.abs(dy) / (size.h / 2));
  if (reach <= 1) return null;
  return { x: center.x + dx / reach, y: center.y + dy / reach };
}

/**
 * Move a box centre just enough to keep the whole box inside the viewport, so
 * a marker for a keypoint that lies off screen still shows (and can be tapped)
 * at the nearest edge.
 */
export function clampToViewport(p: Point, size: Size, viewport: Size, gap = 6): Point {
  const clamp = (v: number, half: number, max: number) => Math.min(Math.max(v, half + gap), max - half - gap);
  return { x: clamp(p.x, size.w / 2, viewport.w), y: clamp(p.y, size.h / 2, viewport.h) };
}

/**
 * Split a long label into two lines: after "・" or "、", or before "（", at
 * the break nearest the middle, as long as neither line ends up much longer
 * than the other; otherwise in the middle.
 */
export function splitLabel(text: string): [string, string] {
  const chars = [...text];
  const mid = chars.length / 2;
  let best = -1;
  chars.forEach((c, i) => {
    const cut = c === "（" || c === "(" ? i : c === "・" || c === "、" || c === " " ? i + 1 : -1;
    const balanced = Math.max(cut, chars.length - cut) <= chars.length * 0.75;
    if (cut > 0 && cut < chars.length && balanced && (best < 0 || Math.abs(cut - mid) < Math.abs(best - mid))) best = cut;
  });
  const at = best > 0 ? best : Math.ceil(mid);
  return [chars.slice(0, at).join("").trim(), chars.slice(at).join("").trim()];
}

/**
 * Smallest rectangle holding every point, grown by `pad` on each side (e.g. the
 * projected joints of the figure plus its thickness); null without points.
 */
export function boundingRect(points: Point[], pad = 0): Rect | null {
  if (points.length === 0) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

/**
 * True when `count` label cells (plus their spacing) would cover more than
 * `share` of the viewport, i.e. the labels would hide the figure. Small phone
 * canvases cross this for tricks with many keypoints; desktop canvases don't.
 */
export function isCrowded(count: number, size: Size, viewport: Size, share = 0.12, gap = 6): boolean {
  const area = viewport.w * viewport.h;
  if (!(area > 0)) return false;
  return (count * (size.w + gap) * (size.h + gap)) / area > share;
}

/**
 * Keypoint whose label stays expanded in a crowded view: the one nearest the
 * playhead, i.e. the one being played or else the closest pose (the earlier
 * one on a tie); -1 without keypoints.
 */
export function focusKeypoint(times: number[], now: number): number {
  let best = -1;
  times.forEach((t, i) => {
    if (best < 0 || Math.abs(t - now) < Math.abs(times[best] - now)) best = i;
  });
  return best;
}
