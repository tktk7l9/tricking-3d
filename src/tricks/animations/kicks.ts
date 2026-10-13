import type * as THREE from "three";
import { Rig } from "../rig";
import { armL, armR, armsDown, armsUp, armsWide, armsTight, head, legL, legR, legsAbsorb, settle, stepDownBehind, torso } from "./poses";

/* Vertical kicks (left-twisting tricker, spinning counter-clockwise).
 *
 * Leg roles for a counter-clockwise spinner:
 *   inside kick (round)       = right leg
 *   outside kick (hook/crescent) = left leg
 *   cheat takeoff             = right foot, left knee drives
 */

/** Pre-turn for the pops: the right foot lifts straight up (the weight stays
 * on the left foot), the body pivots on the left foot from `from` to `to`
 * degrees, and the right foot comes back down beside it by 0.2, before both
 * feet push off. Turning with both feet down would drag one round the other. */
export function turnOnLeftFoot(r: Rig, from: number, to: number, stanceAz = 8) {
  // Hip and knee together (hip half the knee) lift the foot straight up; it is
  // then carried over the spot it lands on and lowered onto it.
  r.at(0.04, { heading: from, ...legL(0, stanceAz), ...legR(20, -stanceAz, 40, 0, -20) });
  r.at(0.14, { heading: to, ...legR(50, -stanceAz, 80, 0, -30) });
}

/** The cheat step shared by the cheat kicks and the outside tricks: pivot on
 * the left foot while the right foot lifts straight up and steps round, stops
 * over the spot it lands on and is lowered onto it; both feet hold still for a
 * moment, then the left foot lifts straight up. The heading and the standing
 * leg do not move while a foot is near the floor. The right foot stays pinned
 * until `rightUntil`. */
export function cheatStep(r: Rig, rightUntil: number) {
  const stand = { ...legL(15, 5, 0, 0, 15), ...legR(-15, -5, 0, 0, -15) };
  r.start({ ...armsDown, ...stand });
  r.pin("L", 0, 0.14);
  r.at(0.035, { heading: 0, ...stand, ...legR(1, -5, 34, 0, -33) });
  r.at(0.06, { heading: 14, ...legR(15, -10, 65, 0, -45) });
  r.at(0.09, { heading: 30, ...legR(15, -12, 65, 0, -40) });
  const pushL = legL(-10, 5, 15, 0, -25);
  const overR = legR(38.5, -12, 42, 0, -4);
  const downR = legR(26, -12, 19.5, 0, 6.5);
  r.at(0.13, { heading: 66, ...pushL, ...overR });
  r.at(0.135, { heading: 66, ...pushL, ...overR });
  r.at(0.14, { ...armL(40, 40, 20), ...armR(35, -150, 20), ...torso(8, 0, 20), ...head(0, 40) });
  r.pin("R", 0.14, rightUntil);
  r.at(0.16, { heading: 66, ...pushL, ...downR });
  r.at(0.18, { heading: 66, ...pushL, ...downR });
  const liftL = legL(0, 5, 36.7, 0, -36.7);
  r.at(0.2, { heading: 66, ...liftL, ...downR });
  r.at(0.205, { heading: 66, ...liftL, ...downR });
  r.at(0.225, { heading: 70, ...legL(35, 10, 75, 0, -40) });
  r.at(0.25, { heading: 125 });
}

/** Cheat setup shared by Tornado / 540 / Cheat 720: pivot on the left foot
 * while the right foot steps around to backside, then the left knee drives
 * and the right foot pushes off at `uOff`. Returns the heading at takeoff. */
function cheatSetup(r: Rig, uOff: number, driveLeg: "knee" | "swing"): number {
  cheatStep(r, uOff);
  r.at(0.25, { heading: 125, ...legR(35, -5, 45) });
  r.at(0.28, {
    heading: 165,
    ...legR(35, 0, 55, 0, 0),
    ...legL(45, 10, 85, 0, -40),
    ...armL(55, 110, 30),
    ...armR(50, -40, 30),
    ...torso(18, 0, 25),
    ...head(5, 50),
  });
  const takeoffHeading = driveLeg === "knee" ? 230 : 205;
  r.at(uOff, {
    heading: takeoffHeading,
    ...(driveLeg === "knee" ? legL(100, 25, 95) : legL(85, 30, 35)),
    ...legR(0, 0, 5, 0, 35),
    ...armL(130, 60, 20),
    ...armR(110, -70, 20),
    ...torso(-5, 0, 30),
    ...head(-5, 50),
  });
  return takeoffHeading;
}

/** Tornado kick: cheat takeoff, right-leg round kick, land on the left foot. */
export function buildTornado(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  cheatSetup(r, 0.4, "knee");
  r.flight(0.4, 0.8, { travel: [0.05, 0.25] });
  r.at(0.5, {
    heading: 300,
    ...legL(95, 30, 110),
    ...legR(60, -70, 125, 70),
    ...armL(90, 90, 40),
    ...armR(80, -60, 60),
    ...torso(5, 10, 10),
    ...head(0, 40),
  });
  r.at(0.62, {
    heading: 380,
    ...legL(70, 30, 110),
    ...legR(112, 5, 5, 70),
    ...armL(40, 130, 30),
    ...armR(60, -20, 70),
    ...torso(0, 15, -10),
    ...head(0, 0),
  });
  r.at(0.72, {
    heading: 405,
    ...legL(45, 15, 60),
    ...legR(60, -20, 70, 30),
    ...armL(40, 110, 30),
    ...armR(45, -60, 40),
    ...torso(5, 0, 0),
  });
  r.at(0.8, {
    heading: 420,
    ...legL(20, 5, 30),
    ...legR(50, -20, 80),
    ...armsWide,
    ...torso(8, 0, 0),
  });
  r.pin("L", 0.8, 1);
  settle(r, "R", 0.86, 0.92, { heading: 430 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("cheat-kick");
}

/** 540 kick: a Tornado that keeps turning and lands on the kicking (right) leg. */
export function build540(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  cheatSetup(r, 0.4, "knee");
  r.flight(0.4, 0.8, { travel: [0.05, 0.2] });
  r.at(0.5, {
    heading: 310,
    ...legL(95, 30, 115),
    ...legR(60, -70, 125, 70),
    ...armL(90, 90, 40),
    ...armR(80, -60, 60),
    ...torso(5, 10, 10),
    ...head(0, 40),
  });
  r.at(0.6, {
    heading: 385,
    ...legL(75, 35, 120),
    ...legR(112, 5, 5, 70),
    ...armL(40, 130, 30),
    ...armR(60, -20, 70),
    ...torso(0, 15, -10),
    ...head(0, 0),
  });
  r.at(0.7, {
    heading: 455,
    ...legL(60, 60, 110),
    ...legR(55, -10, 60, 20),
    ...armsTight,
    ...torso(5, 5, 0),
    ...head(0, 30),
  });
  r.at(0.8, {
    heading: 510,
    ...legL(45, 70, 100),
    ...legR(20, 0, 30, 0),
    ...armL(60, 60, 30),
    ...armR(60, -60, 30),
    ...torso(10, 0, 0),
  });
  r.pin("R", 0.8, 1);
  r.at(0.88, { heading: 540, ...legR(15, 0, 30), ...legL(15, 20, 75, 0, -30) });
  stepDownBehind(r, 0.92, 0.96, { heading: 540 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("540-kick");
}

/** Cheat 720: cheat takeoff, 360° in the air, left-leg hook kick, land on the right foot. */
export function buildCheat720(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  cheatSetup(r, 0.4, "swing");
  r.flight(0.4, 0.82, { travel: [0.05, 0.2] });
  r.at(0.5, {
    heading: 320,
    ...legL(60, 30, 110),
    ...legR(35, -10, 90),
    ...armsTight,
    ...torso(5, 0, 10),
    ...head(0, 40),
  });
  r.at(0.62, {
    heading: 480,
    ...legL(70, 60, 70),
    ...legR(25, -10, 75),
    ...armL(70, 20, 90),
    ...armR(70, -40, 90),
    ...torso(0, 10, 10),
    ...head(0, 40),
  });
  r.at(0.72, {
    heading: 625,
    ...legL(118, 95, 10, 0, 20),
    ...legR(20, -10, 60),
    ...armL(35, 150, 20),
    ...armR(80, -30, 60),
    ...torso(0, 25, 0),
    ...head(0, 20),
  });
  r.at(0.82, {
    heading: 695,
    ...legL(50, 70, 80),
    ...legR(20, 0, 30),
    ...armL(60, 90, 30),
    ...armR(60, -90, 30),
    ...torso(8, 10, 0),
    ...head(0, 0),
  });
  r.pin("R", 0.82, 1);
  r.at(0.88, { heading: 720, ...legR(15, 0, 30), ...legL(15, 20, 75, 0, -30) });
  stepDownBehind(r, 0.92, 0.96, { heading: 720 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("cheat-720");
}

/** Cheat 900: cheat takeoff, ~540° in the air, and the right (takeoff) leg
 * comes round again for a round kick; lands on the left foot. */
export function buildCheat900(): THREE.AnimationClip {
  const D = 1.9;
  const r = new Rig(D);
  cheatSetup(r, 0.4, "knee");
  r.flight(0.4, 0.84, { travel: [0.05, 0.2], apex: 0.5 });
  r.at(0.5, {
    heading: 340,
    ...legL(90, 30, 115),
    ...legR(60, -60, 125, 60),
    ...armsTight,
    ...torso(5, 5, 10),
    ...head(0, 40),
  });
  r.at(0.6, {
    heading: 490,
    ...legL(80, 35, 120),
    ...legR(65, -60, 125, 70),
    ...armsTight,
    ...torso(5, 5, 10),
    ...head(0, 40),
  });
  r.at(0.68, {
    heading: 610,
    ...legL(75, 35, 115),
    ...legR(75, -60, 120, 70),
    ...armL(80, 90, 50),
    ...armR(80, -60, 60),
    ...torso(5, 10, 5),
    ...head(0, 30),
  });
  r.at(0.74, {
    heading: 715,
    ...legL(70, 30, 110),
    ...legR(112, 5, 5, 70),
    ...armL(40, 130, 30),
    ...armR(60, -20, 70),
    ...torso(0, 15, -10),
    ...head(0, 0),
  });
  r.at(0.84, {
    heading: 790,
    ...legL(20, 5, 30),
    ...legR(50, -20, 80),
    ...armsWide,
    ...torso(8, 0, 0),
  });
  r.pin("L", 0.84, 1);
  settle(r, "R", 0.9, 0.96, { heading: 800 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("cheat-900");
}

/** Backside pop shared by the Backside 720 / 900: stand with the back to the
 * target (heading 180), wind the torso to the right, pre-turn a little on the
 * ground and pop off both feet at `uOff`. */
function backsidePop(r: Rig, uOff: number) {
  r.start({ ...armsDown, heading: 180, ...legL(0, 10), ...legR(0, -10), ...head(0, 30) });
  r.pin("L", 0, uOff);
  turnOnLeftFoot(r, 180, 230, 10);
  r.at(0.2, {
    heading: 230,
    ...legL(35, 10, 50),
    ...legR(35, -10, 50),
    ...armL(45, 10, 20),
    ...armR(55, -140, 20),
    ...torso(15, 0, -30),
    ...head(5, 20),
  });
  r.at(uOff, {
    heading: 234,
    ...legL(0, 10, 5, 0, 35),
    ...legR(0, -10, 5, 0, 35),
    ...armL(150, 90, 15),
    ...armR(120, -30, 25),
    ...torso(-5, 0, 35),
    ...head(-5, 45),
  });
}

/** Backside 900 Sidekick: the backside 900's turns in the air, finished with a
 * right-leg side kick (chambered to the side, then driven out sideways at the
 * target) instead of the round kick, landing on the left foot. */
export function buildBackside900Sidekick(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  backsidePop(r, 0.38);
  r.flight(0.38, 0.82, { travel: [0.05, 0.1], apex: 0.5 });
  r.at(0.48, { heading: 380, ...legL(60, 30, 110), ...legR(55, -40, 120, 50), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.58, { heading: 580, ...legL(70, 35, 115), ...legR(85, -40, 130), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.65, { heading: 750, ...legL(75, 30, 115), ...legR(90, -80, 125), ...armL(60, 60, 60), ...armR(60, -40, 80), ...torso(0, 10, 0), ...head(0, -50) });
  r.at(0.72, { heading: 810, ...legL(60, 20, 100), ...legR(102, -90, 0, 0, 30), ...armL(40, 120, 30), ...armR(50, -110, 40), ...torso(0, 30, 0), ...head(0, -80) });
  r.at(0.78, { heading: 825, ...legL(30, 10, 50), ...legR(60, -70, 100), ...armsWide, ...torso(5, 10, 0), ...head(0, -40) });
  r.at(0.82, { heading: 830, ...legL(20, 5, 30), ...legR(45, -40, 80), ...armsWide, ...torso(8, 0, 0), ...head(0, -20) });
  r.pin("L", 0.82, 1);
  settle(r, "R", 0.88, 0.94, { heading: 840 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("backside-900-sidekick");
}

/** Backside 720: pop from backside and spin ~360° in the air (Pop 360 Hook in
 * TKT), so the left-leg hook reaches the target with the same rotation as the
 * Cheat 720 (heading ~625 with the leg out to the left side); lands on the
 * right foot facing the target again (720 in total). */
export function buildBackside720(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  backsidePop(r, 0.38);
  r.flight(0.38, 0.8, { travel: [0.05, 0.15], apex: 0.5 });
  r.at(0.48, {
    heading: 345,
    ...legL(60, 30, 110),
    ...legR(40, -10, 90),
    ...armsTight,
    ...torso(5, 0, 10),
    ...head(0, 40),
  });
  r.at(0.59, {
    heading: 490,
    ...legL(70, 60, 70),
    ...legR(30, -10, 75),
    ...armL(70, 20, 90),
    ...armR(70, -40, 90),
    ...torso(0, 10, 10),
    ...head(0, 40),
  });
  r.at(0.68, {
    heading: 625,
    ...legL(118, 95, 10, 0, 20),
    ...legR(25, -10, 60),
    ...armL(35, 150, 20),
    ...armR(80, -30, 60),
    ...torso(0, 25, 0),
    ...head(0, 20),
  });
  r.at(0.8, {
    heading: 695,
    ...legL(50, 70, 80),
    ...legR(20, 0, 30),
    ...armL(60, 90, 30),
    ...armR(60, -90, 30),
    ...torso(8, 10, 0),
    ...head(0, 0),
  });
  r.pin("R", 0.8, 1);
  r.at(0.88, { heading: 720, ...legR(15, 0, 30), ...legL(15, 20, 75, 0, -30) });
  stepDownBehind(r, 0.92, 0.96, { heading: 720 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("backside-720");
}

/** Backside 900: pop from backside, ~540° in the air, right-leg round kick at
 * the target, land on the left foot (Pop 540 Round in TKT). */
export function buildBackside900(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  backsidePop(r, 0.38);
  r.flight(0.38, 0.82, { travel: [0.05, 0.1], apex: 0.5 });
  r.at(0.48, {
    heading: 350,
    ...legL(60, 30, 110),
    ...legR(55, -40, 120, 50),
    ...armsTight,
    ...torso(5, 5, 10),
    ...head(0, 40),
  });
  r.at(0.58, {
    heading: 500,
    ...legL(70, 35, 115),
    ...legR(60, -50, 125, 60),
    ...armsTight,
    ...torso(5, 5, 10),
    ...head(0, 40),
  });
  r.at(0.66, {
    heading: 620,
    ...legL(75, 35, 115),
    ...legR(70, -60, 120, 70),
    ...armL(80, 90, 50),
    ...armR(80, -60, 60),
    ...torso(5, 10, 5),
    ...head(0, 30),
  });
  r.at(0.72, {
    heading: 715,
    ...legL(70, 30, 110),
    ...legR(112, 5, 5, 70),
    ...armL(40, 130, 30),
    ...armR(60, -20, 70),
    ...torso(0, 15, -10),
    ...head(0, 0),
  });
  r.at(0.82, {
    heading: 790,
    ...legL(20, 5, 30),
    ...legR(50, -20, 80),
    ...armsWide,
    ...torso(8, 0, 0),
  });
  r.pin("L", 0.82, 1);
  // The right foot is brought over its spot, then lowered straight onto it.
  r.at(0.88, { heading: 800, ...legR(45, 0, 75, 0, -30) });
  r.at(0.93, { heading: 800, ...legsAbsorb });
  r.at(1, { heading: 800, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("backside-900");
}

/** Backside 900 Hyper (TKT: Pop 540 Katana): the Backside 900's pop and
 * round kick, then it keeps turning and lands on the kicking (right) foot in
 * hyper, as the 540 does after a Tornado. */
export function buildBackside900Hyper(): THREE.AnimationClip {
  const D = 1.9;
  const r = new Rig(D);
  backsidePop(r, 0.38);
  r.flight(0.38, 0.84, { travel: [0.05, 0.1], apex: 0.5 });
  r.at(0.48, { heading: 350, ...legL(60, 30, 110), ...legR(55, -40, 120, 50), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.58, { heading: 500, ...legL(70, 35, 115), ...legR(60, -50, 125, 60), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.66, {
    heading: 620,
    ...legL(75, 35, 115),
    ...legR(70, -60, 120, 70),
    ...armL(80, 90, 50),
    ...armR(80, -60, 60),
    ...torso(5, 10, 5),
    ...head(0, 30),
  });
  r.at(0.72, {
    heading: 715,
    ...legL(70, 30, 110),
    ...legR(112, 5, 5, 70),
    ...armL(40, 130, 30),
    ...armR(60, -20, 70),
    ...torso(0, 15, -10),
    ...head(0, 0),
  });
  r.at(0.78, { heading: 775, ...legL(60, 60, 110), ...legR(55, -10, 60, 20), ...armsTight, ...torso(5, 5, 0), ...head(0, 30) });
  r.at(0.84, { heading: 820, ...legL(45, 70, 100), ...legR(20, 0, 30), ...armL(60, 60, 30), ...armR(60, -60, 30), ...torso(10, 0, 0) });
  r.pin("R", 0.84, 1);
  r.at(0.88, { heading: 845, ...legR(15, 0, 30), ...legL(15, 20, 75, 0, -30) });
  stepDownBehind(r, 0.92, 0.96, { heading: 845 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("backside-900-hyper");
}

/** Pop 360: two-foot takeoff from frontside, 180° in the air, left-leg outside
 * crescent at the target, land on both feet (turbo). */
export function buildPop360(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.38);
  turnOnLeftFoot(r, 0, 85);
  r.at(0.2, {
    heading: 85,
    ...legL(35, 8, 50),
    ...legR(35, -8, 50),
    ...armL(45, 10, 20),
    ...armR(55, -140, 20),
    ...torso(15, 0, -30),
    ...head(5, -20),
  });
  r.at(0.38, {
    heading: 88,
    ...legL(0, 8, 5, 0, 35),
    ...legR(0, -8, 5, 0, 35),
    ...armL(150, 90, 15),
    ...armR(120, -30, 25),
    ...torso(-5, 0, 35),
    ...head(-5, 45),
  });
  r.flight(0.38, 0.8, { travel: [0.08, 0.05] });
  r.at(0.5, {
    heading: 185,
    ...legL(30, -10, 40),
    ...legR(45, -10, 70),
    ...armL(80, 30, 80),
    ...armR(80, -30, 80),
    ...torso(5, 0, 20),
    ...head(0, 40),
  });
  r.at(0.6, {
    heading: 250,
    ...legL(95, -40, 10),
    ...legR(40, -10, 80),
    ...armL(60, 60, 40),
    ...armR(70, -60, 40),
    ...torso(5, 0, 10),
    ...head(0, 30),
  });
  r.at(0.68, {
    heading: 300,
    ...legL(115, 60, 10),
    ...legR(35, -10, 70),
    ...armL(40, 140, 30),
    ...armR(70, -20, 60),
    ...torso(5, 15, 0),
    ...head(0, 10),
  });
  r.at(0.8, {
    heading: 360,
    ...legL(25, 10, 35),
    ...legR(25, -10, 35),
    ...armsWide,
    ...torso(10, 0, 0),
    ...head(5, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(1, { heading: 360, ...legL(25, 10, 40), ...legR(25, -10, 40), ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("pop-kick");
}

/** Frontside pop shared by the Pop Tornado / Pop 540: face the target, wind the
 * torso to the right, pre-turn to frontside on the ground and pop off both
 * feet at `uOff` (same wind-up as the Pop 360). */
function frontsidePop(r: Rig, uOff: number) {
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, uOff);
  turnOnLeftFoot(r, 0, 90);
  r.at(0.2, {
    heading: 90,
    ...legL(35, 8, 50),
    ...legR(35, -8, 50),
    ...armL(45, 10, 20),
    ...armR(55, -140, 20),
    ...torso(15, 0, -30),
    ...head(5, -20),
  });
  r.at(uOff, {
    heading: 93,
    ...legL(0, 8, 5, 0, 35),
    ...legR(0, -8, 5, 0, 35),
    ...armL(150, 90, 15),
    ...armR(120, -30, 25),
    ...torso(-5, 0, 35),
    ...head(-5, 45),
  });
}

/** Pop Tornado: frontside pop off both feet, the left knee drives while the
 * body turns, right-leg round kick at the target, land on the left foot. */
export function buildPopTornado(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  frontsidePop(r, 0.38);
  r.flight(0.38, 0.8, { travel: [0.05, 0.15], apex: 0.45 });
  r.at(0.5, {
    heading: 255,
    ...legL(95, 30, 110),
    ...legR(60, -70, 125, 70),
    ...armL(90, 90, 40),
    ...armR(80, -60, 60),
    ...torso(5, 10, 10),
    ...head(0, 40),
  });
  r.at(0.62, {
    heading: 375,
    ...legL(70, 30, 110),
    ...legR(112, 5, 5, 70),
    ...armL(40, 130, 30),
    ...armR(60, -20, 70),
    ...torso(0, 15, -10),
    ...head(0, 0),
  });
  r.at(0.72, {
    heading: 405,
    ...legL(45, 15, 60),
    ...legR(60, -20, 70, 30),
    ...armL(40, 110, 30),
    ...armR(45, -60, 40),
    ...torso(5, 0, 0),
  });
  r.at(0.8, {
    heading: 420,
    ...legL(20, 5, 30),
    ...legR(50, -20, 80),
    ...armsWide,
    ...torso(8, 0, 0),
  });
  r.pin("L", 0.8, 1);
  settle(r, "R", 0.86, 0.92, { heading: 430 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("pop-tornado");
}

/** Pop 540: a Pop Tornado that keeps turning and lands on the kicking (right)
 * leg in hyper, like the 540 after a Tornado. */
export function buildPop540(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  frontsidePop(r, 0.38);
  r.flight(0.38, 0.8, { travel: [0.05, 0.12], apex: 0.45 });
  r.at(0.5, {
    heading: 265,
    ...legL(95, 30, 115),
    ...legR(60, -70, 125, 70),
    ...armL(90, 90, 40),
    ...armR(80, -60, 60),
    ...torso(5, 10, 10),
    ...head(0, 40),
  });
  r.at(0.6, {
    heading: 385,
    ...legL(75, 35, 120),
    ...legR(112, 5, 5, 70),
    ...armL(40, 130, 30),
    ...armR(60, -20, 70),
    ...torso(0, 15, -10),
    ...head(0, 0),
  });
  r.at(0.7, {
    heading: 455,
    ...legL(60, 60, 110),
    ...legR(55, -10, 60, 20),
    ...armsTight,
    ...torso(5, 5, 0),
    ...head(0, 30),
  });
  r.at(0.8, {
    heading: 510,
    ...legL(45, 70, 100),
    ...legR(20, 0, 30, 0),
    ...armL(60, 60, 30),
    ...armR(60, -60, 30),
    ...torso(10, 0, 0),
  });
  r.pin("R", 0.8, 1);
  r.at(0.88, { heading: 540, ...legR(15, 0, 30), ...legL(15, 20, 75, 0, -30) });
  stepDownBehind(r, 0.92, 0.96, { heading: 540 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("pop-540");
}

/** Pop 720 (TKT: Pop 540 Hook): the frontside pop of the Pop Tornado, about
 * 540° in the air with the body tight, then the left leg hooks at the target
 * and the right foot lands (the kicking leg comes down last). */
export function buildPop720(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  frontsidePop(r, 0.36);
  r.flight(0.36, 0.82, { travel: [0.05, 0.12], apex: 0.5 });
  r.at(0.46, {
    heading: 260,
    ...legL(60, 30, 110),
    ...legR(35, -10, 90),
    ...armsTight,
    ...torso(5, 0, 10),
    ...head(0, 40),
  });
  r.at(0.58, {
    heading: 445,
    ...legL(70, 60, 70),
    ...legR(25, -10, 75),
    ...armL(70, 20, 90),
    ...armR(70, -40, 90),
    ...torso(0, 10, 10),
    ...head(0, 40),
  });
  r.at(0.7, {
    heading: 625,
    ...legL(118, 95, 10, 0, 20),
    ...legR(20, -10, 60),
    ...armL(35, 150, 20),
    ...armR(80, -30, 60),
    ...torso(0, 25, 0),
    ...head(0, 20),
  });
  r.at(0.82, {
    heading: 695,
    ...legL(50, 70, 80),
    ...legR(20, 0, 30),
    ...armL(60, 90, 30),
    ...armR(60, -90, 30),
    ...torso(8, 10, 0),
    ...head(0, 0),
  });
  r.pin("R", 0.82, 1);
  r.at(0.88, { heading: 720, ...legR(15, 0, 30), ...legL(15, 20, 75, 0, -30) });
  stepDownBehind(r, 0.92, 0.96, { heading: 720 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("pop-720");
}

/** Tornado Sidekick (TKT: Cheat 360 Sidekick): the Tornado's cheat takeoff,
 * but the right knee chambers to the chest and the leg drives out heel first
 * as a side kick, the right side of the body toward the target; land on the
 * left foot. */
/** Cheat 900 Sidekick: the cheat 900's two turns in the air, finished with a
 * right-leg side kick (chambered to the side, then driven out sideways at the
 * target) instead of the round kick, landing on the left foot. */
export function buildCheat900Sidekick(): THREE.AnimationClip {
  const D = 1.9;
  const r = new Rig(D);
  cheatSetup(r, 0.4, "knee");
  r.flight(0.4, 0.84, { travel: [0.05, 0.2], apex: 0.5 });
  r.at(0.5, { heading: 380, ...legL(90, 30, 115), ...legR(60, -60, 125, 60), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.6, { heading: 590, ...legL(80, 35, 120), ...legR(85, -40, 130), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.67, { heading: 760, ...legL(75, 30, 115), ...legR(90, -80, 125), ...armL(60, 60, 60), ...armR(60, -40, 80), ...torso(0, 10, 0), ...head(0, -50) });
  r.at(0.74, { heading: 810, ...legL(60, 20, 100), ...legR(95, -90, 0, 0, 30), ...armL(40, 120, 30), ...armR(50, -110, 40), ...torso(0, 30, 0), ...head(0, -80) });
  r.at(0.8, { heading: 825, ...legL(30, 10, 50), ...legR(60, -70, 100), ...armsWide, ...torso(5, 10, 0), ...head(0, -40) });
  r.at(0.84, { heading: 830, ...legL(20, 5, 30), ...legR(45, -40, 80), ...armsWide, ...torso(8, 0, 0), ...head(0, -20) });
  r.pin("L", 0.84, 1);
  settle(r, "R", 0.9, 0.96, { heading: 840 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("cheat-900-sidekick");
}

/** Tornado Double: the tornado with two right-leg round kicks before the left
 * foot lands; the leg re-chambers between them. */
export function buildTornadoDouble(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  cheatSetup(r, 0.4, "knee");
  r.flight(0.4, 0.82, { travel: [0.05, 0.25] });
  r.at(0.48, { heading: 290, ...legL(95, 30, 110), ...legR(60, -70, 125, 70), ...armL(90, 90, 40), ...armR(80, -60, 60), ...torso(5, 10, 10), ...head(0, 40) });
  r.at(0.55, { heading: 335, ...legL(75, 30, 110), ...legR(112, 5, 5, 70), ...armL(40, 130, 30), ...armR(60, -20, 70), ...torso(0, 15, -10), ...head(0, 10) });
  r.at(0.61, { heading: 360, ...legL(70, 30, 110), ...legR(70, -60, 120, 70), ...armL(70, 100, 40), ...armR(70, -50, 60), ...torso(5, 10, 0), ...head(0, 5) });
  r.at(0.68, { heading: 395, ...legL(65, 25, 100), ...legR(112, 5, 5, 70), ...armL(40, 130, 30), ...armR(60, -20, 70), ...torso(0, 15, -10), ...head(0, 0) });
  r.at(0.75, { heading: 415, ...legL(45, 15, 60), ...legR(60, -20, 70, 30), ...armL(40, 110, 30), ...armR(45, -60, 40), ...torso(5, 0, 0) });
  r.at(0.82, { heading: 425, ...legL(20, 5, 30), ...legR(50, -20, 80), ...armsWide, ...torso(8, 0, 0) });
  r.pin("L", 0.82, 1);
  settle(r, "R", 0.88, 0.94, { heading: 435 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("tornado-double");
}

/** Cheat Feilong: a tornado whose left leg, instead of driving the knee up,
 * swings up straight and sweeps across like a crescent kick, before the right
 * leg's round kick; the left foot lands. */
export function buildCheatFeilong(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  cheatSetup(r, 0.4, "swing");
  r.flight(0.4, 0.8, { travel: [0.05, 0.25] });
  // The crescent: the straight left leg arcs from the right across to the left.
  r.at(0.45, { heading: 250, ...legL(100, -15, 5), ...legR(35, -20, 60), ...armL(110, 70, 30), ...armR(90, -70, 40), ...torso(0, 5, 20), ...head(0, 40) });
  r.at(0.51, { heading: 295, ...legL(95, 55, 10), ...legR(60, -70, 125, 70), ...armL(90, 110, 40), ...armR(80, -60, 60), ...torso(5, 10, 10), ...head(0, 30) });
  r.at(0.62, { heading: 380, ...legL(60, 30, 100), ...legR(112, 5, 5, 70), ...armL(40, 130, 30), ...armR(60, -20, 70), ...torso(0, 15, -10), ...head(0, 0) });
  r.at(0.72, { heading: 405, ...legL(45, 15, 60), ...legR(60, -20, 70, 30), ...armL(40, 110, 30), ...armR(45, -60, 40), ...torso(5, 0, 0) });
  r.at(0.8, { heading: 420, ...legL(20, 5, 30), ...legR(50, -20, 80), ...armsWide, ...torso(8, 0, 0) });
  r.pin("L", 0.8, 1);
  settle(r, "R", 0.86, 0.92, { heading: 430 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("cheat-feilong");
}

/** Cheat 900 Hyper: the cheat 900 landing on the kicking (right) leg (hyper),
 * the left leg held up and set down after. */
export function buildCheat900Hyper(): THREE.AnimationClip {
  const D = 1.9;
  const r = new Rig(D);
  cheatSetup(r, 0.4, "knee");
  r.flight(0.4, 0.84, { travel: [0.05, 0.2], apex: 0.5 });
  r.at(0.5, { heading: 340, ...legL(90, 30, 115), ...legR(60, -60, 125, 60), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.6, { heading: 490, ...legL(80, 35, 120), ...legR(65, -60, 125, 70), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.68, { heading: 610, ...legL(75, 35, 115), ...legR(75, -60, 120, 70), ...armL(80, 90, 50), ...armR(80, -60, 60), ...torso(5, 10, 5), ...head(0, 30) });
  r.at(0.74, { heading: 715, ...legL(70, 30, 110), ...legR(112, 5, 5, 70), ...armL(40, 130, 30), ...armR(60, -20, 70), ...torso(0, 15, -10), ...head(0, 0) });
  // The kicking leg comes straight down to land while the left stays up.
  r.at(0.79, { heading: 770, ...legL(60, 60, 110), ...legR(55, -10, 60, 20), ...armsTight, ...torso(5, 5, 0), ...head(0, 30) });
  r.at(0.84, { heading: 810, ...legL(45, 70, 100), ...legR(20, 0, 30), ...armL(60, 60, 30), ...armR(60, -60, 30), ...torso(10, 0, 0) });
  r.pin("R", 0.84, 1);
  r.at(0.89, { heading: 835, ...legR(15, 0, 30), ...legL(15, 20, 75, 0, -30) });
  stepDownBehind(r, 0.92, 0.96, { heading: 835 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("cheat-900-hyper");
}

/** Swing 1080: the swing 900's swing entry, about two turns in the air, then a
 * left-leg outside (hook) kick at the target; the right foot lands first. */
export function buildSwing1080(): THREE.AnimationClip {
  const D = 2.0;
  const r = new Rig(D);
  // Standing on the left foot with the right foot just off the floor behind;
  // its knee folds as it swings through under the body.
  r.start({ ...armsDown, ...legL(0, 5), ...legR(-25, -10, 45, 0, -20), ...torso(5, 0, -10) });
  r.at(0.09, { ...legR(5, 5, 85, 0, -40) });
  r.pin("L", 0, 0.4);
  r.at(0.18, { heading: 40, ...legR(45, 15, 25), ...legL(10, 5, 30), ...armL(40, 150, 20), ...armR(50, -30, 30), ...torso(5, 0, 10), ...head(0, 20) });
  r.at(0.3, { heading: 130, ...legR(85, 40, 30), ...legL(20, 5, 45), ...armL(90, 60, 30), ...armR(80, -110, 30), ...torso(8, 0, 25), ...head(0, 40) });
  r.at(0.4, { heading: 230, ...legR(95, 45, 60), ...legL(0, 5, 5, 0, 35), ...armsUp, ...torso(-5, 0, 30), ...head(-5, 45) });
  r.flight(0.4, 0.86, { travel: [0.05, 0.2], apex: 0.55 });
  r.at(0.48, { heading: 360, ...legL(90, 30, 115), ...legR(60, -60, 125, 60), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.57, { heading: 560, ...legL(80, 35, 120), ...legR(55, -40, 120, 40), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  r.at(0.66, { heading: 760, ...legL(75, 45, 110), ...legR(35, -10, 90), ...armsTight, ...torso(5, 5, 10), ...head(0, 40) });
  // Chamber the left leg out to the side, then the hook.
  r.at(0.72, { heading: 900, ...legL(70, 60, 70), ...legR(25, -10, 75), ...armL(70, 20, 90), ...armR(70, -40, 90), ...torso(0, 10, 10), ...head(0, 40) });
  r.at(0.78, { heading: 985, ...legL(118, 95, 10, 0, 20), ...legR(20, -10, 60), ...armL(35, 150, 20), ...armR(80, -30, 60), ...torso(0, 25, 0), ...head(0, 20) });
  r.at(0.86, { heading: 1050, ...legL(50, 70, 80), ...legR(20, 0, 30), ...armL(60, 90, 30), ...armR(60, -90, 30), ...torso(8, 10, 0), ...head(0, 0) });
  r.pin("R", 0.86, 1);
  r.at(0.91, { heading: 1075, ...legR(15, 0, 30), ...legL(15, 20, 75, 0, -30) });
  stepDownBehind(r, 0.935, 0.97, { heading: 1075 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("swing-1080");
}

export function buildTornadoSidekick(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  cheatSetup(r, 0.4, "knee");
  r.flight(0.4, 0.8, { travel: [0.05, 0.25], apex: 0.5 });
  r.at(0.5, {
    heading: 320,
    ...legL(95, 30, 110),
    ...legR(85, -40, 130),
    ...armsTight,
    ...torso(5, 0, 10),
    ...head(0, 40),
  });
  r.at(0.6, {
    heading: 410,
    ...legL(80, 30, 115),
    ...legR(90, -80, 125),
    ...armL(60, 60, 60),
    ...armR(60, -40, 80),
    ...torso(0, 10, 0),
    ...head(0, -50),
  });
  r.at(0.68, {
    heading: 450,
    ...legL(60, 20, 100),
    ...legR(95, -90, 0, 0, 30),
    ...armL(40, 120, 30),
    ...armR(50, -110, 40),
    ...torso(0, 30, 0),
    ...head(0, -80),
  });
  r.at(0.76, {
    heading: 465,
    ...legL(30, 10, 50),
    ...legR(60, -70, 100),
    ...armsWide,
    ...torso(5, 10, 0),
    ...head(0, -40),
  });
  r.at(0.8, { heading: 470, ...legL(20, 5, 30), ...legR(45, -40, 80), ...armsWide, ...torso(8, 0, 0), ...head(0, -20) });
  r.pin("L", 0.8, 1);
  settle(r, "R", 0.86, 0.92, { heading: 480 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("tornado-sidekick");
}

/** Swing 900: the right leg swings through and the left foot takes off in
 * backside, ~540° in the air (the Cheat 900's rotation), the swing leg comes
 * round again for a round kick and the left foot lands (complete). */
export function buildSwing900(): THREE.AnimationClip {
  const D = 1.9;
  const r = new Rig(D);
  // Standing on the left foot with the right foot just off the floor behind;
  // its knee folds as it swings through under the body.
  r.start({ ...armsDown, ...legL(0, 5), ...legR(-25, -10, 45, 0, -20), ...torso(5, 0, -10) });
  r.at(0.09, { ...legR(5, 5, 85, 0, -40) });
  r.pin("L", 0, 0.4);
  r.at(0.18, {
    heading: 40,
    ...legR(45, 15, 25),
    ...legL(10, 5, 30),
    ...armL(40, 150, 20),
    ...armR(50, -30, 30),
    ...torso(5, 0, 10),
    ...head(0, 20),
  });
  r.at(0.3, {
    heading: 130,
    ...legR(85, 40, 30),
    ...legL(20, 5, 45),
    ...armL(90, 60, 30),
    ...armR(80, -110, 30),
    ...torso(8, 0, 25),
    ...head(0, 40),
  });
  r.at(0.4, {
    heading: 230,
    ...legR(95, 45, 60),
    ...legL(0, 5, 5, 0, 35),
    ...armsUp,
    ...torso(-5, 0, 30),
    ...head(-5, 45),
  });
  r.flight(0.4, 0.84, { travel: [0.05, 0.2], apex: 0.5 });
  r.at(0.5, {
    heading: 340,
    ...legL(90, 30, 115),
    ...legR(60, -60, 125, 60),
    ...armsTight,
    ...torso(5, 5, 10),
    ...head(0, 40),
  });
  r.at(0.6, {
    heading: 490,
    ...legL(80, 35, 120),
    ...legR(65, -60, 125, 70),
    ...armsTight,
    ...torso(5, 5, 10),
    ...head(0, 40),
  });
  r.at(0.68, {
    heading: 610,
    ...legL(75, 35, 115),
    ...legR(75, -60, 120, 70),
    ...armL(80, 90, 50),
    ...armR(80, -60, 60),
    ...torso(5, 10, 5),
    ...head(0, 30),
  });
  r.at(0.74, {
    heading: 715,
    ...legL(70, 30, 110),
    ...legR(112, 5, 5, 70),
    ...armL(40, 130, 30),
    ...armR(60, -20, 70),
    ...torso(0, 15, -10),
    ...head(0, 0),
  });
  r.at(0.84, {
    heading: 790,
    ...legL(20, 5, 30),
    ...legR(50, -20, 80),
    ...armsWide,
    ...torso(8, 0, 0),
  });
  r.pin("L", 0.84, 1);
  settle(r, "R", 0.9, 0.96, { heading: 800 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("swing-900");
}

/** Swing 360: the right leg swings through, takeoff from the left foot, 360°
 * with a left-leg outside crescent/hook, land on both feet. */
export function buildSwing360(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  // Standing on the left foot with the right foot just off the floor behind;
  // its knee folds as it swings through under the body.
  r.start({ ...armsDown, ...legL(0, 5), ...legR(-25, -10, 45, 0, -20), ...torso(5, 0, -10) });
  r.at(0.09, { ...legR(5, 5, 85, 0, -40) });
  r.pin("L", 0, 0.38);
  r.at(0.18, {
    heading: 35,
    ...legR(45, 15, 25),
    ...legL(10, 5, 30),
    ...armL(40, 150, 20),
    ...armR(50, -30, 30),
    ...torso(5, 0, 10),
    ...head(0, 20),
  });
  r.at(0.3, {
    heading: 100,
    ...legR(85, 40, 30),
    ...legL(20, 5, 45),
    ...armL(90, 60, 30),
    ...armR(80, -110, 30),
    ...torso(8, 0, 25),
    ...head(0, 40),
  });
  r.at(0.38, {
    heading: 150,
    ...legR(95, 45, 60),
    ...legL(0, 5, 5, 0, 35),
    ...armsUp,
    ...torso(-5, 0, 30),
    ...head(-5, 45),
  });
  r.flight(0.38, 0.8, { travel: [0.05, 0.2] });
  r.at(0.5, {
    heading: 225,
    ...legR(55, 10, 95),
    ...legL(40, -10, 45),
    ...armsTight,
    ...torso(5, 0, 20),
    ...head(0, 40),
  });
  r.at(0.62, {
    heading: 290,
    ...legL(100, -30, 10),
    ...legR(50, -10, 90),
    ...armL(60, 60, 40),
    ...armR(70, -60, 40),
    ...torso(5, 0, 10),
    ...head(0, 30),
  });
  r.at(0.7, {
    heading: 312,
    ...legL(115, 50, 25),
    ...legR(40, -10, 80),
    ...armL(40, 140, 30),
    ...armR(70, -20, 60),
    ...torso(5, 15, 0),
    ...head(0, 10),
  });
  r.at(0.8, {
    heading: 360,
    ...legL(25, 10, 35),
    ...legR(25, -10, 35),
    ...armsWide,
    ...torso(10, 0, 0),
    ...head(5, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(1, { heading: 360, ...legL(25, 10, 40), ...legR(25, -10, 40), ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("swing-kick");
}

/** Lotus (jumping outside-crescent, wushu 腾空摆莲): step in, the right leg
 * swings up first, takeoff from the left foot, 360° with a left-leg outside
 * crescent slapped by both hands, land on the right foot. */
export function buildLotus(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  // Two running steps. Each foot lifts straight up, swings through with the
  // knee folded, stops over the spot it lands on and is lowered straight onto
  // it; the heading and the standing leg hold still while a foot is near the
  // floor, and both feet hold for a moment at each change of support.
  const stand = { ...legL(15, 5, 0, 0, 15), ...legR(-15, -5, 0, 0, -15) };
  r.start({ ...armsDown, ...stand });
  r.pin("L", 0, 0.15);
  r.at(0.03, { heading: 0, ...stand, ...legR(1, -5, 34, 0, -33) });
  r.at(0.075, { heading: 12, ...legR(30, 5, 75, 0, -45) });
  const pushL = legL(-10, 5, 15, 0, -25);
  const overR = legR(38.5, 10, 42, 0, -4);
  const downR = legR(26, 10, 19.5, 0, 6.5);
  r.at(0.12, { heading: 25, ...pushL, ...overR, ...armL(30, 140, 20), ...armR(35, -40, 20), ...torso(8, 0, 10) });
  r.at(0.125, { heading: 25, ...pushL, ...overR });
  r.at(0.15, { heading: 25, ...pushL, ...downR });
  r.pin("R", 0.15, 0.28);
  r.at(0.17, { heading: 25, ...pushL, ...downR });
  const liftL = legL(0, 5, 36.7, 0, -36.7);
  r.at(0.195, { heading: 25, ...liftL, ...downR });
  r.at(0.2, { heading: 25, ...liftL, ...downR });
  r.at(0.225, { heading: 45, ...legL(35, 15, 75, 0, -40) });
  const pushR = legR(-10, -5, 15, 0, -25);
  const overL = legL(38.5, 15, 42, 0, -4);
  const downL = legL(26, 15, 19.5, 0, 6.5);
  r.at(0.25, { heading: 55, ...pushR, ...overL, ...armL(35, 40, 20), ...armR(30, -150, 20), ...torso(10, 0, -10), ...head(0, 20) });
  r.at(0.255, { heading: 55, ...pushR, ...overL });
  r.at(0.28, { heading: 55, ...pushR, ...downL });
  r.pin("L", 0.28, 0.42);
  r.at(0.3, { heading: 55, ...pushR, ...downL });
  const liftR = legR(0, -5, 36.7, 0, -36.7);
  r.at(0.312, { heading: 55, ...liftR, ...downL });
  r.at(0.316, { heading: 55, ...liftR, ...downL });
  r.at(0.328, { ...legR(35, 10, 80, 0, -40) });
  r.at(0.34, {
    heading: 110,
    ...legR(80, 30, 20),
    ...legL(25, 5, 50),
    ...armL(80, 110, 30),
    ...armR(70, -60, 30),
    ...torso(12, 0, 20),
    ...head(0, 40),
  });
  r.at(0.42, {
    heading: 160,
    ...legR(105, 40, 20),
    ...legL(0, 5, 5, 0, 35),
    ...armsUp,
    ...torso(-5, 0, 30),
    ...head(-5, 45),
  });
  r.flight(0.42, 0.82, { travel: [0.1, 0.3] });
  r.at(0.52, {
    heading: 230,
    ...legR(60, 10, 70),
    ...legL(60, -50, 20),
    ...armL(100, 60, 20),
    ...armR(100, -30, 20),
    ...torso(5, 0, 20),
    ...head(0, 40),
  });
  r.at(0.62, {
    heading: 290,
    ...legR(45, 0, 80),
    ...legL(110, -10, 5),
    ...armL(100, 30, 20),
    ...armR(100, 0, 20),
    ...torso(10, 0, 10),
    ...head(10, 20),
  });
  r.at(0.7, {
    heading: 322,
    ...legR(40, -5, 80),
    ...legL(110, 45, 5),
    ...armL(95, 70, 20),
    ...armR(95, 20, 20),
    ...torso(10, 10, 0),
    ...head(10, 10),
  });
  r.at(0.82, {
    heading: 380,
    ...legR(20, -5, 30),
    ...legL(40, 20, 50),
    ...armL(60, 90, 30),
    ...armR(60, -90, 30),
    ...torso(8, 0, 0),
    ...head(0, 0),
  });
  r.pin("R", 0.82, 1);
  r.at(0.86, { ...legL(10, 15, 90, 0, -40) });
  settle(r, "L", 0.89, 0.95, { heading: 390 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("lotus");
}
