/* Camera follow for tricks that travel.
 *
 * The camera presets look at a fixed point above the origin. Tricks that cover
 * ground (cartwheel, raiz, cheat kicks) used to drift to the edge of the view.
 * Instead of chasing the hips frame by frame, the horizontal hips path baked for
 * the trick is smoothed once (zero-lag Gaussian), so the camera glides with the
 * body without echoing every bounce, and the offset is a pure function of the
 * clip time: scrubbing, frame stepping and looping all frame the same way.
 *
 * Tricks whose hips stay near the start keep the exact fixed framing.
 */

/** Hips that never leave this radius (metres) count as staying in place. */
export const IN_PLACE_RADIUS = 0.6;
/** Standard deviation of the smoothing kernel, in seconds of clip time. */
export const SMOOTHING_SECONDS = 0.22;

export type FollowPath = {
  /** false: the trick stays in place and the camera keeps its fixed framing */
  active: boolean;
  duration: number;
  /** smoothed horizontal hips offset from the start, evenly sampled over [0, duration] */
  xs: number[];
  zs: number[];
  /** framing without camera motion (prefers-reduced-motion): middle of the travelled area, from the start */
  center: { x: number; z: number };
  /** distance factor that keeps the whole travelled area in view from `center` */
  zoom: number;
};

export const STILL: FollowPath = { active: false, duration: 0, xs: [0], zs: [0], center: { x: 0, z: 0 }, zoom: 1 };

/**
 * Build the follow path from hips positions sampled evenly over the clip
 * (xyz triplets, first sample at t = 0, last at t = duration).
 */
export function buildFollowPath(points: ArrayLike<number>, duration: number): FollowPath {
  const n = Math.floor(points.length / 3);
  if (n < 2 || !(duration > 0)) return STILL;
  const x0 = points[0];
  const z0 = points[2];
  const xs: number[] = [];
  const zs: number[] = [];
  let reach = 0;
  for (let i = 0; i < n; i++) {
    const x = points[i * 3] - x0;
    const z = points[i * 3 + 2] - z0;
    xs.push(x);
    zs.push(z);
    reach = Math.max(reach, Math.hypot(x, z));
  }
  if (reach <= IN_PLACE_RADIUS) return { ...STILL, duration };

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const halfDiagonal = Math.hypot(maxX - minX, maxZ - minZ) / 2;
  return {
    active: true,
    duration,
    xs: smooth(xs, SMOOTHING_SECONDS / (duration / (n - 1))),
    zs: smooth(zs, SMOOTHING_SECONDS / (duration / (n - 1))),
    center: { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 },
    zoom: Math.min(1.8, 1 + Math.max(0, halfDiagonal - 0.8) * 0.4),
  };
}

/** Horizontal camera offset for clip time t (seconds); zero for tricks that stay in place. */
export function followOffsetAt(path: FollowPath, t: number): { x: number; z: number } {
  if (!path.active) return { x: 0, z: 0 };
  const last = path.xs.length - 1;
  const u = (Math.min(Math.max(t, 0), path.duration) / path.duration) * last;
  const i = Math.min(Math.floor(u), last - 1);
  const f = u - i;
  return {
    x: path.xs[i] + (path.xs[i + 1] - path.xs[i]) * f,
    z: path.zs[i] + (path.zs[i + 1] - path.zs[i]) * f,
  };
}

/** Zero-lag Gaussian smoothing; samples beyond either end hold the end value. */
function smooth(values: number[], sigma: number): number[] {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const weights: number[] = [];
  for (let k = -radius; k <= radius; k++) weights.push(Math.exp(-(k * k) / (2 * sigma * sigma)));
  const last = values.length - 1;
  return values.map((_, i) => {
    let sum = 0;
    let total = 0;
    for (let k = -radius; k <= radius; k++) {
      const w = weights[k + radius];
      sum += w * values[Math.min(Math.max(i + k, 0), last)];
      total += w;
    }
    return sum / total;
  });
}
