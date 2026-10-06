import type * as THREE from "three";
import { Rig } from "../rig";
import { armL, armR, armsBack, armsDown, armsTight, armsUp, armsWide, head, legL, legR, legsAbsorb, torso } from "./poses";

/* Backward / forward flips authored on the semantic rig (left-twisting tricker). */

/** Back flip with a split kick at the peak: the right leg leads over the top and lands first. */
function flashFlight(r: Rig, u0: number, u1: number) {
  const mid = (a: number, b: number, k: number) => a + (b - a) * k;
  r.at(mid(u0, u1, 0.28), {
    pitch: -120,
    ...legR(85, 0, 5),
    ...legL(5, 0, 40),
    ...armL(130, 100, 10),
    ...armR(130, -100, 10),
    ...torso(-15, 0, 0),
    ...head(-40, 0),
  });
  r.at(mid(u0, u1, 0.55), {
    pitch: -210,
    ...legR(60, 0, 5),
    ...legL(-15, 0, 30),
    ...armsWide,
    ...torso(-10, 0, 0),
    ...head(-30, 0),
  });
  r.at(mid(u0, u1, 0.8), {
    pitch: -300,
    ...legR(40, 0, 20),
    ...legL(-20, 0, 30),
    ...armL(70, 90, 20),
    ...armR(70, -90, 20),
    ...torso(0, 0, 0),
    ...head(-10, 0),
  });
  r.at(u1, {
    pitch: -360,
    ...legR(20, 0, 20),
    ...legL(-20, 0, 50),
    ...armL(50, 90, 20),
    ...armR(50, -90, 20),
    ...torso(10, 0, 0),
    ...head(0, 0),
  });
  r.pin("R", u1, 1);
  r.at(mid(u1, 1, 0.5), { ...legL(10, 0, 40), ...legR(25, 0, 40) });
  r.at(1, { pitch: -360, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
}

/** Flash kick: two-foot backflip with the right leg kicking up at the peak. */
export function buildFlashKick(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.32);
  r.at(0.18, { ...legL(45, 8, 70), ...legR(45, -8, 70), ...armsBack, ...torso(15, 0, 0), ...head(5, 0) });
  r.at(0.32, { pitch: -10, ...legL(0, 5, 5, 0, 35), ...legR(0, -5, 5, 0, 35), ...armsUp, ...torso(-10, 0, 0), ...head(-25, 0) });
  r.flight(0.32, 0.8, { travel: [0, -0.2] });
  flashFlight(r, 0.32, 0.8);
  return r.build("flash-kick");
}

/** Gainer flash: one-foot (left) takeoff from a step, the right leg swings up
 * and over, flipping backward while travelling forward; lands on the right foot. */
export function buildGainerFlash(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(20, 5), ...legR(-15, -5), ...torso(8, 0, 0) });
  r.pin("L", 0, 0.36);
  r.at(0.2, { ...legL(25, 5, 35), ...legR(30, -5, 40), ...armsBack, ...torso(10, 0, 0), ...head(0, 0) });
  r.at(0.36, {
    pitch: -20,
    ...legL(0, 5, 5, 0, 35),
    ...legR(100, -5, 5),
    ...armsUp,
    ...torso(-15, 0, 0),
    ...head(-30, 0),
  });
  r.flight(0.36, 0.8, { travel: [0, 0.5] });
  flashFlight(r, 0.36, 0.8);
  return r.build("gainer-flash");
}

/** Janitor flip: two-foot punch into a chest-down dive that flat-spins 180°,
 * landing on both feet facing back the way it came. */
export function buildJanitor(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.3);
  r.at(0.16, { ...legL(40, 8, 55), ...legR(40, -8, 55), ...armsBack, ...torso(20, 0, 0), ...head(5, 0) });
  r.at(0.3, {
    heading: 10,
    pitch: 55,
    ...legL(55, 5, 5, 0, 35),
    ...legR(55, -5, 5, 0, 35),
    ...armL(100, 10, 10),
    ...armR(100, -10, 10),
    ...torso(10, 0, 10),
    ...head(-20, 10),
  });
  r.flight(0.3, 0.72, { travel: [0.1, 0.6] });
  r.at(0.42, { heading: 60, pitch: 85, ...legL(-20, 30, 10), ...legR(-10, -30, 10), ...armsWide, ...torso(-10, 0, 0), ...head(-30, 20) });
  r.at(0.55, { heading: 130, pitch: 85, ...legL(0, 10, 5), ...legR(0, -10, 5), ...armsWide, ...torso(-10, 0, 0), ...head(-30, 10) });
  r.at(0.65, { heading: 170, pitch: 55, ...legL(50, 5, 20), ...legR(50, -5, 20), ...armL(90, 60, 20), ...armR(90, -60, 20), ...torso(0, 0, 0), ...head(-10, 0) });
  r.at(0.72, { heading: 180, pitch: 20, ...legL(40, 8, 45), ...legR(40, -8, 45), ...armsWide, ...torso(20, 0, 0), ...head(0, 0) });
  r.pin("L", 0.72, 1);
  r.at(1, { heading: 180, pitch: 0, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
  return r.build("janitor");
}

/** Off-axis full twist (backflip + 360° left twist) from one foot, used by the
 * wrap full and the tak full. `setup` keys everything up to takeoff at `uOff`. */
function offAxisFull(r: Rig, uOff: number, uLand: number, headingAtTakeoff: number) {
  const mid = (k: number) => uOff + (uLand - uOff) * k;
  r.flight(uOff, uLand, { travel: [0.2, 0] });
  r.at(mid(0.25), {
    heading: headingAtTakeoff + 20,
    pitch: -110,
    twist: 90,
    roll: -15,
    ...legL(25, 5, 60),
    ...legR(25, -5, 60),
    ...armsTight,
    ...torso(5, 0, 0),
    ...head(-20, 30),
  });
  r.at(mid(0.55), {
    heading: headingAtTakeoff + 40,
    pitch: -215,
    twist: 220,
    roll: -15,
    ...legL(20, 5, 50),
    ...legR(20, -5, 50),
    ...head(-20, 30),
  });
  r.at(mid(0.8), {
    heading: headingAtTakeoff + 55,
    pitch: -300,
    twist: 320,
    roll: -10,
    ...legL(35, 5, 30),
    ...legR(0, -5, 20),
    ...armL(80, 60, 30),
    ...armR(80, -60, 30),
    ...head(-10, 10),
  });
  r.at(uLand, {
    heading: headingAtTakeoff + 65,
    pitch: -360,
    twist: 360,
    roll: 0,
    ...legL(20, 5, 15),
    ...legR(-25, -10, 50),
    ...armsWide,
    ...torso(10, 0, 0),
    ...head(0, 0),
  });
  r.pin("L", uLand, 1);
  r.at((uLand + 1) / 2, { ...legR(5, -5, 35), ...legL(25, 5, 40) });
  r.at(1, { heading: headingAtTakeoff + 70, pitch: -360, twist: 360, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
}

/** Wrap full: from a hyper landing on the right foot, the left leg wraps behind
 * the base leg, then a one-foot full twist, landing complete on the left foot. */
export function buildWrapFull(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legR(5, -5, 10), ...legL(40, 10, 60), ...torso(5, 0, 0) });
  r.pin("R", 0, 0.38);
  r.at(0.18, {
    heading: 30,
    ...legL(-10, -35, 50),
    ...legR(30, -5, 45),
    ...armL(50, 20, 20),
    ...armR(50, -160, 20),
    ...torso(15, 0, -20),
    ...head(5, -10),
  });
  r.at(0.3, {
    heading: 80,
    ...legL(-20, -20, 40),
    ...legR(35, 0, 50),
    ...armL(120, 60, 15),
    ...armR(100, -120, 20),
    ...torso(5, 0, 10),
    ...head(0, 20),
  });
  r.at(0.38, {
    heading: 120,
    pitch: -20,
    ...legL(10, 10, 60),
    ...legR(0, 0, 5, 0, 35),
    ...armsUp,
    ...torso(-10, 0, 20),
    ...head(-20, 30),
  });
  offAxisFull(r, 0.38, 0.82, 120);
  return r.build("wrap");
}

/** Tak full: cheat setup (as for a tornado) into a wrap-style full twist. */
export function buildTakFull(): THREE.AnimationClip {
  const D = 1.9;
  const r = new Rig(D);
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
  r.pin("R", 0.16, 0.4);
  r.at(0.28, {
    heading: 165,
    ...legR(35, 0, 55),
    ...legL(15, 10, 70),
    ...armL(55, 110, 30),
    ...armR(50, -40, 30),
    ...torso(18, 0, 25),
    ...head(5, 50),
  });
  r.at(0.4, {
    heading: 210,
    pitch: -20,
    ...legL(60, 30, 40),
    ...legR(0, 0, 5, 0, 35),
    ...armsUp,
    ...torso(-10, 0, 30),
    ...head(-20, 40),
  });
  offAxisFull(r, 0.4, 0.82, 210);
  return r.build("tak");
}
