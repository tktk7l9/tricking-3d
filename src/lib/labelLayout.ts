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
  const { previous = [], gap = 6, blocked = [] } = options;
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
  const clear = (c: Point) =>
    blocked.every(
      (r) =>
        c.x + size.w / 2 + gap <= r.x ||
        c.x - size.w / 2 - gap >= r.x + r.w ||
        c.y + size.h / 2 + gap <= r.y ||
        c.y - size.h / 2 - gap >= r.y + r.h,
    );
  const free = (c: Point) => placed.every((p) => Math.abs(p.x - c.x) >= stepX || Math.abs(p.y - c.y) >= stepY);
  const at = (a: Point, cell: number): Point => ({ x: a.x + CELLS[cell][0] * stepX, y: a.y + CELLS[cell][1] * stepY });

  anchors.forEach((anchor, i) => {
    if (!onScreen(anchor)) {
      centers.push({ ...anchor });
      cells.push(0);
      return;
    }
    const order = previous[i] !== undefined && previous[i] > 0 && previous[i] < CELLS.length ? [previous[i]] : [];
    for (let c = 0; c < CELLS.length; c++) order.push(c);
    const cell = order.find((c) => {
      const centre = at(anchor, c);
      return onScreen(centre) && clear(centre) && free(centre);
    });
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
