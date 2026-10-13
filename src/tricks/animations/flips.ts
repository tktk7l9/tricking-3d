import type * as THREE from "three";
import { Rig } from "../rig";
import { armL, armR, armsBack, armsDown, armsTight, armsUp, armsWide, head, legL, legR, legsAbsorb, legsTuck, settle, torso } from "./poses";
import { cheatStep } from "./kicks";

/* Backward / forward flips authored on the semantic rig (left-twisting tricker). */

/** One-foot (swing) entry stance shared by the gainers and corks: standing on
 * the left foot, flat, with the right foot just off the floor behind, ready to
 * swing through. */
function swingStance(r: Rig) {
  r.start({ ...armsDown, ...legL(20, 5, 0, 0, 20), ...legR(-15, -5, 35, 0, -20), ...torso(8, 0, 0) });
  // The swing leg's knee folds as it passes under the body, so the foot clears the floor.
  r.at(0.1, { ...legR(5, -5, 80, 0, -40) });
}

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
  // The trailing left foot is carried forward in the air, then set down beside the right.
  r.at(mid(u1, 1, 0.45), { ...legL(35, 0, 85, 0, -40), ...legR(25, 0, 40) });
  r.at(mid(u1, 1, 0.75), { pitch: -360, ...legsAbsorb });
  r.at(1, { pitch: -360, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
}

/** Two-footed squat with the feet flat under the hips (hip bend half the knee
 * bend, ankles flexed as far as the shins lean), so both feet stay put. */
const squat = { ...legL(22, 8, 45, 0, -23), ...legR(22, -8, 45, 0, -23) };
/** Both feet pushing off, toes pointed. */
const pushOff = { ...legL(0, 8, 5, 0, 35), ...legR(0, -8, 5, 0, 35) };
/** Two-footed landing stance; the knees soften without moving the feet. */
const landStance = { ...legL(25, 8, 40), ...legR(25, -8, 40) };

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
  swingStance(r);
  r.pin("L", 0, 0.36);
  r.at(0.2, { ...legL(25, 5, 35), ...legR(45, -5, 50), ...armsBack, ...torso(10, 0, 0), ...head(0, 0) });
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

/** Gainer switch: a gainer flash whose legs scissor on the way down so that it
 * lands on the plant (left) foot again, right leg trailing for a swing-through. */
export function buildGainerSwitch(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  swingStance(r);
  r.pin("L", 0, 0.36);
  r.at(0.2, { ...legL(25, 5, 35), ...legR(45, -5, 50), ...armsBack, ...torso(10, 0, 0), ...head(0, 0) });
  r.at(0.36, {
    pitch: -20,
    ...legL(0, 5, 5, 0, 35),
    ...legR(100, -5, 5),
    ...armsUp,
    ...torso(-15, 0, 0),
    ...head(-30, 0),
  });
  r.flight(0.36, 0.8, { travel: [0, 0.5] });
  r.at(0.48, {
    pitch: -120,
    ...legR(85, 0, 5),
    ...legL(5, 0, 40),
    ...armL(130, 100, 10),
    ...armR(130, -100, 10),
    ...torso(-15, 0, 0),
    ...head(-40, 0),
  });
  r.at(0.6, {
    pitch: -210,
    ...legR(60, 0, 10),
    ...legL(-10, 0, 30),
    ...armsWide,
    ...torso(-10, 0, 0),
    ...head(-30, 0),
  });
  r.at(0.7, {
    pitch: -300,
    ...legR(10, 0, 45),
    ...legL(35, 0, 30),
    ...armL(70, 90, 20),
    ...armR(70, -90, 20),
    ...torso(0, 0, 0),
    ...head(-10, 0),
  });
  r.at(0.8, {
    pitch: -360,
    ...legL(20, 0, 20),
    ...legR(-30, 0, 55),
    ...armL(50, 90, 20),
    ...armR(50, -90, 20),
    ...torso(10, 0, 0),
    ...head(0, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(0.9, { ...legL(25, 0, 40), ...legR(-35, -5, 50), ...torso(15, 0, 0) });
  r.at(1, {
    pitch: -360,
    ...legL(20, 0, 35),
    ...legR(-30, -5, 40),
    ...armL(40, 60, 20),
    ...armR(40, -60, 20),
    ...torso(12, 0, 0),
  });
  return r.build("gainer-switch");
}

/** Loser: a webster entered from a backstep. The right foot steps back and
 * pushes off, the left leg swings up behind and the front flip travels backward
 * (losing ground); lands on both feet. The body's rotation carries the swing
 * leg over the top; relative to the pelvis the leg then folds forward under the
 * body into the tuck, so the hip never bends backward past a split. */
export function buildLoser(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(5, 8), ...legR(-5, -8), ...torso(5, 0, 0) });
  // Step back: the right foot lifts straight up, moves back in the air and is
  // set down behind; both feet hold while the weight moves back onto it.
  r.pin("L", 0, 0.18);
  r.at(0.04, { ...legL(5, 8), ...legR(15, -8, 40, 0, -25) });
  r.at(0.12, { ...legR(-20, -8, 30, 0, -10) });
  r.at(0.18, { ...legL(10, 8, 15), ...legR(-25, -8, 15), ...armsBack, ...torso(10, 0, 0), ...head(5, 0) });
  r.pin("R", 0.18, 0.34);
  r.at(0.21, { ...legL(10, 8, 15), ...legR(-25, -8, 15) });
  // Weight sinks onto the back (right) foot; at takeoff that foot is ahead of
  // the hips so the push drives the body backward, chest kept up. The left
  // foot lifts straight up and its knee stays folded as the leg swings back.
  r.at(0.24, { ...legL(30, 8, 60, 0, -30) });
  r.at(0.26, { pitch: 0, ...legL(25, 8, 75, 0, -40), ...legR(10, -8, 45), ...armsBack, ...torso(10, 0, 0) });
  r.at(0.3, { ...legL(-10, 5, 80) });
  r.at(0.34, {
    pitch: 10,
    ...legL(-55, 5, 20),
    ...legR(20, -5, 5, 0, 35),
    ...armL(120, 30, 10),
    ...armR(120, -30, 10),
    ...torso(5, 0, 0),
    ...head(0, 0),
  });
  r.flight(0.34, 0.8, { travel: [0, -0.6], apex: 0.5 });
  // Swing leg still split behind: with the body pitched forward it now points
  // up, leading the flip over the top.
  r.at(0.44, {
    pitch: 110,
    ...legL(-45, 5, 30),
    ...legR(50, -5, 80),
    ...armL(140, 40, 60),
    ...armR(140, -40, 60),
    ...torso(25, 0, 0),
    ...head(20, 0),
  });
  r.at(0.5, { ...legL(30, 5, 90) });
  r.at(0.56, {
    pitch: 200,
    ...legL(120, 5, 130),
    ...legR(120, -5, 130),
    ...armsTight,
    ...torso(45, 0, 0),
    ...head(40, 0),
  });
  r.at(0.68, {
    pitch: 290,
    ...legL(60, 5, 60),
    ...legR(60, -5, 60),
    ...armsWide,
    ...torso(15, 0, 0),
    ...head(10, 0),
  });
  r.at(0.8, {
    pitch: 360,
    ...legL(25, 8, 45),
    ...legR(25, -8, 45),
    ...armsWide,
    ...torso(15, 0, 0),
    ...head(5, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: 360, ...legL(25, 8, 40), ...legR(25, -8, 40), ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("loser");
}

/** Corkscrew entry shared by the Corkscrew Swipe / Corkscrew Hyper: wind to the
 * right, left-foot takeoff with the right leg swinging up, then the first 210°
 * of the backflip with the left twist (flight 0.36 → 0.82). */
function corkEntry(r: Rig) {
  swingStance(r);
  r.pin("L", 0, 0.36);
  r.at(0.2, {
    heading: 15,
    twist: 0,
    ...legL(25, 5, 35),
    ...legR(45, -5, 50),
    ...armL(45, 10, 20),
    ...armR(50, -150, 20),
    ...torso(10, 0, -25),
    ...head(0, -10),
  });
  r.at(0.36, {
    heading: 45,
    pitch: -20,
    ...legL(0, 5, 5, 0, 35),
    ...legR(100, -10, 5),
    ...armL(160, 80, 10),
    ...armR(140, -40, 15),
    ...torso(-10, 0, 25),
    ...head(-25, 30),
  });
  r.flight(0.36, 0.82, { travel: [0.3, 0.5], apex: 0.55 });
  r.at(0.46, {
    heading: 60,
    pitch: -110,
    twist: 80,
    roll: -15,
    ...legR(70, -10, 25),
    ...legL(10, 5, 40),
    ...armsTight,
    ...torso(5, 0, 0),
    ...head(-20, 30),
  });
  r.at(0.58, {
    heading: 80,
    pitch: -210,
    twist: 210,
    roll: -15,
    ...legR(40, -5, 40),
    ...legL(0, 5, 40),
    ...armsTight,
    ...head(-20, 30),
  });
}

/** Corkscrew swipe: a cork (left-foot takeoff, right leg swing, backflip with a
 * full left twist) that finishes with a right-leg round kick and lands on the
 * kicking leg (hyper). */
export function buildCorkSwipe(): THREE.AnimationClip {
  const r = new Rig(1.9);
  corkEntry(r);
  // The swipe: the right knee chambers while the body is still tilted, the leg
  // snaps out as the twist finishes and sweeps down into the landing, so the
  // kick happens on the way down rather than standing upright.
  r.at(0.68, {
    heading: 95,
    pitch: -290,
    twist: 300,
    roll: -10,
    ...legR(85, -35, 110),
    ...legL(-10, 5, 40),
    ...armL(80, 60, 30),
    ...armR(80, -60, 30),
    ...head(-10, 10),
  });
  r.at(0.73, {
    heading: 102,
    pitch: -322,
    twist: 335,
    roll: -5,
    ...legR(110, -10, 5),
    ...legL(-20, 5, 40),
    ...armL(60, 110, 20),
    ...armR(70, -40, 50),
    ...torso(5, 10, -5),
    ...head(0, 0),
  });
  r.at(0.78, {
    heading: 107,
    pitch: -348,
    twist: 355,
    roll: 0,
    ...legR(60, -5, 15),
    ...legL(-25, 5, 45),
    ...armL(70, 100, 20),
    ...armR(70, -60, 40),
    ...torso(8, 5, 0),
  });
  r.at(0.82, {
    heading: 110,
    pitch: -360,
    twist: 360,
    roll: 0,
    ...legR(25, 0, 25),
    ...legL(-30, 5, 50),
    ...armsWide,
    ...torso(10, 0, 0),
    ...head(0, 0),
  });
  r.pin("R", 0.82, 1);
  r.at(0.91, { ...legR(25, 0, 40), ...legL(-20, 5, 40) });
  r.at(1, {
    heading: 115,
    pitch: -360,
    twist: 360,
    ...legR(20, 0, 30),
    ...legL(-20, 5, 25),
    ...armsDown,
    ...torso(5, 0, 0),
  });
  return r.build("cork-swipe");
}

/** Corkscrew hyper: the same cork, legs kept together through the twist, and
 * the right foot reaches down first to land in hyper. */
export function buildCorkscrewHyper(): THREE.AnimationClip {
  const r = new Rig(1.9);
  corkEntry(r);
  r.at(0.68, {
    heading: 95,
    pitch: -290,
    twist: 300,
    roll: -10,
    ...legR(25, -5, 30),
    ...legL(-5, 5, 45),
    ...armL(80, 60, 30),
    ...armR(80, -60, 30),
    ...head(-10, 10),
  });
  r.at(0.76, {
    heading: 105,
    pitch: -340,
    twist: 350,
    roll: 0,
    ...legR(30, 0, 25),
    ...legL(-20, 5, 50),
    ...armsWide,
    ...torso(5, 0, 0),
    ...head(0, 0),
  });
  r.at(0.82, {
    heading: 110,
    pitch: -360,
    twist: 360,
    roll: 0,
    ...legR(25, 0, 25),
    ...legL(-30, 5, 50),
    ...armsWide,
    ...torso(10, 0, 0),
    ...head(0, 0),
  });
  r.pin("R", 0.82, 1);
  r.at(0.91, { ...legR(25, 0, 40), ...legL(-20, 5, 40) });
  r.at(1, {
    heading: 115,
    pitch: -360,
    twist: 360,
    ...legR(20, 0, 30),
    ...legL(-20, 5, 25),
    ...armsDown,
    ...torso(5, 0, 0),
  });
  return r.build("corkscrew-hyper");
}

/** Arabian: a two-foot backflip takeoff, a half twist right after leaving the
 * ground, then the rest of the rotation as a front flip (tuck), landing on
 * both feet facing the way it travelled. */
export function buildArabian(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.32);
  r.at(0.18, { ...legL(45, 8, 70), ...legR(45, -8, 70), ...armsBack, ...torso(15, 0, 0), ...head(5, 0) });
  r.at(0.32, {
    pitch: -15,
    twist: 0,
    ...legL(0, 5, 5, 0, 35),
    ...legR(0, -5, 5, 0, 35),
    ...armsUp,
    ...torso(-10, 0, 0),
    ...head(-25, 0),
  });
  r.flight(0.32, 0.8, { travel: [0, -0.5] });
  // The half twist starts straight away while the body leans back, arms in.
  r.at(0.42, {
    pitch: -75,
    twist: 100,
    ...legL(15, 5, 25),
    ...legR(15, -5, 25),
    ...armsTight,
    ...torso(-5, 0, 0),
    ...head(-15, 0),
  });
  // Half twist done: the same rotation now carries the body forward like a front tuck.
  r.at(0.52, {
    pitch: -150,
    twist: 180,
    ...legL(90, 5, 110),
    ...legR(90, -5, 110),
    ...armsTight,
    ...torso(30, 0, 0),
    ...head(25, 0),
  });
  r.at(0.62, {
    pitch: -240,
    twist: 180,
    ...legL(120, 5, 130),
    ...legR(120, -5, 130),
    ...armsTight,
    ...torso(40, 0, 0),
    ...head(35, 0),
  });
  r.at(0.72, {
    pitch: -320,
    twist: 180,
    ...legL(50, 8, 50),
    ...legR(50, -8, 50),
    ...armsWide,
    ...torso(15, 0, 0),
    ...head(10, 0),
  });
  r.at(0.8, {
    pitch: -360,
    twist: 180,
    ...legL(25, 8, 40),
    ...legR(25, -8, 40),
    ...armsWide,
    ...torso(15, 0, 0),
    ...head(5, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: -360, twist: 180, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("arabian");
}

/** X-Out: a back tuck whose legs open into a split kick at the top of the
 * flip and close again for a two-footed landing. */
export function buildXOut(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.32);
  r.at(0.18, { ...legL(45, 8, 70), ...legR(45, -8, 70), ...armsBack, ...torso(15, 0, 0), ...head(5, 0) });
  r.at(0.32, {
    pitch: -15,
    ...legL(0, 5, 5, 0, 35),
    ...legR(0, -5, 5, 0, 35),
    ...armsUp,
    ...torso(-10, 0, 0),
    ...head(-25, 0),
  });
  r.flight(0.32, 0.8, { travel: [0, -0.35] });
  r.at(0.42, {
    pitch: -85,
    ...legL(35, 5, 50),
    ...legR(55, -5, 50),
    ...armL(130, 100, 10),
    ...armR(130, -100, 10),
    ...torso(-10, 0, 0),
    ...head(-35, 0),
  });
  // The split kick: right leg up toward the chest, left leg back, both straight.
  r.at(0.52, { pitch: -170, ...legL(-55, 5, 5), ...legR(100, -5, 5), ...armsWide, ...torso(-5, 0, 0), ...head(-30, 0) });
  r.at(0.62, { pitch: -250, ...legL(-45, 5, 10), ...legR(85, -5, 10), ...armsWide, ...torso(0, 0, 0), ...head(-20, 0) });
  r.at(0.72, {
    pitch: -320,
    ...legL(20, 8, 40),
    ...legR(40, -8, 40),
    ...armL(70, 90, 20),
    ...armR(70, -90, 20),
    ...torso(10, 0, 0),
    ...head(-5, 0),
  });
  r.at(0.8, { pitch: -360, ...legL(25, 8, 40), ...legR(25, -8, 40), ...armsWide, ...torso(15, 0, 0), ...head(5, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: -360, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("x-out");
}

/** Gainer Arabian: the Gainer Flash's swing takeoff (left foot, right leg
 * swinging up) into the Arabian's half twist and forward finish. It keeps
 * the gainer's forward travel and lands on both feet facing back. */
export function buildGainerArabian(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  swingStance(r);
  r.pin("L", 0, 0.36);
  r.at(0.2, { ...legL(25, 5, 35), ...legR(45, -5, 50), ...armsBack, ...torso(10, 0, 0), ...head(0, 0) });
  r.at(0.36, {
    pitch: -20,
    twist: 0,
    ...legL(0, 5, 5, 0, 35),
    ...legR(100, -5, 5),
    ...armsUp,
    ...torso(-15, 0, 0),
    ...head(-30, 0),
  });
  r.flight(0.36, 0.8, { travel: [0, 0.45] });
  r.at(0.45, {
    pitch: -80,
    twist: 100,
    ...legL(25, 5, 40),
    ...legR(60, -5, 50),
    ...armsTight,
    ...torso(-5, 0, 0),
    ...head(-15, 0),
  });
  r.at(0.54, {
    pitch: -155,
    twist: 180,
    ...legL(90, 5, 110),
    ...legR(90, -5, 110),
    ...armsTight,
    ...torso(30, 0, 0),
    ...head(25, 0),
  });
  r.at(0.63, {
    pitch: -240,
    twist: 180,
    ...legL(120, 5, 130),
    ...legR(120, -5, 130),
    ...armsTight,
    ...torso(40, 0, 0),
    ...head(35, 0),
  });
  r.at(0.72, {
    pitch: -320,
    twist: 180,
    ...legL(50, 8, 50),
    ...legR(50, -8, 50),
    ...armsWide,
    ...torso(15, 0, 0),
    ...head(10, 0),
  });
  r.at(0.8, {
    pitch: -360,
    twist: 180,
    ...legL(25, 8, 40),
    ...legR(25, -8, 40),
    ...armsWide,
    ...torso(15, 0, 0),
    ...head(5, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: -360, twist: 180, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("gainer-arabian");
}

/** Front Half (Barahni): a front tuck with a half twist, finishing on both
 * feet facing back the way it came. */
export function buildFrontHalf(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.3);
  r.at(0.16, {
    ...legL(45, 8, 70),
    ...legR(45, -8, 70),
    ...armL(60, 20, 20),
    ...armR(60, -20, 20),
    ...torso(20, 0, 0),
    ...head(5, 0),
  });
  r.at(0.3, {
    pitch: 15,
    twist: 0,
    ...legL(0, 5, 5, 0, 35),
    ...legR(0, -5, 5, 0, 35),
    ...armsUp,
    ...torso(15, 0, 0),
    ...head(20, 0),
  });
  r.flight(0.3, 0.8, { travel: [0, 0.6] });
  r.at(0.42, {
    pitch: 120,
    twist: 0,
    ...legL(120, 5, 130),
    ...legR(120, -5, 130),
    ...armsTight,
    ...torso(45, 0, 0),
    ...head(40, 0),
  });
  r.at(0.54, {
    pitch: 215,
    twist: 25,
    ...legL(110, 5, 120),
    ...legR(110, -5, 120),
    ...armsTight,
    ...torso(40, 0, 0),
    ...head(30, 0),
  });
  r.at(0.66, {
    pitch: 295,
    twist: 120,
    ...legL(45, 8, 45),
    ...legR(45, -8, 45),
    ...armsTight,
    ...torso(15, 0, 0),
    ...head(10, 0),
  });
  r.at(0.8, {
    pitch: 360,
    twist: 180,
    ...legL(25, 8, 40),
    ...legR(25, -8, 40),
    ...armsWide,
    ...torso(10, 0, 0),
    ...head(0, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: 360, twist: 180, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("front-half");
}

/** Back Pike: a back tuck with the legs held straight and folded up to the
 * chest (the pike) over the top, opened again for a two-footed landing. */
export function buildBackPike(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.32);
  r.at(0.18, { ...legL(45, 8, 70), ...legR(45, -8, 70), ...armsBack, ...torso(15, 0, 0), ...head(5, 0) });
  r.at(0.32, { pitch: -15, ...legL(0, 5, 5, 0, 35), ...legR(0, -5, 5, 0, 35), ...armsUp, ...torso(-10, 0, 0), ...head(-25, 0) });
  r.flight(0.32, 0.8, { travel: [0, -0.35] });
  r.at(0.42, { pitch: -95, ...legL(60, 4, 5), ...legR(60, -4, 5), ...armL(110, 20, 10), ...armR(110, -20, 10), ...torso(10, 0, 0), ...head(-20, 0) });
  // The pike: knees straight, legs folded to the chest, hands reaching for the shins.
  r.at(0.52, { pitch: -185, ...legL(120, 3, 0), ...legR(120, -3, 0), ...armL(80, 15, 10), ...armR(80, -15, 10), ...torso(30, 0, 0), ...head(10, 0) });
  r.at(0.62, { pitch: -265, ...legL(110, 3, 0), ...legR(110, -3, 0), ...armL(85, 20, 10), ...armR(85, -20, 10), ...torso(25, 0, 0), ...head(5, 0) });
  r.at(0.72, { pitch: -325, ...legL(40, 8, 25), ...legR(40, -8, 25), ...armL(80, 90, 20), ...armR(80, -90, 20), ...torso(10, 0, 0), ...head(0, 0) });
  r.at(0.8, { pitch: -360, ...legL(25, 8, 40), ...legR(25, -8, 40), ...armsWide, ...torso(15, 0, 0), ...head(5, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: -360, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("back-pike");
}

/** Front X-Out: a front tuck whose legs open into a split kick at the top
 * and close again for a two-footed landing. */
export function buildFrontXOut(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.3);
  r.at(0.16, { ...legL(45, 8, 70), ...legR(45, -8, 70), ...armL(60, 20, 20), ...armR(60, -20, 20), ...torso(20, 0, 0), ...head(5, 0) });
  r.at(0.3, { pitch: 15, ...legL(0, 5, 5, 0, 35), ...legR(0, -5, 5, 0, 35), ...armsUp, ...torso(15, 0, 0), ...head(20, 0) });
  r.flight(0.3, 0.8, { travel: [0, 0.6] });
  r.at(0.42, { pitch: 110, ...legL(70, 5, 60), ...legR(70, -5, 60), ...armsTight, ...torso(35, 0, 0), ...head(35, 0) });
  // The split kick: right leg forward to the chest, left leg back, both straight.
  r.at(0.52, { pitch: 190, ...legL(-55, 5, 5), ...legR(105, -5, 5), ...armsWide, ...torso(20, 0, 0), ...head(25, 0) });
  r.at(0.62, { pitch: 270, ...legL(-40, 5, 10), ...legR(85, -5, 10), ...armsWide, ...torso(15, 0, 0), ...head(15, 0) });
  r.at(0.72, { pitch: 330, ...legL(25, 8, 35), ...legR(40, -8, 35), ...armL(80, 90, 20), ...armR(80, -90, 20), ...torso(12, 0, 0), ...head(5, 0) });
  r.at(0.8, { pitch: 360, ...legL(25, 8, 40), ...legR(25, -8, 40), ...armsWide, ...torso(10, 0, 0), ...head(0, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: 360, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("front-x-out");
}

/** Webster Half: the Webster's takeoff (off the right foot, the left leg
 * swinging back and up) into a front flip with a half twist, landing on both
 * feet facing back the way it came. */
export function buildWebsterHalf(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legR(0, -5), ...legL(-15, 5, 50, 0, 10), ...torso(10, 0, 0) });
  r.pin("R", 0, 0.3);
  r.at(0.18, { ...legR(35, -5, 60), ...legL(-20, 5, 60, 0, 20), ...armsBack, ...torso(15, 0, 0), ...head(8, 0) });
  r.at(0.3, {
    pitch: 25,
    twist: 0,
    ...legR(0, -5, 5, 0, 35),
    ...legL(-60, 5, 20),
    ...armL(110, 20, 10),
    ...armR(110, -20, 10),
    ...torso(25, 0, 0),
    ...head(30, 0),
  });
  r.flight(0.3, 0.8, { travel: [0, 0.8] });
  // The swing leg is carried over the top by the flip and folds into the tuck.
  r.at(0.38, { pitch: 85, ...legL(-45, 5, 30), ...legR(45, -5, 60), ...armsTight, ...torso(35, 0, 0), ...head(35, 0) });
  r.at(0.46, { pitch: 150, ...legL(70, 5, 100), ...legR(100, -5, 120), ...armsTight, ...torso(45, 0, 0), ...head(40, 0) });
  r.at(0.56, { pitch: 230, twist: 30, ...legL(115, 5, 125), ...legR(115, -5, 125), ...armsTight, ...torso(40, 0, 0), ...head(30, 0) });
  r.at(0.68, { pitch: 305, twist: 125, ...legL(45, 8, 45), ...legR(45, -8, 45), ...armsTight, ...torso(15, 0, 0), ...head(10, 0) });
  r.at(0.8, { pitch: 360, twist: 180, ...legL(25, 8, 40), ...legR(25, -8, 40), ...armsWide, ...torso(10, 0, 0), ...head(0, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: 360, twist: 180, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("webster-half");
}


/** Back tuck: two-footed takeoff, the knees pulled to the chest over the top,
 * opened out to land on both feet. */
export function buildBackFlip(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.32);
  r.at(0.18, { ...squat, ...armsBack, ...torso(15, 0, 0), ...head(5, 0) });
  r.at(0.32, { pitch: -15, ...pushOff, ...armsUp, ...torso(-10, 0, 0), ...head(-25, 0) });
  r.flight(0.32, 0.8, { travel: [0, -0.4] });
  r.at(0.42, { pitch: -95, ...legL(60, 5, 70), ...legR(60, -5, 70), ...armL(110, 30, 30), ...armR(110, -30, 30), ...torso(10, 0, 0), ...head(-25, 0) });
  r.at(0.55, { pitch: -190, ...legsTuck, ...armsTight, ...torso(40, 0, 0), ...head(35, 0) });
  r.at(0.66, { pitch: -275, ...legL(110, 5, 120), ...legR(110, -5, 120), ...armsTight, ...torso(35, 0, 0), ...head(25, 0) });
  r.at(0.74, { pitch: -330, ...legL(40, 8, 40), ...legR(40, -8, 40), ...armsWide, ...torso(12, 0, 0), ...head(5, 0) });
  r.at(0.8, { pitch: -360, ...landStance, ...armsWide, ...torso(15, 0, 0), ...head(5, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: -360, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("back-flip");
}

/** Full Twist: a back flip with a full twist about the long axis, the body
 * long and the arms pulled in, landing on both feet. */
export function buildFull(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.33);
  r.at(0.18, { ...squat, ...armsBack, ...torso(15, 0, 0), ...head(5, 0) });
  r.at(0.33, { pitch: -15, twist: 0, ...pushOff, ...armsUp, ...torso(-10, 0, 0), ...head(-25, 0) });
  r.flight(0.33, 0.8, { travel: [0, -0.4] });
  r.at(0.44, { pitch: -110, twist: 110, ...legL(20, 5, 20), ...legR(20, -5, 20), ...armsTight, ...torso(5, 0, 0), ...head(-15, 0) });
  r.at(0.55, { pitch: -200, twist: 230, ...legL(25, 5, 30), ...legR(25, -5, 30), ...armsTight, ...torso(15, 0, 0), ...head(-5, 0) });
  r.at(0.67, { pitch: -290, twist: 335, ...legL(25, 5, 25), ...legR(25, -5, 25), ...armsTight, ...torso(10, 0, 0), ...head(0, 0) });
  r.at(0.8, { pitch: -360, twist: 360, ...landStance, ...armsWide, ...torso(15, 0, 0), ...head(5, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: -360, twist: 360, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("full");
}

/** Gainer (Gainer Tuck): the swing takeoff off the left foot, a tucked back
 * flip that keeps travelling forward, landing on both feet. */
export function buildGainer(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  swingStance(r);
  r.pin("L", 0, 0.36);
  r.at(0.2, { ...legL(25, 5, 35), ...legR(45, -5, 50), ...armsBack, ...torso(10, 0, 0), ...head(0, 0) });
  r.at(0.36, { pitch: -20, ...legL(0, 5, 5, 0, 35), ...legR(100, -5, 5), ...armsUp, ...torso(-15, 0, 0), ...head(-30, 0) });
  r.flight(0.36, 0.8, { travel: [0, 0.6] });
  r.at(0.46, { pitch: -110, ...legL(70, 5, 90), ...legR(100, -5, 100), ...armsTight, ...torso(20, 0, 0), ...head(10, 0) });
  r.at(0.56, { pitch: -200, ...legsTuck, ...armsTight, ...torso(40, 0, 0), ...head(35, 0) });
  r.at(0.66, { pitch: -280, ...legL(110, 5, 120), ...legR(110, -5, 120), ...armsTight, ...torso(35, 0, 0), ...head(25, 0) });
  r.at(0.74, { pitch: -330, ...legL(40, 8, 40), ...legR(40, -8, 40), ...armsWide, ...torso(12, 0, 0), ...head(5, 0) });
  r.at(0.8, { pitch: -360, ...landStance, ...armsWide, ...torso(15, 0, 0), ...head(5, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: -360, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("gainer");
}

/** Corkscrew: the cork entry (swing takeoff off the left foot, twisting off
 * axis), landing in complete on the left foot with the right leg trailing. */
export function buildCorkscrew(): THREE.AnimationClip {
  const r = new Rig(1.9);
  corkEntry(r);
  r.at(0.68, { heading: 95, pitch: -290, twist: 300, roll: -10, ...legL(30, 5, 30), ...legR(-5, -5, 45), ...armL(80, 60, 30), ...armR(80, -60, 30), ...head(-10, 10) });
  r.at(0.76, { heading: 105, pitch: -340, twist: 350, roll: 0, ...legL(30, 0, 25), ...legR(-20, -5, 50), ...armsWide, ...torso(5, 0, 0), ...head(0, 0) });
  r.at(0.82, { heading: 110, pitch: -360, twist: 360, roll: 0, ...legL(25, 0, 25), ...legR(-30, -5, 50), ...armsWide, ...torso(10, 0, 0), ...head(0, 0) });
  r.pin("L", 0.82, 1);
  r.at(0.91, { heading: 110, ...legL(25, 0, 35), ...legR(-30, -5, 50) });
  r.at(1, { heading: 110, pitch: -360, twist: 360, ...legL(25, 0, 35), ...legR(-30, -5, 50), ...armsDown, ...torso(5, 0, 0) });
  return r.build("corkscrew");
}

/** Front Tuck: two-footed takeoff into a tucked front flip, landing on both feet. */
export function buildFrontFlip(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.31);
  r.at(0.16, { ...squat, ...armL(60, 20, 20), ...armR(60, -20, 20), ...torso(20, 0, 0), ...head(5, 0) });
  r.at(0.31, { pitch: 15, ...pushOff, ...armsUp, ...torso(15, 0, 0), ...head(20, 0) });
  r.flight(0.31, 0.8, { travel: [0, 0.6] });
  r.at(0.42, { pitch: 110, ...legL(90, 5, 110), ...legR(90, -5, 110), ...armsTight, ...torso(40, 0, 0), ...head(35, 0) });
  r.at(0.5, { pitch: 180, ...legsTuck, ...armsTight, ...torso(45, 0, 0), ...head(40, 0) });
  r.at(0.62, { pitch: 265, ...legL(110, 5, 120), ...legR(110, -5, 120), ...armsTight, ...torso(35, 0, 0), ...head(25, 0) });
  r.at(0.72, { pitch: 325, ...legL(45, 8, 45), ...legR(45, -8, 45), ...armsWide, ...torso(12, 0, 0), ...head(5, 0) });
  r.at(0.8, { pitch: 360, ...landStance, ...armsWide, ...torso(10, 0, 0), ...head(0, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: 360, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("front-flip");
}

/** Webster: off the right foot with the left leg swinging back and up, a
 * front flip that tucks over the top, landing on both feet. */
export function buildWebster(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  // Standing on the right foot with the left foot just off the floor behind.
  r.start({ ...armsDown, ...legR(0, -5), ...legL(-15, 5, 50, 0, 10), ...torso(10, 0, 0) });
  r.pin("R", 0, 0.3);
  r.at(0.18, { ...legR(35, -5, 60), ...legL(-20, 5, 60, 0, 20), ...armsBack, ...torso(15, 0, 0), ...head(8, 0) });
  r.at(0.3, { pitch: 25, ...legR(0, -5, 5, 0, 35), ...legL(-60, 5, 20), ...armL(110, 20, 10), ...armR(110, -20, 10), ...torso(25, 0, 0), ...head(30, 0) });
  r.flight(0.3, 0.8, { travel: [0, 0.8] });
  r.at(0.38, { pitch: 85, ...legL(-45, 5, 30), ...legR(45, -5, 60), ...armsTight, ...torso(35, 0, 0), ...head(35, 0) });
  r.at(0.46, { pitch: 150, ...legL(70, 5, 100), ...legR(100, -5, 120), ...armsTight, ...torso(45, 0, 0), ...head(40, 0) });
  r.at(0.56, { pitch: 230, ...legsTuck, ...armsTight, ...torso(40, 0, 0), ...head(30, 0) });
  r.at(0.68, { pitch: 305, ...legL(45, 8, 45), ...legR(45, -8, 45), ...armsWide, ...torso(15, 0, 0), ...head(10, 0) });
  r.at(0.8, { pitch: 360, ...landStance, ...armsWide, ...torso(10, 0, 0), ...head(0, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { pitch: 360, ...landStance, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("webster");
}

/** Janitor flip: two-foot punch into a chest-down dive that flat-spins 180°,
 * landing on both feet facing back the way it came. */
export function buildJanitor(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  // Both feet push off and land together, so the legs move as a mirrored
  // pair with their planes kept parallel (az 0) and the heading held while
  // both feet are down; otherwise one foot would slide against the other.
  r.start({ ...armsDown, ...legL(0, 0), ...legR(0, 0) });
  r.pin("L", 0, 0.3);
  r.at(0.16, { heading: 0, ...legL(40, 0, 55), ...legR(40, 0, 55), ...armsBack, ...torso(20, 0, 0), ...head(5, 0) });
  r.at(0.3, {
    heading: 0,
    pitch: 55,
    ...legL(55, 0, 5, 0, 35),
    ...legR(55, 0, 5, 0, 35),
    ...armL(100, 10, 10),
    ...armR(100, -10, 10),
    ...torso(10, 0, 10),
    ...head(-20, 10),
  });
  r.flight(0.3, 0.72, { travel: [0.1, 0.6] });
  r.at(0.42, { heading: 60, pitch: 85, ...legL(-20, 30, 10), ...legR(-10, -30, 10), ...armsWide, ...torso(-10, 0, 0), ...head(-30, 20) });
  r.at(0.55, { heading: 130, pitch: 85, ...legL(0, 10, 5), ...legR(0, -10, 5), ...armsWide, ...torso(-10, 0, 0), ...head(-30, 10) });
  r.at(0.65, { heading: 170, pitch: 55, ...legL(50, 5, 20), ...legR(50, -5, 20), ...armL(90, 60, 20), ...armR(90, -60, 20), ...torso(0, 0, 0), ...head(-10, 0) });
  r.at(0.72, { heading: 180, pitch: 20, ...legL(40, 0, 45), ...legR(40, 0, 45), ...armsWide, ...torso(20, 0, 0), ...head(0, 0) });
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
  r.at(uLand + 0.03, { ...legR(10, -15, 90, 0, -40) });
  settle(r, "R", uLand + 0.07, uLand + 0.13, { heading: headingAtTakeoff + 70, pitch: -360, twist: 360, roll: 0 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
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
    ...legL(-10, -35, 60, 0, -60),
    ...legR(30, -5, 45),
    ...armL(50, 20, 20),
    ...armR(50, -160, 20),
    ...torso(15, 0, -20),
    ...head(5, -10),
  });
  r.at(0.3, {
    heading: 80,
    ...legL(-20, -20, 55, 0, -60),
    ...legR(35, 0, 50),
    ...armL(120, 60, 15),
    ...armR(100, -120, 20),
    ...torso(5, 0, 10),
    ...head(0, 20),
  });
  r.at(0.38, {
    heading: 120,
    pitch: -20,
    ...legL(10, 10, 70, 0, -50),
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
  cheatStep(r, 0.4);
  r.at(0.28, {
    pitch: 0,
    heading: 165,
    ...legR(35, 0, 55),
    ...legL(45, 10, 85, 0, -40),
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
