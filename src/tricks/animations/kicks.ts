import type * as THREE from "three";
import { Rig } from "../rig";
import { armL, armR, armsDown, armsUp, armsWide, armsTight, head, legL, legR, legsAbsorb, torso } from "./poses";

/* Vertical kicks (left-twisting tricker, spinning counter-clockwise).
 *
 * Leg roles for a counter-clockwise spinner:
 *   inside kick (round)       = right leg
 *   outside kick (hook/crescent) = left leg
 *   cheat takeoff             = right foot, left knee drives
 */

/** Cheat setup shared by Tornado / 540 / Cheat 720: pivot on the left foot
 * while the right foot steps around to backside, then the left knee drives
 * and the right foot pushes off at `uOff`. Returns the heading at takeoff. */
function cheatSetup(r: Rig, uOff: number, driveLeg: "knee" | "swing"): number {
  r.start({ ...armsDown, ...legL(15, 5), ...legR(-10, -5) });
  r.pin("L", 0, 0.16);
  r.at(0.16, {
    heading: 70,
    ...legR(40, -15, 20),
    ...legL(-5, 5, 10),
    ...armL(40, 40, 20),
    ...armR(35, -150, 20),
    ...torso(8, 0, 20),
    ...head(0, 40),
  });
  r.pin("R", 0.16, uOff);
  r.at(0.28, {
    heading: 165,
    ...legR(35, 0, 55, 0, 0),
    ...legL(15, 10, 70),
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
  r.at(0.9, { heading: 428, ...legL(15, 5, 35), ...legR(15, -15, 40, 0, 0) });
  r.at(1, { heading: 430, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
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
  r.at(0.9, { heading: 530, ...legR(20, 0, 40), ...legL(-5, 20, 40) });
  r.at(1, { heading: 540, ...legR(15, 0, 30), ...legL(-15, 10, 20), ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
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
  r.at(0.92, { heading: 712, ...legR(20, 0, 40), ...legL(0, 30, 40) });
  r.at(1, { heading: 720, ...legR(15, 0, 30), ...legL(-15, 10, 20), ...armsDown, ...torso(5, 0, 0) });
  return r.build("cheat-720");
}

/** Pop 360: two-foot takeoff from frontside, 180° in the air, left-leg outside
 * crescent at the target, land on both feet (turbo). */
export function buildPop360(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.38);
  r.at(0.2, {
    heading: 15,
    ...legL(35, 8, 50),
    ...legR(35, -8, 50),
    ...armL(45, 10, 20),
    ...armR(55, -140, 20),
    ...torso(15, 0, -30),
    ...head(5, -20),
  });
  r.at(0.38, {
    heading: 95,
    ...legL(0, 5, 5, 0, 35),
    ...legR(0, -5, 5, 0, 35),
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
  r.at(1, { heading: 360, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("pop-kick");
}

/** Swing 360: the right leg swings through, takeoff from the left foot, 360°
 * with a left-leg outside crescent/hook, land on both feet. */
export function buildSwing360(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 5), ...legR(-25, -10, 20), ...torso(5, 0, -10) });
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
  r.at(1, { heading: 360, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("swing-kick");
}

/** Lotus (jumping outside-crescent, wushu 腾空摆莲): step in, the right leg
 * swings up first, takeoff from the left foot, 360° with a left-leg outside
 * crescent slapped by both hands, land on the right foot. */
export function buildLotus(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(15, 5), ...legR(-15, -5) });
  r.pin("L", 0, 0.14);
  r.at(0.14, { heading: 25, ...legR(40, 10, 15), ...legL(-10, 5, 15), ...armL(30, 140, 20), ...armR(35, -40, 20), ...torso(8, 0, 10) });
  r.pin("R", 0.14, 0.26);
  r.at(0.26, { heading: 55, ...legL(45, 15, 20), ...legR(-10, -5, 15), ...armL(35, 40, 20), ...armR(30, -150, 20), ...torso(10, 0, -10), ...head(0, 20) });
  r.pin("L", 0.26, 0.42);
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
  r.at(0.92, { heading: 388, ...legL(15, 10, 40), ...legR(20, -5, 40) });
  r.at(1, { heading: 390, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
  return r.build("lotus");
}
