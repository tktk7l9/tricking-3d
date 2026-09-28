/** One frame at the 30fps step rate used by the frame buttons. */
export const FRAME = 1 / 30;

/** Margin that keeps a seek to the very end on the last pose instead of looping to 0. */
const END_EPSILON = 1e-3;

/**
 * Clamp a seek target into [0, duration). Keypoints at t = 1.0 (landing) sit
 * exactly on `duration`, which the looping player would wrap to the start pose.
 */
export function clampSeekTime(t: number, duration: number): number {
  if (!(duration > 0)) return 0;
  if (!(t > 0)) return 0;
  return Math.min(t, duration - END_EPSILON);
}

/** Step one frame forward or back, wrapping around the looping clip. */
export function stepTime(t: number, duration: number, direction: 1 | -1): number {
  if (!(duration > 0)) return 0;
  let next = t + direction * FRAME;
  if (next < 0) next += duration;
  if (next >= duration) next -= duration;
  return next;
}
