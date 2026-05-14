import { Builder } from "./authoring";

/* Reusable pose snippets for tricking animations.
 *
 * Coordinate refresher (character at origin facing +Z, T-pose default):
 *   - +X is the character's right (anatomically left in viewer terms)
 *   - +Y is up
 *   - +Z is the character's forward
 *   - leftArm bone in T-pose extends along +X; rightArm extends along -X.
 *     To bring an arm down to the side, rotate it about Z:
 *       leftArm.z = -90  → arm points -Y (down)
 *       rightArm.z = +90 → arm points -Y (down)
 *     To raise an arm overhead:
 *       leftArm.z = +90  → arm points +Y (up)
 *       rightArm.z = -90 → arm points +Y (up)
 *   - leftForeArm extends along its own +X (continuing the arm). Bending the
 *     elbow forward (so the hand swings toward +Z) is done via the forearm's
 *     local Y rotation. Sign is flipped between sides (mirror).
 *
 * The torso is split into spine / spine1 / spine2 to spread bending. Each
 * helper distributes the angle across the three vertebrae for a smoother
 * arc instead of a single hinge.
 *
 * Helpers DO NOT touch bones they don't intend to control, so multiple
 * helpers can be layered at the same `t` (e.g. armsUp + headLookUp + spineExt).
 */

const easeInOut = (u: number) => u * u * (3 - 2 * u);
export const ease = { linear: (u: number) => u, inOut: easeInOut };

/* ============================ Spine ============================ */

/** Distribute a forward (+) or back (-) bend across the 3 spine bones. */
export function spineBend(b: Builder, t: number, deg: number) {
  b.key("spine", t, { eulerDeg: { x: deg * 0.4 } });
  b.key("spine1", t, { eulerDeg: { x: deg * 0.4 } });
  b.key("spine2", t, { eulerDeg: { x: deg * 0.2 } });
}
/** Side bend (Z) — positive leans toward the character's left. */
export function spineSide(b: Builder, t: number, deg: number) {
  b.key("spine", t, { eulerDeg: { z: deg * 0.4 } });
  b.key("spine1", t, { eulerDeg: { z: deg * 0.4 } });
  b.key("spine2", t, { eulerDeg: { z: deg * 0.2 } });
}
/** Twist around vertical axis (Y) — positive twists toward character's left. */
export function spineTwist(b: Builder, t: number, deg: number) {
  b.key("spine", t, { eulerDeg: { y: deg * 0.3 } });
  b.key("spine1", t, { eulerDeg: { y: deg * 0.4 } });
  b.key("spine2", t, { eulerDeg: { y: deg * 0.3 } });
}
/** Reset spine to neutral on all axes. */
export function spineNeutral(b: Builder, t: number) {
  b.key("spine", t, { eulerDeg: { x: 0, y: 0, z: 0 } });
  b.key("spine1", t, { eulerDeg: { x: 0, y: 0, z: 0 } });
  b.key("spine2", t, { eulerDeg: { x: 0, y: 0, z: 0 } });
}

/* ============================ Head / Neck ============================ */

/** Chin to chest (positive deg ≈ looking down). */
export function headDown(b: Builder, t: number, deg = 35) {
  b.key("neck", t, { eulerDeg: { x: deg * 0.55 } });
  b.key("head", t, { eulerDeg: { x: deg * 0.45 } });
}
/** Look up — used at takeoff and to spot a back rotation. */
export function headUp(b: Builder, t: number, deg = 25) {
  b.key("neck", t, { eulerDeg: { x: -deg * 0.5 } });
  b.key("head", t, { eulerDeg: { x: -deg * 0.5 } });
}
/** Turn the head about Y (yaw, e.g. spotting during a twist). */
export function headTurn(b: Builder, t: number, deg: number) {
  b.key("neck", t, { eulerDeg: { y: deg * 0.4 } });
  b.key("head", t, { eulerDeg: { y: deg * 0.6 } });
}
/** Side tilt of the head about Z. */
export function headTilt(b: Builder, t: number, deg: number) {
  b.key("neck", t, { eulerDeg: { z: deg * 0.4 } });
  b.key("head", t, { eulerDeg: { z: deg * 0.6 } });
}
/** Neutral head/neck. */
export function headNeutral(b: Builder, t: number) {
  b.key("neck", t, { eulerDeg: { x: 0, y: 0, z: 0 } });
  b.key("head", t, { eulerDeg: { x: 0, y: 0, z: 0 } });
}

/* ============================ Arms ============================ */

const L = "leftArm" as const;
const R = "rightArm" as const;
const LF = "leftForeArm" as const;
const RF = "rightForeArm" as const;

/** Standing rest: arms at sides, neutral spine/head. */
export function stand(b: Builder, t: number) {
  // Anchor every upper body bone so partial-axis tracks don't extrapolate.
  b.key(L, t, { eulerDeg: { x: 0, y: 0, z: -82 } });
  b.key(R, t, { eulerDeg: { x: 0, y: 0, z: 82 } });
  b.key(LF, t, { eulerDeg: { x: 0, y: -10, z: 0 } });
  b.key(RF, t, { eulerDeg: { x: 0, y: 10, z: 0 } });
  spineNeutral(b, t);
  headNeutral(b, t);
}

/** Arms hauled overhead (used at takeoff for vertical drive). */
export function armsOverhead(b: Builder, t: number) {
  b.key(L, t, { eulerDeg: { x: 0, y: 0, z: 80 } });
  b.key(R, t, { eulerDeg: { x: 0, y: 0, z: -80 } });
  b.key(LF, t, { eulerDeg: { x: 0, y: -5, z: 0 } });
  b.key(RF, t, { eulerDeg: { x: 0, y: 5, z: 0 } });
}

/** Arms swept back behind the body (the load before a flip's takeoff). */
export function armsBack(b: Builder, t: number) {
  b.key(L, t, { eulerDeg: { x: 30, y: 0, z: -110 } });
  b.key(R, t, { eulerDeg: { x: 30, y: 0, z: 110 } });
  b.key(LF, t, { eulerDeg: { x: 0, y: -25, z: 0 } });
  b.key(RF, t, { eulerDeg: { x: 0, y: 25, z: 0 } });
}

/** Arms reaching forward out in front of the body. */
export function armsForward(b: Builder, t: number) {
  b.key(L, t, { eulerDeg: { x: -70, y: 0, z: -82 } });
  b.key(R, t, { eulerDeg: { x: -70, y: 0, z: 82 } });
  b.key(LF, t, { eulerDeg: { x: 0, y: -45, z: 0 } });
  b.key(RF, t, { eulerDeg: { x: 0, y: 45, z: 0 } });
}

/** Arms wide out (T pose, used for the spotting / open-out moment of a flip). */
export function armsWide(b: Builder, t: number) {
  b.key(L, t, { eulerDeg: { x: 0, y: 0, z: -10 } });
  b.key(R, t, { eulerDeg: { x: 0, y: 0, z: 10 } });
  b.key(LF, t, { eulerDeg: { x: 0, y: -5, z: 0 } });
  b.key(RF, t, { eulerDeg: { x: 0, y: 5, z: 0 } });
}

/** Arms squeezed across the chest (used during a tuck or twist). */
export function armsTuck(b: Builder, t: number) {
  b.key(L, t, { eulerDeg: { x: -90, y: 0, z: -55 } });
  b.key(R, t, { eulerDeg: { x: -90, y: 0, z: 55 } });
  b.key(LF, t, { eulerDeg: { x: 0, y: -120, z: 0 } });
  b.key(RF, t, { eulerDeg: { x: 0, y: 120, z: 0 } });
}

/** Hands cross in front (tight twist position — flag squeeze). */
export function armsCross(b: Builder, t: number) {
  b.key(L, t, { eulerDeg: { x: -45, y: 0, z: -25 } });
  b.key(R, t, { eulerDeg: { x: -45, y: 0, z: 25 } });
  b.key(LF, t, { eulerDeg: { x: 0, y: -130, z: 0 } });
  b.key(RF, t, { eulerDeg: { x: 0, y: 130, z: 0 } });
}

/* ============================ Per-arm helpers ============================ */

/** Single-arm: swing arm forward (front of body). Useful as a kick counter-balance. */
export function armForward(b: Builder, side: "left" | "right", t: number) {
  const arm = side === "left" ? L : R;
  const fore = side === "left" ? LF : RF;
  const sign = side === "left" ? 1 : -1;
  b.key(arm, t, { eulerDeg: { x: -85, y: 0, z: -82 * sign } });
  b.key(fore, t, { eulerDeg: { x: 0, y: -50 * sign, z: 0 } });
}

/** Single-arm: swing arm overhead. */
export function armUp(b: Builder, side: "left" | "right", t: number) {
  const arm = side === "left" ? L : R;
  const fore = side === "left" ? LF : RF;
  const sign = side === "left" ? 1 : -1;
  b.key(arm, t, { eulerDeg: { x: 0, y: 0, z: 80 * sign } });
  b.key(fore, t, { eulerDeg: { x: 0, y: -10 * sign, z: 0 } });
}

/** Single-arm: pull arm back (windup). */
export function armBack(b: Builder, side: "left" | "right", t: number) {
  const arm = side === "left" ? L : R;
  const fore = side === "left" ? LF : RF;
  const sign = side === "left" ? 1 : -1;
  b.key(arm, t, { eulerDeg: { x: 50, y: 0, z: -100 * sign } });
  b.key(fore, t, { eulerDeg: { x: 0, y: -30 * sign, z: 0 } });
}

/* ============================ Legs ============================ */

export function legsTuck(b: Builder, t: number) {
  b.key("leftUpLeg", t, { eulerDeg: { x: -120 } });
  b.key("rightUpLeg", t, { eulerDeg: { x: -120 } });
  b.key("leftLeg", t, { eulerDeg: { x: 130 } });
  b.key("rightLeg", t, { eulerDeg: { x: 130 } });
}
export function legsStraight(b: Builder, t: number) {
  b.key("leftUpLeg", t, { eulerDeg: { x: 0 } });
  b.key("rightUpLeg", t, { eulerDeg: { x: 0 } });
  b.key("leftLeg", t, { eulerDeg: { x: 0 } });
  b.key("rightLeg", t, { eulerDeg: { x: 0 } });
}
export function legsAbsorb(b: Builder, t: number) {
  b.key("leftUpLeg", t, { eulerDeg: { x: -25 } });
  b.key("rightUpLeg", t, { eulerDeg: { x: -25 } });
  b.key("leftLeg", t, { eulerDeg: { x: 35 } });
  b.key("rightLeg", t, { eulerDeg: { x: 35 } });
}

/** Crouch / load before a takeoff. */
export function crouch(b: Builder, t: number, depth = 0.18) {
  b.key("hips", t, { pos: { y: 0.95 - depth } });
  b.key("leftUpLeg", t, { eulerDeg: { x: -45 } });
  b.key("rightUpLeg", t, { eulerDeg: { x: -45 } });
  b.key("leftLeg", t, { eulerDeg: { x: 70 } });
  b.key("rightLeg", t, { eulerDeg: { x: 70 } });
  spineBend(b, t, 18);
  headDown(b, t, 12);
}

/** Slight forward lean (run-up / approach). */
export function leanForward(b: Builder, t: number, deg = 12) {
  spineBend(b, t, deg);
  headUp(b, t, 6);
}

/** Reset hips to a full standing pose (position AND rotation). */
export function hipsAtStand(b: Builder, t: number) {
  b.key("hips", t, {
    pos: { x: 0, y: 0.95, z: 0 },
    eulerDeg: { x: 0, y: 0, z: 0 },
  });
}
