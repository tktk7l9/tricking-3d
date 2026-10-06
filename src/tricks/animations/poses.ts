import type { Pose } from "../rig";

/* Pose fragments for the semantic rig (see rig.ts for channel meanings).
 * Every trick in this folder is modelled for a left-twisting tricker: spins
 * are counter-clockwise seen from above (heading increases). */

export const legL = (el: number, az = 0, knee = 0, turn = 0, foot = 0): Pose => ({
  "L.el": el,
  "L.az": az,
  "L.knee": knee,
  "L.turn": turn,
  "L.foot": foot,
});
export const legR = (el: number, az = 0, knee = 0, turn = 0, foot = 0): Pose => ({
  "R.el": el,
  "R.az": az,
  "R.knee": knee,
  "R.turn": turn,
  "R.foot": foot,
});
export const armL = (el: number, az = 90, elbow = 10, turn = 0): Pose => ({
  "armL.el": el,
  "armL.az": az,
  "armL.elbow": elbow,
  "armL.turn": turn,
});
export const armR = (el: number, az = -90, elbow = 10, turn = 0): Pose => ({
  "armR.el": el,
  "armR.az": az,
  "armR.elbow": elbow,
  "armR.turn": turn,
});
export const torso = (bend = 0, side = 0, twist = 0): Pose => ({ bend, side, torsoTwist: twist });
export const head = (nod = 0, turn = 0, tilt = 0): Pose => ({ nod, turn, headTilt: tilt });

/** Both arms relaxed by the sides. */
export const armsDown: Pose = { ...armL(10), ...armR(10) };
/** Both arms straight overhead (vertical drive at takeoff). */
export const armsUp: Pose = { ...armL(170, 70), ...armR(170, -70) };
/** T-position. */
export const armsWide: Pose = { ...armL(90, 90), ...armR(90, -90) };
/** Arms hugged across the chest (tight twist / tuck). */
export const armsTight: Pose = { ...armL(70, -20, 120), ...armR(70, 20, 120) };
/** Arms swung back behind the hips (flip load). */
export const armsBack: Pose = { ...armL(45, 170, 10), ...armR(45, -170, 10) };
/** Both legs straight under the body. */
export const legsStraight: Pose = { ...legL(0), ...legR(0) };
/** Knees softened on landing. */
export const legsAbsorb: Pose = { ...legL(25, 0, 40), ...legR(25, 0, 40) };
/** Tight tuck. */
export const legsTuck: Pose = { ...legL(120, 5, 130), ...legR(120, -5, 130) };
