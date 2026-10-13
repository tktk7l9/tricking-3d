import type * as THREE from "three";
import { Rig } from "../rig";
import { cheatStep, turnOnLeftFoot } from "./kicks";
import { armL, armR, armsDown, armsTight, armsWide, head, legL, legR, settle, torso } from "./poses";

/* Outside tricks (raiz, doubleleg, spyder) for a left-twisting tricker. */

/** Cheat-style step shared by raiz and spyder: pivot on the left foot while
 * the right foot steps around to backside (heading 180) and plants. */
function outsideStep(r: Rig) {
  cheatStep(r, 0.4);
  r.at(0.28, {
    pitch: 0,
    tilt: 0,
    spin: 0,
    roll: 0,
    twist: 0,
    heading: 160,
    ...legR(35, 0, 55),
    ...legL(0, 10, 80, 0, -40),
    ...armL(50, 120, 30),
    ...armR(55, -40, 30),
    ...torso(15, 0, 25),
    ...head(5, 40),
  });
}

/** Raiz: right-foot takeoff, left heel drives up behind, body lays back and
 * spins over an axis tilted ~55° from vertical, lands on the left foot. */
export function buildRaiz(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  outsideStep(r);
  r.at(0.4, {
    heading: 185,
    tilt: 55,
    spin: 0,
    ...legL(-40, 10, 20),
    ...legR(5, 0, 5, 0, 35),
    ...armL(60, 170, 10),
    ...armR(170, -60, 10),
    ...torso(-20, 0, 0),
    ...head(-20, 10),
  });
  r.flight(0.4, 0.82, { travel: [0.35, 0.35] });
  r.at(0.52, {
    heading: 230,
    spin: 110,
    ...legL(-45, 20, 15),
    ...legR(-10, -20, 10),
    ...armL(90, 160, 10),
    ...armR(170, -30, 10),
    ...torso(-25, 0, 0),
    ...head(-25, 0),
  });
  r.at(0.64, {
    heading: 280,
    spin: 210,
    ...legL(-20, 30, 10),
    ...legR(-30, -30, 10),
    ...armL(120, 120, 10),
    ...armR(140, -60, 10),
    ...torso(-20, 0, 0),
    ...head(-20, 0),
  });
  r.at(0.74, {
    heading: 320,
    spin: 300,
    ...legL(30, 15, 20),
    ...legR(-20, -20, 10),
    ...armsWide,
    ...torso(-10, 0, 0),
    ...head(-10, 0),
  });
  r.at(0.82, {
    heading: 345,
    spin: 360,
    ...legL(25, 10, 15),
    ...legR(-35, -10, 45),
    ...armsWide,
    ...torso(10, 0, 0),
    ...head(0, 0),
  });
  r.pin("L", 0.82, 1);
  settle(r, "R", 0.89, 0.95, { heading: 360 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("raiz");
}

/** Gumbi: the raiz with hands, an arched cartwheel to the other side. The right
 * hand plants as the right foot leaves, the arched body passes upside down over
 * the hands, the left hand plants, then the left foot and the right foot land. */
export function buildGumbi(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D, { hands: true });
  outsideStep(r);
  // The tilted spin starts only once the step has turned the back.
  r.at(0.28, { tilt: 55, spin: 0 });
  // Lean over the right foot and reach down; the left heel drives up behind.
  r.at(0.36, {
    heading: 180,
    tilt: 60,
    spin: 40,
    ...legL(-35, 10, 40),
    ...legR(15, 0, 35),
    ...armL(120, 120, 10),
    ...armR(37, -114, 0),
    ...torso(-5, 0, 0),
    ...head(-20, 10),
  });
  r.at(0.4, {
    heading: 190,
    spin: 70,
    ...legL(-50, 15, 70),
    ...legR(20, 0, 30, 0, 20),
    ...armR(67, -118, 0),
  });
  // The right hand takes the weight as the right foot leaves.
  r.pin("handR", 0.4, 0.52);
  r.at(0.44, {
    heading: 205,
    spin: 100,
    ...legL(-50, 20, 50),
    ...legR(5, -10, 10, 0, 35),
    ...armL(150, 120, 0),
    ...armR(98, -121, 0),
    ...torso(-20, 0, 0),
    ...head(-25, 10),
  });
  r.at(0.48, {
    heading: 225,
    spin: 140,
    ...legL(-40, 25, 20),
    ...legR(-20, -20, 10),
    ...armL(150, 160, 0),
    ...armR(127, -134, 0),
    ...torso(-25, 0, 0),
  });
  // Arched over both hands, the left hand reaching back over the head.
  r.pin("handL", 0.52, 0.655);
  r.at(0.52, {
    heading: 240,
    spin: 175,
    ...legL(-30, 25, 15),
    ...legR(-30, -25, 15),
    ...armL(145, 188, 0),
    ...armR(150, -160, 0),
    ...torso(-25, 0, 0),
    ...head(-25, 10),
  });
  r.at(0.56, { heading: 255, spin: 210, ...armL(135, 145, 0), ...armR(140, -90, 10) });
  r.at(0.6, {
    heading: 275,
    spin: 240,
    ...legL(0, 25, 20),
    ...legR(-40, -25, 90),
    ...armL(110, 127, 0),
    ...torso(-20, 0, 0),
  });
  r.pin("L", 0.655, 1);
  r.at(0.66, {
    heading: 300,
    spin: 290,
    ...legL(25, 15, 25),
    ...legR(-30, -25, 105),
    ...armL(90, 100, 20),
    ...armR(110, -70, 20),
    ...torso(-10, 0, 0),
  });
  r.at(0.74, {
    heading: 335,
    spin: 340,
    ...legL(25, 10, 30),
    ...legR(-25, -20, 70),
    ...armsWide,
    ...torso(0, 0, 0),
    ...head(-10, 0),
  });
  settle(r, "R", 0.82, 0.89, { heading: 360, spin: 360 });
  r.at(0.82, { ...torso(5, 0, 0), ...head(0, 0) });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("gumbi");
}

/** Sailor moon: a raiz whose right hand plants right before the right foot
 * leaves; the body tips over the hand into the raiz spin and lands on the left
 * foot like the raiz. */
export function buildSailorMoon(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D, { hands: true });
  outsideStep(r);
  // The tilted spin starts only once the step has turned the back.
  r.at(0.28, { tilt: 55, spin: 0 });
  // Lean over the right foot and reach down; the left heel drives up behind.
  r.at(0.36, {
    heading: 180,
    tilt: 55,
    spin: 40,
    ...legL(-35, 10, 40),
    ...legR(15, 0, 35),
    ...armL(60, 170, 10),
    ...armR(37, -114, 0),
    ...torso(-5, 0, 0),
    ...head(-20, 10),
  });
  r.at(0.4, {
    heading: 190,
    spin: 70,
    ...legL(-50, 15, 70),
    ...legR(25, 0, 50, 0, 20),
    ...armR(67, -118, 0),
  });
  // The right hand lands just before the right foot pushes off and carries the
  // body briefly; then it lets go and the raiz spin finishes in the air.
  r.pin("handR", 0.4, 0.47);
  r.at(0.44, {
    heading: 205,
    spin: 100,
    ...legL(-50, 20, 75),
    ...legR(5, -10, 10, 0, 35),
    ...armR(98, -121, 0),
    ...torso(-20, 0, 0),
    ...head(-25, 10),
  });
  r.at(0.47, { heading: 215, spin: 120, ...legL(-45, 20, 30), ...legR(-10, -15, 10), ...armR(120, -110, 10) });
  r.flight(0.47, 0.82, { travel: [0.3, 0.3] });
  r.at(0.56, {
    heading: 245,
    spin: 175,
    ...legL(-40, 20, 15),
    ...legR(-15, -20, 10),
    ...armL(90, 160, 10),
    ...armR(170, -30, 10),
    ...torso(-25, 0, 0),
    ...head(-25, 0),
  });
  r.at(0.64, {
    heading: 280,
    spin: 225,
    ...legL(-20, 30, 10),
    ...legR(-30, -30, 10),
    ...armL(120, 120, 10),
    ...armR(140, -60, 10),
    ...torso(-20, 0, 0),
    ...head(-20, 0),
  });
  r.at(0.74, {
    heading: 320,
    spin: 305,
    ...legL(30, 15, 20),
    ...legR(-20, -20, 10),
    ...armsWide,
    ...torso(-10, 0, 0),
    ...head(-10, 0),
  });
  // The spin is finished just before touchdown so the left foot comes straight down.
  r.at(0.795, { spin: 358, heading: 342 });
  r.at(0.82, {
    heading: 345,
    spin: 360,
    ...legL(25, 10, 15),
    ...legR(-35, -10, 45),
    ...armsWide,
    ...torso(10, 0, 0),
    ...head(0, 0),
  });
  r.pin("L", 0.82, 1);
  settle(r, "R", 0.89, 0.95, { heading: 360 });
  r.at(0.89, { ...torso(5, 0, 0) });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("sailor-moon");
}

/** Touchdown raiz: a low raiz that lands into a deep crouch on the left leg.
 * Near the end of the spin the torso folds forward and the left hand reaches
 * the floor just before the left foot; the right leg stays up behind, ready to
 * backswing into a gainer or cork, and the hand pushes the chest back up. */
export function buildTouchdownRaiz(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D, { hands: true });
  outsideStep(r);
  r.at(0.4, {
    heading: 185,
    tilt: 65,
    spin: 0,
    ...legL(-40, 10, 20),
    ...legR(5, 0, 5, 0, 35),
    ...armL(60, 170, 10),
    ...armR(170, -60, 10),
    ...torso(-20, 0, 0),
    ...head(-20, 10),
  });
  // Lower and shorter than the plain raiz: the flight ends when the hand meets
  // the floor, with the body already folding over it.
  r.flight(0.4, 0.72, { travel: [0.3, 0.3], apex: 0.35 });
  r.at(0.5, {
    heading: 230,
    spin: 115,
    ...legL(-45, 20, 15),
    ...legR(-10, -20, 10),
    ...armL(90, 160, 10),
    ...armR(170, -30, 10),
    ...torso(-25, 0, 0),
    ...head(-25, 0),
  });
  r.at(0.6, {
    heading: 280,
    spin: 220,
    ...legL(-20, 30, 10),
    ...legR(-25, -25, 30),
    ...armL(120, 120, 10),
    ...armR(140, -60, 10),
    ...torso(-15, 0, 0),
    ...head(-25, 20),
  });
  // Spotting the floor over the left shoulder, the arm reaches down.
  r.at(0.67, {
    heading: 315,
    spin: 300,
    pitch: 30,
    ...legL(10, 15, 90),
    ...legR(-25, -20, 90),
    ...armL(56, 70, 0),
    ...armR(120, -60, 20),
    ...torso(15, 0, 0),
    ...head(-25, 25),
  });
  r.at(0.72, {
    heading: 335,
    spin: 345,
    pitch: 65,
    ...legL(50, 10, 100),
    ...legR(-25, -15, 90),
    ...armL(89, 14, 0),
    ...armR(110, -60, 20),
    ...torso(25, 0, 0),
    ...head(-20, 20),
  });
  r.pin("handL", 0.72, 0.74);
  r.at(0.745, {
    heading: 337,
    spin: 347,
    pitch: 70,
    ...legL(95, 10, 115),
    ...legR(-27, -15, 80),
    ...armL(110, 22, 8),
    ...armR(100, -60, 25),
    ...torso(25, 0, 0),
    ...head(-20, 20),
  });
  r.pin("L", 0.74, 1);
  // Push: the planted arm straightens forward and lifts the hand off the floor.
  r.at(0.76, { ...armL(118, 30, 15) });
  // The hand pushes away and the chest comes back up over the planted foot.
  r.at(0.84, {
    heading: 352,
    spin: 360,
    pitch: 40,
    ...legL(70, 5, 80),
    ...legR(-30, -10, 55),
    ...armL(100, 60, 10),
    ...armR(70, -60, 30),
    ...torso(20, 0, 0),
    ...head(-5, 10),
  });
  r.at(0.92, { pitch: 15, ...legL(40, 5, 50), ...legR(-35, -10, 45), ...torso(15, 0, 0), ...head(0, 5) });
  r.at(1, {
    heading: 360,
    pitch: 0,
    ...legL(20, 5, 30),
    ...legR(-35, -10, 40),
    ...armL(60, 60, 20),
    ...armR(60, -60, 20),
    ...torso(15, 0, 0),
    ...head(0, 0),
  });
  return r.build("touchdown-raiz");
}

/** Sailor Moon Round: the Sailor Moon's right-hand plant and off-axis spin,
 * with a right-leg round kick as the body comes upright, then the left foot
 * lands with the kicking leg coming down after it. */
export function buildSailorMoonRound(): THREE.AnimationClip {
  const D = 1.9;
  const r = new Rig(D, { hands: true });
  outsideStep(r);
  r.at(0.28, { tilt: 55, spin: 0 });
  r.at(0.36, {
    heading: 180,
    tilt: 55,
    spin: 40,
    ...legL(-35, 10, 40),
    ...legR(15, 0, 35),
    ...armL(60, 170, 10),
    ...armR(37, -114, 0),
    ...torso(-5, 0, 0),
    ...head(-20, 10),
  });
  r.at(0.4, { heading: 190, spin: 70, ...legL(-50, 15, 70), ...legR(25, 0, 50, 0, 20), ...armR(67, -118, 0) });
  r.pin("handR", 0.4, 0.47);
  r.at(0.44, {
    heading: 205,
    spin: 100,
    ...legL(-50, 20, 75),
    ...legR(5, -10, 10, 0, 35),
    ...armR(98, -121, 0),
    ...torso(-20, 0, 0),
    ...head(-25, 10),
  });
  r.at(0.47, { heading: 215, spin: 120, ...legL(-45, 20, 30), ...legR(-10, -15, 10), ...armR(120, -110, 10) });
  r.flight(0.47, 0.84, { travel: [0.3, 0.3] });
  r.at(0.56, { heading: 245, spin: 175, ...legL(-40, 20, 15), ...legR(-15, -20, 10), ...armL(90, 160, 10), ...armR(170, -30, 10), ...torso(-25, 0, 0), ...head(-25, 0) });
  r.at(0.64, { heading: 280, spin: 225, ...legL(-20, 30, 10), ...legR(-30, -30, 10), ...armL(120, 120, 10), ...armR(140, -60, 10), ...torso(-20, 0, 0), ...head(-20, 0) });
  // Chamber, then the round kick at the target as the spin finishes.
  r.at(0.71, { heading: 315, spin: 300, ...legL(30, 15, 20), ...legR(60, -60, 120, 60), ...armL(80, 90, 40), ...armR(80, -60, 60), ...torso(-5, 5, 0), ...head(-10, 0) });
  r.at(0.77, { heading: 345, spin: 340, ...legL(35, 15, 30), ...legR(112, 5, 5, 70), ...armL(40, 130, 30), ...armR(60, -20, 70), ...torso(0, 15, -10), ...head(0, 0) });
  r.at(0.84, { heading: 365, spin: 360, ...legL(25, 8, 25), ...legR(50, -20, 80), ...armsWide, ...torso(8, 0, 0), ...head(0, 0) });
  r.pin("L", 0.84, 1);
  settle(r, "R", 0.9, 0.96, { heading: 372 });
  r.at(0.9, { ...torso(6, 0, 0) });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("sailor-moon-round");
}

/** Spyder Twist: the Spyder's step and flat, chest-down spin, with an extra
 * twist about the body's long axis (arms pulled in, as in the Butterfly Twist)
 * before the left foot lands. */
export function buildSpyderTwist(): THREE.AnimationClip {
  const D = 1.9;
  const r = new Rig(D);
  outsideStep(r);
  r.at(0.4, {
    heading: 230,
    pitch: 75,
    twist: 0,
    ...legR(80, -10, 10, 0, 35),
    ...legL(-25, 30, 10),
    ...armsWide,
    ...torso(5, 0, -10),
    ...head(-30, -20),
  });
  r.flight(0.4, 0.82, { travel: [-0.35, -0.3], apex: 0.55 });
  r.at(0.5, { heading: 320, pitch: 80, twist: 0, ...legL(-30, 40, 10), ...legR(-10, -40, 10), ...armsWide, ...torso(-10, 0, 0), ...head(-30, 0) });
  // The extra twist: legs together, arms pulled in.
  r.at(0.58, { heading: 375, pitch: 80, twist: 140, ...legL(-10, 8, 5), ...legR(-10, -8, 5), ...armsTight, ...torso(-5, 0, 0), ...head(-15, 0) });
  r.at(0.66, { heading: 420, pitch: 75, twist: 290, ...legL(-5, 8, 5), ...legR(-5, -8, 5), ...armsTight, ...torso(0, 0, 0), ...head(-10, 0) });
  r.at(0.74, { heading: 465, pitch: 55, twist: 360, ...legL(55, 10, 20), ...legR(0, -30, 10), ...armL(60, 90, 20), ...armR(60, -90, 20), ...torso(0, 0, 0), ...head(-10, 0) });
  r.at(0.82, { heading: 505, pitch: 25, twist: 360, ...legL(50, 0, 30), ...legR(-10, -30, 10), ...armL(60, 90, 20), ...armR(60, -90, 20), ...torso(20, 0, 0), ...head(0, 0) });
  r.pin("L", 0.82, 1);
  r.at(0.85, { ...legR(10, -15, 90, 0, -40) });
  settle(r, "R", 0.88, 0.94, { heading: 520, pitch: 0, twist: 360 });
  r.at(0.88, { ...torso(10, 0, 0) });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("spyder-twist");
}

/** Sideswipe: raiz takeoff with the left leg swung up straight, the body
 * inverts further than a raiz, then the right leg swipes over the top (round
 * kick) and the character lands on it (hyper). */
export function buildSideswipe(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  outsideStep(r);
  r.at(0.4, {
    heading: 190,
    tilt: 75,
    spin: 0,
    ...legL(-45, 15, 0),
    ...legR(5, 0, 5, 0, 35),
    ...armL(60, 170, 10),
    ...armR(170, -60, 10),
    ...torso(-25, 0, 0),
    ...head(-25, 10),
  });
  r.flight(0.4, 0.82, { travel: [0.3, 0.3], apex: 0.55 });
  r.at(0.52, {
    heading: 220,
    spin: 110,
    ...legL(-70, 20, 0),
    ...legR(-15, -15, 20),
    ...armL(100, 160, 10),
    ...armR(170, -40, 10),
    ...torso(-25, 0, 0),
    ...head(-25, 0),
  });
  r.at(0.62, {
    heading: 260,
    spin: 200,
    ...legL(-40, 20, 70),
    ...legR(35, -30, 40),
    ...armL(120, 120, 10),
    ...armR(140, -60, 10),
    ...torso(-15, 0, 0),
    ...head(-20, 0),
  });
  r.at(0.72, {
    heading: 310,
    spin: 290,
    ...legL(0, 25, 90),
    ...legR(110, -10, 5),
    ...armL(90, 90, 20),
    ...armR(90, -90, 20),
    ...torso(0, 0, 0),
    ...head(-10, 0),
  });
  r.at(0.82, {
    heading: 350,
    spin: 360,
    ...legR(20, -5, 15),
    ...legL(30, 20, 90),
    ...armsWide,
    ...torso(10, 0, 0),
    ...head(0, 0),
  });
  r.pin("R", 0.82, 1);
  // Finish the turn with the left foot still up, then set it down behind and hold.
  r.at(0.88, { heading: 365, ...legR(15, 0, 30), ...legL(15, 20, 75, 0, -30) });
  r.at(0.95, { heading: 365, ...legR(15, 0, 30), ...legL(-15, 10, 20) });
  r.at(1, { heading: 365, ...legR(15, 0, 30), ...legL(-15, 10, 20), ...armsDown, ...torso(5, 0, 0) });
  return r.build("sideswipe");
}

/** Doubleleg (armada dupla): two-foot takeoff, torso winds and lays back while
 * both legs, together and piked, swing around in a V; lands on both feet. */
export function buildDoubleleg(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 15), ...legR(0, -15) });
  r.pin("L", 0, 0.36);
  turnOnLeftFoot(r, 0, 90, 15);
  r.at(0.2, {
    heading: 90,
    ...legL(35, 15, 50),
    ...legR(35, -15, 50),
    ...armL(45, 10, 20),
    ...armR(60, -140, 20),
    ...torso(15, 0, -35),
    ...head(5, -20),
  });
  r.at(0.36, {
    heading: 95,
    tilt: 25,
    spin: 0,
    ...legL(0, 15, 5, 0, 35),
    ...legR(0, -15, 5, 0, 35),
    ...armL(150, 90, 10),
    ...armR(130, -30, 20),
    ...torso(-10, 0, 35),
    ...head(-10, 40),
  });
  r.flight(0.36, 0.78, { travel: [0.1, 0.1] });
  r.at(0.48, {
    heading: 170,
    spin: 110,
    ...legL(75, 5, 10),
    ...legR(75, -5, 10),
    ...armL(110, 60, 10),
    ...armR(110, -60, 10),
    ...torso(10, 0, 20),
    ...head(-10, 20),
  });
  r.at(0.58, {
    heading: 230,
    spin: 200,
    ...legL(100, 5, 5),
    ...legR(100, -5, 5),
    ...armL(100, 20, 10),
    ...armR(100, -20, 10),
    ...torso(20, 0, 10),
    ...head(0, 10),
  });
  r.at(0.68, {
    heading: 290,
    spin: 290,
    ...legL(70, 5, 10),
    ...legR(70, -5, 10),
    ...armsWide,
    ...torso(10, 0, 0),
  });
  r.at(0.78, {
    heading: 360,
    spin: 360,
    ...legL(30, 10, 40),
    ...legR(30, -10, 40),
    ...armsWide,
    ...torso(15, 0, 0),
    ...head(5, 0),
  });
  r.pin("L", 0.78, 1);
  // Both feet are down: keep their spacing and only soften the knees.
  r.at(1, { heading: 360, ...legL(30, 10, 45), ...legR(30, -10, 45), ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("double-leg");
}

/** Doubleleg Twist: the Doubleleg's takeoff and V, then the legs come down,
 * the arms wrap in for an extra twist, and it lands in complete (left foot). */
export function buildDoublelegTwist(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 15), ...legR(0, -15) });
  r.pin("L", 0, 0.34);
  turnOnLeftFoot(r, 0, 90, 15);
  r.at(0.18, {
    heading: 90,
    ...legL(35, 15, 50),
    ...legR(35, -15, 50),
    ...armL(45, 10, 20),
    ...armR(60, -140, 20),
    ...torso(15, 0, -35),
    ...head(5, -20),
  });
  r.at(0.34, {
    heading: 95,
    tilt: 25,
    spin: 0,
    twist: 0,
    ...legL(0, 15, 5, 0, 35),
    ...legR(0, -15, 5, 0, 35),
    ...armL(150, 90, 10),
    ...armR(130, -30, 20),
    ...torso(-10, 0, 35),
    ...head(-10, 40),
  });
  r.flight(0.34, 0.82, { travel: [0.1, 0.1], apex: 0.55 });
  r.at(0.44, {
    heading: 170,
    spin: 110,
    ...legL(75, 5, 10),
    ...legR(75, -5, 10),
    ...armL(110, 60, 10),
    ...armR(110, -60, 10),
    ...torso(10, 0, 20),
    ...head(-10, 20),
  });
  r.at(0.53, {
    heading: 230,
    spin: 200,
    twist: 0,
    ...legL(100, 5, 5),
    ...legR(100, -5, 5),
    ...armL(100, 20, 10),
    ...armR(100, -20, 10),
    ...torso(20, 0, 10),
    ...head(0, 10),
  });
  r.at(0.62, {
    heading: 290,
    spin: 290,
    twist: 150,
    ...legL(40, 5, 10),
    ...legR(40, -5, 10),
    ...armsTight,
    ...torso(5, 0, 0),
    ...head(0, 30),
  });
  r.at(0.72, {
    heading: 340,
    spin: 340,
    twist: 300,
    ...legL(20, 5, 15),
    ...legR(25, -5, 15),
    ...armsTight,
    ...torso(5, 0, 0),
    ...head(0, 20),
  });
  r.at(0.82, {
    heading: 360,
    spin: 360,
    twist: 360,
    ...legL(30, 10, 40),
    ...legR(55, -10, 50),
    ...armsWide,
    ...torso(15, 0, 0),
    ...head(5, 0),
  });
  r.pin("L", 0.82, 1);
  settle(r, "R", 0.87, 0.93, { heading: 360 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("doubleleg-twist");
}

/** Spyder: raiz-style step, then a chest-down flat spin like a butterfly kick
 * (left leg leads up behind, takeoff from the right foot, land on the left). */
export function buildSpyder(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  outsideStep(r);
  r.at(0.4, {
    heading: 230,
    pitch: 75,
    ...legR(80, -10, 10, 0, 35),
    ...legL(-25, 30, 10),
    ...armsWide,
    ...torso(5, 0, -10),
    ...head(-30, -20),
  });
  r.flight(0.4, 0.8, { travel: [-0.35, -0.3] });
  r.at(0.52, {
    heading: 330,
    pitch: 80,
    ...legL(-30, 40, 10),
    ...legR(-10, -40, 10),
    ...armsWide,
    ...torso(-10, 0, 0),
    ...head(-30, 0),
  });
  r.at(0.62, {
    heading: 410,
    pitch: 75,
    ...legL(10, 25, 10),
    ...legR(-30, -35, 10),
    ...torso(-10, 0, 0),
  });
  r.at(0.72, {
    heading: 470,
    pitch: 50,
    ...legL(60, 10, 20),
    ...legR(0, -30, 10),
    ...torso(0, 0, 0),
    ...head(-10, 0),
  });
  r.at(0.8, {
    heading: 505,
    pitch: 25,
    ...legL(50, 0, 30),
    ...legR(-10, -30, 10),
    ...armL(60, 90, 20),
    ...armR(60, -90, 20),
    ...torso(20, 0, 0),
    ...head(0, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(0.835, { ...legR(10, -15, 90, 0, -40) });
  settle(r, "R", 0.87, 0.93, { heading: 520, pitch: 0 });
  r.at(0.87, { ...torso(10, 0, 0) });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("spider");
}

/** Side flip: two-footed takeoff with the arms thrown up and across, a tucked
 * flip to the left side (about the forward axis), landing on both feet. */
export function buildSideFlip(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D);
  const squat = { ...legL(22, 8, 45, 0, -23), ...legR(22, -8, 45, 0, -23) };
  const land = { ...legL(25, 8, 40), ...legR(25, -8, 40) };
  r.start({ ...armsDown, ...legL(0, 8), ...legR(0, -8) });
  r.pin("L", 0, 0.31);
  r.at(0.16, { ...squat, ...armL(40, 130, 20), ...armR(70, -30, 30), ...torso(15, -10, 0), ...head(0, 0, 10) });
  r.at(0.31, { roll: -10, ...legL(0, 8, 5, 0, 35), ...legR(0, -8, 5, 0, 35), ...armL(160, 60, 10), ...armR(170, -60, 10), ...torso(-5, 10, 0), ...head(-10, 0, -15) });
  r.flight(0.31, 0.8, { travel: [0.4, 0] });
  r.at(0.42, { roll: -100, ...legL(90, 5, 110), ...legR(90, -5, 110), ...armsTight, ...torso(20, 15, 0), ...head(10, 0, -25) });
  r.at(0.5, { roll: -180, ...legL(120, 5, 130), ...legR(120, -5, 130), ...armsTight, ...torso(30, 20, 0), ...head(20, 0, -35) });
  r.at(0.62, { roll: -265, ...legL(110, 5, 120), ...legR(110, -5, 120), ...armsTight, ...torso(25, 10, 0), ...head(10, 0, -20) });
  r.at(0.72, { roll: -325, ...legL(45, 8, 45), ...legR(45, -8, 45), ...armsWide, ...torso(10, 5, 0), ...head(0, 0, -5) });
  r.at(0.8, { roll: -360, ...land, ...armsWide, ...torso(10, 0, 0), ...head(0, 0, 0) });
  r.pin("L", 0.8, 1);
  r.at(1, { roll: -360, ...land, ...armsDown, ...torso(5, 0, 0), ...head(0, 0, 0) });
  return r.build("side-flip");
}
