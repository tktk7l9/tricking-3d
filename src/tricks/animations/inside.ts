import type * as THREE from "three";
import { Rig } from "../rig";
import { armL, armR, armsDown, armsTight, armsWide, head, legL, legR, legsAbsorb, torso } from "./poses";

/* Inside tricks (butterfly, aerial, masterswing families) for a left-twisting
 * tricker. Butterfly tricks take off from the left foot with the right leg
 * swinging first; the cartwheel/aerial travel to the left (+X). */

/** Shared butterfly wind-up: feet wide, wind to the right, swing left and dive
 * chest-down, pushing off the left foot at u=0.42 with the right leg behind. */
function butterflySetup(r: Rig) {
  r.start({ ...armsDown, heading: -10, ...legL(0, 25), ...legR(0, -25) });
  r.pin("L", 0, 0.42);
  r.at(0.18, {
    heading: -30,
    ...legL(35, 25, 45),
    ...legR(35, -25, 45),
    ...armL(60, 0, 20),
    ...armR(70, -130, 20),
    ...torso(25, 0, -35),
    ...head(10, -30),
  });
  r.at(0.3, {
    heading: 20,
    pitch: 30,
    ...legL(55, 30, 40),
    ...legR(-15, -25, 15),
    ...armL(40, 150, 20),
    ...armR(60, -20, 20),
    ...torso(35, 0, 20),
    ...head(-10, 20),
  });
  r.at(0.42, {
    heading: 70,
    pitch: 75,
    ...legL(80, 10, 10, 0, 35),
    ...legR(-25, -30, 10),
    ...armsWide,
    ...torso(5, 0, 10),
    ...head(-30, 20),
  });
}

/** Butterfly kick: horizontal flat spin, right leg then left leg swing up, land on the right foot. */
export function buildButterflyKick(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  butterflySetup(r);
  r.flight(0.42, 0.8, { travel: [0.4, 0.15] });
  r.at(0.52, {
    heading: 170,
    pitch: 80,
    ...legR(-30, -40, 10),
    ...legL(-10, 40, 10),
    ...armsWide,
    ...torso(-10, 0, 0),
    ...head(-30, 0),
  });
  r.at(0.62, {
    heading: 250,
    pitch: 75,
    ...legR(10, -25, 10),
    ...legL(-30, 35, 10),
    ...torso(-10, 0, 0),
  });
  r.at(0.72, {
    heading: 310,
    pitch: 50,
    ...legR(60, -10, 20),
    ...legL(0, 30, 10),
    ...torso(0, 0, 0),
    ...head(-10, 0),
  });
  r.at(0.8, {
    heading: 345,
    pitch: 25,
    ...legR(50, 0, 30),
    ...legL(-10, 30, 10),
    ...armL(60, 90, 20),
    ...armR(60, -90, 20),
    ...torso(20, 0, 0),
    ...head(0, 0),
  });
  r.pin("R", 0.8, 1);
  r.at(0.9, { heading: 355, pitch: 5, ...legL(10, 20, 30), ...legR(25, 0, 35), ...torso(10, 0, 0) });
  r.at(1, { heading: 360, pitch: 0, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
  return r.build("butterfly");
}

/** Butterfly twist: butterfly takeoff, 360° twist about the body's long axis
 * while horizontal, landing complete on the left (takeoff) foot. */
export function buildButterflyTwist(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  butterflySetup(r);
  r.flight(0.42, 0.8, { travel: [0.4, 0.15] });
  r.at(0.52, {
    heading: 150,
    pitch: 85,
    twist: 90,
    ...legR(-12, -8, 5),
    ...legL(-12, 8, 5),
    ...armsTight,
    ...torso(-5, 0, 0),
    ...head(-20, 30),
  });
  r.at(0.62, {
    heading: 215,
    pitch: 85,
    twist: 200,
    ...legR(-10, -5, 5),
    ...legL(-10, 5, 5),
    ...head(-20, 30),
  });
  r.at(0.7, {
    heading: 265,
    pitch: 80,
    twist: 290,
    ...legL(20, 10, 10),
    ...legR(-15, -10, 5),
    ...armL(80, 60, 40),
    ...armR(80, -60, 40),
    ...head(-20, 10),
  });
  r.at(0.8, {
    heading: 320,
    pitch: 30,
    twist: 360,
    ...legL(55, 10, 30),
    ...legR(-20, -20, 10),
    ...armsWide,
    ...torso(20, 0, 0),
    ...head(0, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(0.9, { heading: 345, pitch: 5, ...legR(10, -10, 30), ...legL(25, 5, 35), ...torso(10, 0, 0) });
  r.at(1, { heading: 360, pitch: 0, twist: 360, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
  return r.build("butterfly-twist");
}

/** Left cartwheel, side to side (travels toward +X): left foot, left hand,
 * right hand, right foot, left foot. */
export function buildCartwheel(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D, { hands: true });
  const up = { ...armL(165, 90, 5), ...armR(165, -90, 5) };
  r.start({ ...up, ...legL(0, 15), ...legR(0, -10), ...head(0, 0, 10) });
  r.pin("L", 0, 0.24);
  r.at(0.14, { roll: -25, ...legL(45, 80, 50), ...legR(0, -10, 5), ...torso(0, 15, 0), ...up });
  r.at(0.24, { roll: -65, ...legL(60, 85, 60, 0, 20), ...legR(40, -90, 5), ...torso(0, 20, 0), ...up });
  r.pin("handL", 0.24, 0.42);
  r.at(0.34, { roll: -110, ...legL(15, 85, 10), ...legR(10, -90, 0), ...torso(0, 10, 0), ...up });
  r.pin("handR", 0.42, 0.58);
  r.at(0.5, { roll: -190, ...legL(0, 85, 0), ...legR(0, -85, 0), ...torso(0, 0, 0), ...up });
  r.at(0.58, { roll: -250, ...legL(10, 85, 0), ...legR(15, -85, 5), ...torso(0, -10, 0), ...up });
  r.pin("R", 0.58, 0.78);
  r.at(0.68, { roll: -300, ...legL(20, 80, 10), ...legR(40, -70, 30), ...torso(0, -15, 0), ...up });
  r.at(0.78, { roll: -340, ...legL(30, 60, 30), ...legR(30, -50, 30), ...torso(0, -10, 0), ...up });
  r.pin("L", 0.78, 1);
  r.at(1, { roll: -360, ...legL(0, 15), ...legR(0, -15), ...torso(0, 0, 0), ...armsWide, ...head(0, 0, 0) });
  return r.build("cartwheel");
}

/** Aerial: no-handed left cartwheel. Takeoff from the left foot, right leg
 * kicks over first and lands first (hyper). */
export function buildAerial(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  const up = { ...armL(165, 90, 5), ...armR(165, -90, 5) };
  r.start({ ...armsDown, ...legL(0, 15), ...legR(0, -10), ...head(0, 0, 10) });
  r.pin("L", 0, 0.3);
  r.at(0.14, { roll: -15, ...legL(40, 70, 50), ...legR(-10, -10, 10), ...torso(10, 10, 0), ...armL(60, 60, 20), ...armR(50, -150, 20) });
  r.at(0.3, {
    roll: -55,
    ...legL(55, 80, 25, 0, 35),
    ...legR(35, -90, 10),
    ...torso(0, 15, 0),
    ...armL(150, 110, 10),
    ...armR(120, -60, 20),
    ...head(-10, 0, 20),
  });
  r.flight(0.3, 0.72, { travel: [0.9, 0] });
  r.at(0.42, { roll: -130, ...legL(10, 85, 10), ...legR(10, -90, 0), ...torso(0, 10, 0), ...up });
  r.at(0.52, { roll: -200, ...legL(0, 85, 0), ...legR(0, -85, 0), ...torso(0, 0, 0), ...up });
  r.at(0.62, { roll: -265, ...legL(10, 85, 5), ...legR(20, -85, 5), ...torso(0, -10, 0), ...armL(120, 90, 10), ...armR(120, -90, 10) });
  r.at(0.72, { roll: -310, ...legL(20, 80, 10), ...legR(45, -70, 35), ...torso(0, -15, 0), ...armsWide });
  r.pin("R", 0.72, 0.86);
  r.at(0.86, { roll: -345, ...legL(35, 55, 35), ...legR(30, -45, 35), ...torso(0, -10, 0) });
  r.pin("L", 0.86, 1);
  r.at(1, { roll: -360, ...legL(10, 15, 20), ...legR(10, -15, 20), ...torso(0, 0, 0), ...armsDown, ...head(0, 0, 0) });
  return r.build("aerial");
}

/** Scoot family: drop over the left hand, swing the right leg around, jump off
 * the right foot turning 180°, land on the left foot with the right leg behind.
 * The masterscoot uses both hands and goes more inverted. */
function buildScootLike(name: string, master: boolean): THREE.AnimationClip {
  const D = master ? 1.8 : 1.6;
  const r = new Rig(D, { hands: true });
  const inv = master ? 110 : 70; // peak forward pitch
  if (master) {
    // hyper landing stance: on the right foot, left leg in the air in front
    r.start({ ...armsDown, ...legR(5, -5, 10), ...legL(40, 10, 60), ...torso(5, 0, 0) });
    r.pin("R", 0, 0.42);
    r.at(0.16, { heading: 10, pitch: 10, ...legL(-30, 20, 30), ...legR(30, -5, 40), ...torso(20, 0, 0), ...armL(60, 60, 20), ...armR(60, -120, 20) });
  } else {
    r.start({ ...armsDown, ...legL(10, 10), ...legR(-10, -10) });
    r.pin("L", 0, 0.2);
    r.at(0.16, { heading: 15, pitch: 25, ...legL(70, 15, 90), ...legR(45, -10, 60), ...torso(25, 0, 0), ...armL(80, 20, 10), ...armR(50, -100, 20) });
    r.pin("R", 0.2, 0.42);
  }
  r.at(0.3, {
    heading: 40,
    pitch: 45,
    ...legL(master ? 20 : 95, 20, master ? 20 : 120),
    ...legR(60, -10, master ? 50 : 80),
    ...torso(master ? 20 : 45, 0, 10),
    ...armL(140, 20, 10),
    ...armR(master ? 130 : 80, -40, 10),
    ...head(-20, 20),
  });
  r.pin("handL", 0.42, 0.6);
  r.at(0.42, {
    heading: 90,
    pitch: inv - 20,
    ...legL(master ? -10 : 100, 25, master ? 10 : 130),
    ...legR(master ? 0 : 90, -20, master ? 10 : 110, 0, 30),
    ...torso(master ? 10 : 70, 0, 20),
    ...armL(165, 40, 5),
    ...armR(master ? 165 : 100, -60, 5),
    ...head(-25, 30),
  });
  if (master) r.pin("handR", 0.5, 0.62);
  r.at(0.54, {
    heading: 150,
    pitch: inv,
    ...legL(master ? -20 : 80, 30, master ? 10 : 90),
    ...legR(-30, -35, 10),
    ...torso(master ? 0 : 55, 0, 10),
    ...armL(165, 40, 5),
    ...armR(165, -50, 5),
    ...head(-30, 20),
  });
  r.at(0.66, {
    heading: 195,
    pitch: inv - 50,
    ...legL(50, 15, 30),
    ...legR(-35, -30, 20),
    ...torso(10, 0, 0),
    ...armL(100, 60, 20),
    ...armR(100, -60, 20),
    ...head(-15, 0),
  });
  r.pin("L", 0.7, 1);
  r.at(0.76, { heading: 205, pitch: 25, ...legL(40, 10, 40), ...legR(-30, -20, 30), ...torso(15, 0, 0), ...armsWide });
  r.at(1, { heading: 210, pitch: 0, ...legL(15, 5, 30), ...legR(-25, -10, 25), ...torso(5, 0, 0), ...armsDown, ...head(0, 0) });
  return r.build(name);
}

export const buildScoot = (): THREE.AnimationClip => buildScootLike("scoot", false);
export const buildMasterscoot = (): THREE.AnimationClip => buildScootLike("master-swing", true);
