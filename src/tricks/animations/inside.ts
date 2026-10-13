import type * as THREE from "three";
import { Rig } from "../rig";
import { armL, armR, armsDown, armsTight, armsWide, head, legL, legR, legsAbsorb, settle, torso } from "./poses";

/* Inside tricks (butterfly, aerial, masterswing families) for a left-twisting
 * tricker. Butterfly tricks take off from the left foot with the right leg
 * swinging first; the cartwheel/aerial travel to the left (+X). */

/** Shared butterfly wind-up: feet wide, wind to the right, swing left and dive
 * chest-down, pushing off the left foot at u=0.42 with the right leg behind. */
function butterflySetup(r: Rig) {
  r.start({ ...armsDown, heading: -10, ...legL(0, 25), ...legR(0, -25) });
  r.pin("L", 0, 0.42);
  // Wind up with the torso while both feet stay where they are, then lift the
  // right foot straight up before the body turns on the left foot.
  r.at(0.18, {
    heading: -10,
    ...legL(22, 25, 45, 0, -23),
    ...legR(22, -25, 45, 0, -23),
    ...armL(60, 0, 20),
    ...armR(70, -130, 20),
    ...torso(25, 0, -35),
    ...head(10, -30),
  });
  // Hold the crouch a moment so both legs move alike while both feet are down.
  r.at(0.2, { heading: -10, ...legL(22, 25, 45, 0, -23), ...legR(22, -25, 45, 0, -23) });
  r.at(0.24, { heading: -10, pitch: 0, twist: 0, ...legR(42, -25, 85, 0, -43) });
  r.at(0.3, {
    heading: 20,
    pitch: 30,
    ...legL(55, 30, 40),
    ...legR(-15, -25, 40, 0, -20),
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
  // The trailing left leg folds as it swings in under the body.
  r.at(0.84, { ...legL(10, 15, 90, 0, -40) });
  settle(r, "L", 0.88, 0.94, { heading: 360, pitch: 0 });
  r.at(0.88, { ...torso(10, 0, 0) });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("butterfly");
}

/** Butterfly Kick Switch: the butterfly kick's takeoff and flat swing, but the
 * legs switch in the air so the left leg comes down first and lands in
 * complete while the right leg stays up behind. */
export function buildButterflyKickSwitch(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  butterflySetup(r);
  r.flight(0.42, 0.8, { travel: [0.4, 0.15] });
  r.at(0.52, { heading: 170, pitch: 80, ...legR(-30, -40, 10), ...legL(-10, 40, 10), ...armsWide, ...torso(-10, 0, 0), ...head(-30, 0) });
  r.at(0.62, { heading: 250, pitch: 75, ...legR(10, -25, 10), ...legL(-30, 35, 10), ...torso(-10, 0, 0) });
  // The switch: the right leg swings back up while the left leg comes through.
  r.at(0.71, { heading: 305, pitch: 55, ...legR(-25, -25, 15), ...legL(35, 20, 20), ...torso(0, 0, 0), ...head(-10, 0) });
  r.at(0.8, {
    heading: 345,
    pitch: 25,
    ...legL(45, 0, 30),
    ...legR(-25, -30, 35),
    ...armL(60, 90, 20),
    ...armR(60, -90, 20),
    ...torso(20, 0, 0),
    ...head(0, 0),
  });
  r.pin("L", 0.8, 1);
  r.at(0.9, { heading: 355, pitch: 5, ...legL(25, 0, 35), ...legR(-25, -25, 40), ...torso(10, 0, 0) });
  r.at(1, { heading: 360, pitch: 0, ...legL(20, 0, 35), ...legR(-25, -20, 45), ...armsDown, ...torso(5, 0, 0) });
  return r.build("butterfly-kick-switch");
}

/** Butterfly twist: butterfly takeoff, 360° twist about the body's long axis
 * while horizontal, landing complete on the left (takeoff) foot. */
export function buildButterflyTwist(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  butterflySetup(r);
  r.at(0.42, { twist: 0 });
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
  r.at(0.84, { ...legR(10, -15, 90, 0, -40) });
  settle(r, "R", 0.88, 0.94, { heading: 360, pitch: 0, twist: 360 });
  r.at(0.88, { ...torso(10, 0, 0) });
  r.at(1, { ...armsDown, ...torso(5, 0, 0) });
  return r.build("butterfly-twist");
}

/** Cartwheel entry shared by the cartwheel, one-handed cartwheel and
 * roundoff: the right foot holds the weight while the left foot lifts and
 * steps out to the side, then the body leans onto the left foot (pinned until
 * the left hand takes over) and the right foot comes up. */
function cartwheelEntry(r: Rig) {
  r.pin("R", 0, 0.13);
  r.at(0.03, { roll: 0, ...legL(20, 40, 40, 0, -20), ...legR(0, -10) });
  r.at(0.09, { roll: -6, ...legL(40, 80, 35, 0, -5) });
  r.at(0.13, { roll: -12, ...legL(45, 80, 45), ...legR(0, -10, 0) });
  r.pin("L", 0.13, 0.3);
}

/** Left cartwheel, side to side (travels toward +X): left foot, left hand,
 * right hand, right foot, left foot. */
export function buildCartwheel(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D, { hands: true });
  const up = { ...armL(165, 90, 5), ...armR(165, -90, 5) };
  r.start({ ...up, ...legL(0, 15), ...legR(0, -10), ...head(0, 0, 10) });
  cartwheelEntry(r);
  r.at(0.14, { roll: -25, ...legL(45, 80, 50), ...legR(0, -10, 5), ...torso(0, 15, 0), ...up });
  r.at(0.24, { roll: -65, ...legL(60, 85, 60, 0, 20), ...legR(40, -90, 5), ...torso(0, 20, 0), ...up });
  r.pin("handL", 0.3, 0.48);
  r.at(0.34, { roll: -110, ...legL(15, 85, 10), ...legR(10, -90, 0), ...torso(0, 10, 0), ...up });
  r.pin("handR", 0.48, 0.615);
  r.at(0.5, { roll: -190, ...legL(0, 85, 0), ...legR(0, -85, 0), ...torso(0, 0, 0), ...up });
  r.at(0.58, { roll: -250, ...legL(10, 85, 0), ...legR(15, -85, 5), ...torso(0, -10, 0), ...up });
  r.pin("R", 0.615, 0.93);
  r.at(0.68, { roll: -300, ...legL(20, 80, 10), ...legR(40, -70, 30), ...torso(0, -15, 0), ...up });
  r.at(0.78, { roll: -340, ...legL(30, 60, 30), ...legR(30, -50, 30), ...torso(0, -10, 0), ...up });
  // The left foot comes down in the final stance, so neither foot slides once both are down.
  r.at(0.88, { roll: -358, ...legL(20, 15, 40, 0, -20), ...legR(0, -15), ...torso(0, -4, 0) });
  r.at(0.93, { roll: -360, ...legL(0, 15), ...legR(0, -15), ...torso(0, 0, 0) });
  r.pin("L", 0.93, 1);
  r.at(1, { roll: -360, ...legL(0, 15), ...legR(0, -15), ...torso(0, 0, 0), ...armsWide, ...head(0, 0, 0) });
  return r.build("cartwheel");
}

/** One-Handed Cartwheel: a cartwheel on the hand nearer the floor only (the
 * left, cartwheeling to the left). The legs straddle wide so the right foot
 * reaches the floor soon after the handstand, while the left hand still holds
 * the body up, and the right arm reaches forward, out of the cartwheel's
 * plane, so it never touches the floor. */
export function buildOneHandedCartwheel(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D, { hands: true });
  const left = armL(165, 90, 5);
  const free = armR(90, 0, 10);
  r.start({ ...left, ...armR(165, -90, 5), ...legL(0, 15), ...legR(0, -10), ...head(0, 0, 10) });
  cartwheelEntry(r);
  r.at(0.14, { roll: -25, ...legL(45, 80, 50), ...legR(0, -10, 5), ...torso(0, 15, 0), ...left, ...armR(150, -95, 10) });
  r.at(0.26, { roll: -65, ...legL(60, 85, 60, 0, 20), ...legR(40, -90, 5), ...torso(0, 20, 0), ...left, ...armR(100, -40, 20) });
  r.at(0.3, { roll: -90 });
  r.at(0.34, { roll: -103 });
  r.pin("handL", 0.3, 0.55);
  r.at(0.36, { roll: -115, ...legL(30, 85, 10), ...legR(30, -90, 0), ...torso(0, 10, 0), ...armL(170, 90, 0), ...free });
  r.at(0.45, { roll: -175, ...legL(55, 85, 0), ...legR(75, -85, 0), ...torso(0, 0, 0), ...armL(170, 90, 0), ...free });
  r.at(0.52, { roll: -205, ...legL(35, 85, 0), ...legR(105, -85, 5), ...torso(0, -15, 0), ...left, ...free });
  r.pin("R", 0.55, 1);
  r.at(0.66, { roll: -290, ...legL(25, 80, 10), ...legR(50, -70, 25), ...torso(0, -15, 0), ...armL(150, 90, 10), ...armR(95, -40, 20) });
  r.at(0.8, { roll: -345, ...legL(20, 50, 20), ...legR(16, -40, 20), ...torso(0, -8, 0), ...armL(140, 90, 10), ...armR(120, -90, 10) });
  // The left foot comes down in the final stance, so nothing slides once both feet are down.
  r.at(0.9, { roll: -360, ...legL(10, 35, 15), ...legR(10, -30, 15), ...torso(0, 0, 0) });
  r.at(1, { roll: -360, ...legL(10, 35, 15), ...legR(10, -30, 15), ...torso(0, 0, 0), ...armsWide, ...head(0, 0, 0) });
  return r.build("one-handed-cartwheel");
}

/** Roundoff: the cartwheel's entry (left foot, left hand, right hand), but
 * the legs meet over the top while the body turns a quarter on the hands,
 * then it pushes off and both feet land together, facing back the way it
 * came (-X, the cartwheel travels to +X). */
export function buildRoundoff(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D, { hands: true });
  const up = { ...armL(165, 90, 5), ...armR(165, -90, 5) };
  r.start({ ...up, ...legL(0, 15), ...legR(0, -10), ...head(0, 0, 10) });
  cartwheelEntry(r);
  r.at(0.14, { roll: -25, ...legL(45, 80, 50), ...legR(0, -10, 5), ...torso(0, 15, 0), ...up });
  r.at(0.24, { roll: -65, ...legL(60, 85, 60, 0, 20), ...legR(40, -90, 5), ...torso(0, 20, 0), ...up });
  r.pin("handL", 0.3, 0.46);
  r.at(0.36, { roll: -115, twist: 0, ...legL(15, 85, 10), ...legR(10, -90, 0), ...torso(0, 10, 0), ...up });
  r.pin("handR", 0.46, 0.53);
  // Legs meet over the top while the body turns a quarter on the hands.
  r.at(0.46, { roll: -175, twist: -25, ...legL(0, 30, 0), ...legR(0, -30, 0), ...torso(0, 0, 0), ...armL(150, 90, 5), ...armR(165, -90, 5) });
  r.at(0.53, { roll: -212, twist: -90, ...legL(5, 8, 0), ...legR(5, -8, 0), ...torso(0, 0, 0), ...armL(155, 90, 5), ...armR(165, -90, 5) });
  // Snap down: off the hands the legs whip down while the hips drop, and both
  // feet land together just in front of the hips with the chest up. The thigh
  // direction in the cartwheel plane is roll minus hip flexion; holding it
  // over the last frames lets the feet come straight down instead of skidding.
  r.flight(0.53, 0.65, { travel: [0.04, 0] });
  r.at(0.58, { roll: -268, twist: -90, ...legL(50, 0, 30), ...legR(50, 0, 30), ...torso(10, 0, 0), ...up, ...head(10, 0, 0) });
  r.at(0.62, { roll: -322, twist: -90, ...legL(40, 0, 28), ...legR(40, 0, 28), ...torso(8, 0, 0), ...up, ...head(5, 0, 0) });
  r.at(0.65, {
    roll: -342,
    twist: -90,
    ...legL(20, 0, 28),
    ...legR(20, 0, 28),
    ...torso(5, 0, 0),
    ...armL(160, 90, 5),
    ...armR(160, -90, 5),
    ...head(5, 0, 0),
  });
  r.pin("L", 0.65, 1);
  r.at(0.73, { roll: -357, twist: -90, ...legL(26, 0, 45), ...legR(26, 0, 45), ...torso(5, 0, 0), ...armL(150, 80, 5), ...armR(150, -80, 5) });
  r.at(0.86, { roll: -360, twist: -90, ...legL(32, 0, 55), ...legR(32, 0, 55), ...torso(10, 0, 0), ...armL(120, 70, 10), ...armR(120, -70, 10), ...head(0, 0, 0) });
  r.at(1, { roll: -360, twist: -90, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
  return r.build("roundoff");
}

/** Aerial: no-handed left cartwheel. Takeoff from the left foot, right leg
 * kicks over first and lands first (hyper). */
export function buildAerial(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  const up = { ...armL(165, 90, 5), ...armR(165, -90, 5) };
  r.start({ ...armsDown, ...legL(0, 15), ...legR(0, -10), ...head(0, 0, 10) });
  cartwheelEntry(r);
  // Both feet hold still while the weight moves onto the left foot, then the right foot lifts.
  r.at(0.145, { roll: -12, ...legL(45, 80, 45), ...legR(0, -10, 0) });
  r.at(0.17, { roll: -15, ...legL(45, 80, 50), ...legR(17, -10, 35, 0, -18), ...torso(10, 10, 0), ...armL(60, 60, 20), ...armR(50, -150, 20) });
  r.at(0.3, {
    roll: -55,
    ...legL(55, 80, 25, 0, 35),
    ...legR(35, -90, 10),
    ...torso(0, 15, 0),
    ...armL(150, 110, 10),
    ...armR(120, -60, 20),
    ...head(-10, 0, 20),
  });
  // The roll eases through takeoff so the pushing foot leaves the floor cleanly.
  r.at(0.31, { roll: -57 });
  r.flight(0.3, 0.72, { travel: [0.9, 0] });
  r.at(0.42, { roll: -130, ...legL(10, 85, 10), ...legR(10, -90, 0), ...torso(0, 10, 0), ...up });
  r.at(0.52, { roll: -200, ...legL(0, 85, 0), ...legR(0, -85, 0), ...torso(0, 0, 0), ...up });
  r.at(0.62, { roll: -265, ...legL(10, 85, 5), ...legR(20, -85, 5), ...torso(0, -10, 0), ...armL(120, 90, 10), ...armR(120, -90, 10) });
  r.at(0.72, { roll: -310, ...legL(20, 80, 10), ...legR(45, -70, 35), ...torso(0, -15, 0), ...armsWide });
  r.pin("R", 0.72, 0.96);
  r.at(0.86, { roll: -345, ...legL(35, 55, 35), ...legR(30, -45, 35), ...torso(0, -10, 0) });
  // The left foot comes down in the final stance, so neither foot slides once both are down.
  r.at(0.92, { roll: -358, ...legL(25, 15, 50, 0, -25), ...legR(10, -15, 20), ...torso(0, -4, 0) });
  r.at(0.96, { roll: -360, ...legL(10, 15, 20), ...legR(10, -15, 20), ...torso(0, 0, 0) });
  r.pin("L", 0.96, 1);
  r.at(1, { roll: -360, ...legL(10, 15, 20), ...legR(10, -15, 20), ...torso(0, 0, 0), ...armsDown, ...head(0, 0, 0) });
  return r.build("aerial");
}

/** Aerial twist: the aerial's takeoff and side-to-side rotation with a full
 * left twist about the body's long axis while upside down (an inverted
 * butterfly twist); arms and legs pull in to twist, and the left foot lands
 * first (complete). */
export function buildAerialTwist(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 15), ...legR(0, -10), ...head(0, 0, 10) });
  cartwheelEntry(r);
  // Both feet hold still while the weight moves onto the left foot, then the right foot lifts.
  r.at(0.145, { roll: -12, ...legL(45, 80, 45), ...legR(0, -10, 0) });
  r.at(0.17, { roll: -15, ...legL(45, 80, 50), ...legR(17, -10, 35, 0, -18), ...torso(10, 10, 0), ...armL(60, 60, 20), ...armR(50, -150, 20) });
  r.at(0.3, {
    roll: -55,
    twist: 0,
    ...legL(55, 80, 25, 0, 35),
    ...legR(35, -90, 10),
    ...torso(0, 15, 0),
    ...armL(150, 110, 10),
    ...armR(120, -60, 20),
    ...head(-10, 0, 20),
  });
  r.flight(0.3, 0.74, { travel: [0.9, 0] });
  r.at(0.4, { roll: -125, twist: 30, ...legL(10, 50, 10), ...legR(10, -50, 0), ...torso(0, 5, 0), ...armsTight, ...head(-10, 20, 0) });
  r.at(0.48, { roll: -185, twist: 150, ...legL(0, 8, 0), ...legR(0, -8, 0), ...torso(0, 0, 0), ...armsTight, ...head(-10, 20, 0) });
  r.at(0.56, { roll: -235, twist: 270, ...legL(0, 8, 0), ...legR(0, -8, 0), ...armsTight, ...head(-10, 20, 0) });
  // The twist ends early and the roll comes almost upright before touchdown,
  // so the straight left leg reaches the floor while the right knee stays up.
  r.at(0.64, { roll: -290, twist: 350, ...legL(15, 25, 10), ...legR(20, -40, 40), ...armL(90, 90, 20), ...armR(90, -90, 20), ...head(-5, 0, 0) });
  r.at(0.74, { roll: -345, twist: 360, ...legL(15, 20, 15), ...legR(45, -45, 100), ...torso(0, -5, 0), ...armsWide, ...head(0, 0, 0) });
  r.pin("L", 0.74, 1);
  settle(r, "R", 0.84, 0.91, { roll: -360, twist: 360 }, 12);
  r.at(0.84, { ...torso(0, 0, 0) });
  r.at(1, { ...torso(0, 0, 0), ...armsDown, ...head(0, 0, 0) });
  return r.build("aerial-twist");
}

/** Scoot timing (normalized): the body tips forward from `dive` to `hand`, the
 * left hand takes the weight from the right foot at `push`, and the left foot lands at `land`. */
const SCOOT = { dive: 0.43, push: 0.44, hand: 0.47, land: 0.515 };

/** Scoot: crouch on the right leg, drop onto the left hand, push off the
 * right foot and swing the right leg around while turning 180° over the hand,
 * then land on the left foot with the right leg behind. Each pin starts when
 * that hand or foot actually reaches the floor, so nothing slides. */
export function buildScoot(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D, { hands: true });
  r.start({ ...armsDown, ...legL(10, 10), ...legR(-10, -10) });
  r.pin("R", 0, SCOOT.push);
  // The left foot lifts straight up before the right leg starts to bend.
  r.at(0.03, { heading: 0, pitch: 0, ...legL(31.6, 10, 41.7, 0, -20), ...legR(-10, -10) });
  r.at(0.07, { ...legL(45, 12, 60), ...legR(15, -10, 20) });
  r.at(0.16, { heading: 15, pitch: 25, ...legL(65, 15, 85), ...legR(45, -10, 60), ...torso(25, 0, 0), ...armL(80, 20, 10), ...armR(50, -100, 20) });
  r.at(0.3, { heading: 40, pitch: 45, ...legL(110, 20, 130), ...legR(55, -10, 80), ...torso(45, 0, 10), ...armL(150, 30, 5), ...armR(70, -100, 20), ...head(-20, 20) });
  r.at(0.42, { heading: 85, pitch: 70, ...legL(125, 25, 140), ...legR(70, -20, 95, 0, 30), ...torso(60, 0, 20), ...armL(175, 40, 0), ...armR(60, -110, 25), ...head(-25, 30) });
  // Only the body tipping forward moves between DIVE and HAND: the hand comes
  // straight down while the pushing foot is planted, takes the weight, and the
  // same tip then lifts the foot off; the turn speeds up only after that.
  const still = { heading: 88, ...legR(55, -22, 80, 0, 35), ...torso(58, 0, 18), ...armL(175, 42, 0) };
  r.at(SCOOT.dive, { ...still, pitch: 71 });
  r.at(SCOOT.hand, { ...still, pitch: 76 });
  r.pin("handL", SCOOT.push, SCOOT.land);
  r.at(0.5, { heading: 130, pitch: 76, ...legL(125, 30, 140), ...legR(15, -30, 40, 0, 30), ...torso(55, 0, 15), ...armL(175, 45, 0), ...armR(70, -110, 25), ...head(-30, 20) });
  r.at(0.58, { heading: 175, pitch: 50, ...legL(75, 25, 60), ...legR(-30, -35, 10), ...torso(30, 0, 10), ...armL(160, 55, 5), ...armR(85, -90, 20), ...head(-20, 10) });
  r.at(0.64, { heading: 198, pitch: 25, ...legL(45, 15, 35), ...legR(-35, -30, 20), ...torso(15, 0, 0), ...armL(100, 60, 20), ...armR(100, -60, 20), ...head(-15, 0) });
  r.pin("L", SCOOT.land, 1);
  r.at(0.76, { heading: 205, pitch: 20, ...legL(40, 10, 40), ...legR(-30, -20, 30), ...torso(15, 0, 0), ...armsWide });
  r.at(1, { heading: 210, pitch: 0, ...legL(15, 5, 30), ...legR(-25, -10, 25), ...torso(5, 0, 0), ...armsDown, ...head(0, 0) });
  return r.build("scoot");
}


/** When the masterscoot's hands go down, its right foot leaves and its left foot lands (normalized time). */
const MASTER = { push: 0.375, second: 0.485, land: 0.58 };

/** Masterscoot: from the hyper landing (right foot down, left leg in front)
 * the left leg swings back, the left hand and then the right hand go down and
 * the body passes more inverted than in the scoot, like a cartwheel, before the
 * left foot lands with the right leg behind. */
export function buildMasterscoot(): THREE.AnimationClip {
  const D = 1.8;
  const r = new Rig(D, { hands: true });
  r.start({ ...armsDown, ...legR(5, -5, 10), ...legL(40, 10, 60), ...torso(5, 0, 0) });
  r.pin("R", 0, MASTER.push);
  r.at(0.08, { ...legL(10, 15, 75) });
  r.at(0.16, { heading: 10, pitch: 10, ...legL(-30, 20, 40), ...legR(30, -5, 40), ...torso(20, 0, 0), ...armL(60, 60, 20), ...armR(60, -120, 20) });
  r.at(0.3, { heading: 35, pitch: 45, ...legL(-30, 20, 20), ...legR(50, -10, 65), ...torso(20, 0, 0), ...armL(150, 0, 5), ...armR(80, -90, 20), ...head(-20, 20) });
  r.at(0.4, { heading: 75, pitch: 80, ...legL(-40, 25, 15), ...legR(70, -15, 95, 0, 30), ...torso(15, 0, 0), ...armL(85, 0, 0), ...armR(40, -90, 20), ...head(-25, 30) });
  r.pin("handL", MASTER.push, MASTER.second);
  r.at(0.46, { heading: 105, pitch: 95, ...legL(-30, 28, 10), ...legR(30, -25, 40, 0, 30), ...torso(5, 0, 0), ...armL(100, 0, 0), ...armR(125, -10, 5), ...head(-30, 20) });
  r.pin("handR", MASTER.second, MASTER.land);
  r.at(0.52, { heading: 135, pitch: 110, ...legL(-20, 30, 10), ...legR(-25, -35, 10), ...torso(0, 0, 10), ...armL(115, 0, 0), ...armR(118, -10, 0), ...head(-30, 20) });
  r.at(0.57, { heading: 160, pitch: 92, ...legL(40, 25, 30), ...legR(-30, -35, 10), ...torso(0, 0, 10), ...armL(95, 0, 0), ...armR(98, -10, 0), ...head(-25, 10) });
  r.at(0.62, { heading: 185, pitch: 62, ...legL(58, 15, 30), ...legR(-35, -30, 20), ...torso(10, 0, 0), ...armL(115, 30, 10), ...armR(125, -30, 10), ...head(-15, 0) });
  r.at(0.68, { heading: 198, pitch: 38, ...legL(45, 12, 35), ...legR(-35, -28, 22), ...torso(12, 0, 0), ...armL(100, 60, 20), ...armR(105, -60, 20), ...head(-10, 0) });
  r.pin("L", MASTER.land, 1);
  r.at(0.76, { heading: 205, pitch: 25, ...legL(40, 10, 40), ...legR(-30, -20, 30), ...torso(15, 0, 0), ...armsWide });
  r.at(1, { heading: 210, pitch: 0, ...legL(15, 5, 30), ...legR(-25, -10, 25), ...torso(5, 0, 0), ...armsDown, ...head(0, 0) });
  return r.build("master-swing");
}

/** Scoot hyper timing (normalized), as in the scoot; the right foot lands again at `land`. */
const SCOOT_HYPER = { dive: 0.43, push: 0.44, hand: 0.47, land: 0.533 };

/** Scoot Hyper: the scoot's drop onto the left hand and push off the right
 * foot, but the right leg swings round and lands first (hyper) while the left
 * leg stays tucked up in front. */
export function buildScootHyper(): THREE.AnimationClip {
  const D = 1.6;
  const r = new Rig(D, { hands: true });
  r.start({ ...armsDown, ...legL(10, 10), ...legR(-10, -10) });
  r.pin("R", 0, SCOOT_HYPER.push);
  // The left foot lifts straight up before the right leg starts to bend.
  r.at(0.03, { heading: 0, pitch: 0, ...legL(31.6, 10, 41.7, 0, -20), ...legR(-10, -10) });
  r.at(0.07, { ...legL(45, 12, 60), ...legR(15, -10, 20) });
  r.at(0.16, { heading: 15, pitch: 25, ...legL(65, 15, 85), ...legR(45, -10, 60), ...torso(25, 0, 0), ...armL(80, 20, 10), ...armR(50, -100, 20) });
  r.at(0.3, { heading: 40, pitch: 45, ...legL(110, 20, 130), ...legR(55, -10, 80), ...torso(45, 0, 10), ...armL(150, 30, 5), ...armR(70, -100, 20), ...head(-20, 20) });
  r.at(0.42, { heading: 85, pitch: 70, ...legL(125, 25, 140), ...legR(70, -20, 95, 0, 30), ...torso(60, 0, 20), ...armL(175, 40, 0), ...armR(60, -110, 25), ...head(-25, 30) });
  // As in the scoot, only the forward tip moves while the hand comes down and the foot leaves.
  const still = { heading: 88, ...legR(55, -22, 80, 0, 35), ...torso(58, 0, 18), ...armL(175, 42, 0) };
  r.at(SCOOT_HYPER.dive, { ...still, pitch: 71, ...legL(100, 27, 145) });
  r.at(SCOOT_HYPER.hand, { ...still, pitch: 76 });
  r.pin("handL", SCOOT_HYPER.push, SCOOT_HYPER.land);
  // Over the hand the left leg reaches back and up out of the way while the
  // right leg, after its push, swings in under the body and lands first.
  r.at(0.5, { heading: 130, pitch: 76, ...legL(0, 30, 90), ...legR(-10, -30, 20), ...torso(55, 0, 15), ...armL(175, 45, 0), ...armR(70, -110, 25), ...head(-30, 20) });
  r.at(0.56, { heading: 165, pitch: 62, ...legL(-30, 25, 45), ...legR(30, -15, 40), ...torso(45, 0, 10), ...armL(172, 50, 0), ...armR(75, -105, 25), ...head(-25, 15) });
  r.at(0.6, { heading: 185, pitch: 42, ...legL(-15, 20, 60), ...legR(32, -8, 38), ...torso(30, 0, 5), ...armL(150, 55, 5), ...armR(85, -95, 20), ...head(-20, 10) });
  r.at(0.66, { heading: 196, pitch: 25, ...legL(40, 15, 80), ...legR(28, -5, 35), ...torso(18, 0, 0), ...armL(110, 60, 20), ...armR(100, -60, 20), ...head(-15, 0) });
  r.pin("R", SCOOT_HYPER.land, 1);
  r.at(0.76, { heading: 204, pitch: 15, ...legL(55, 10, 70), ...legR(20, -5, 35), ...torso(12, 0, 0), ...armsWide });
  r.at(1, { heading: 210, pitch: 0, ...legL(40, 10, 60), ...legR(15, -5, 30), ...torso(5, 0, 0), ...armsDown, ...head(0, 0) });
  return r.build("scoot-hyper");
}

/** Butterfly Twist Round: the butterfly twist with a right-leg round kick as
 * the body comes up after the twist, before the left foot lands. */
export function buildButterflyTwistRound(): THREE.AnimationClip {
  const D = 1.9;
  const r = new Rig(D);
  butterflySetup(r);
  r.at(0.42, { twist: 0 });
  r.flight(0.42, 0.84, { travel: [0.4, 0.15] });
  r.at(0.5, { heading: 150, pitch: 85, twist: 100, ...legR(-12, -8, 5), ...legL(-12, 8, 5), ...armsTight, ...torso(-5, 0, 0), ...head(-20, 30) });
  r.at(0.58, { heading: 215, pitch: 85, twist: 230, ...legR(-10, -5, 5), ...legL(-10, 5, 5), ...head(-20, 30) });
  r.at(0.65, { heading: 265, pitch: 70, twist: 340, ...legL(20, 10, 10), ...legR(-15, -10, 5), ...armL(80, 60, 40), ...armR(80, -60, 40), ...head(-20, 10) });
  // Chamber, then the round kick as the body comes up.
  r.at(0.71, { heading: 300, pitch: 45, twist: 360, ...legL(30, 15, 20), ...legR(60, -60, 120, 60), ...armL(80, 90, 40), ...armR(80, -60, 60), ...torso(-5, 5, 0), ...head(-10, 0) });
  r.at(0.77, { heading: 330, pitch: 10, ...legL(35, 15, 30), ...legR(118, 5, 5, 70), ...armL(40, 130, 30), ...armR(60, -20, 70), ...torso(0, 15, -10), ...head(0, 0) });
  r.at(0.84, { heading: 350, pitch: 0, ...legL(25, 8, 25), ...legR(50, -20, 80), ...armsWide, ...torso(8, 0, 0) });
  r.pin("L", 0.84, 1);
  settle(r, "R", 0.9, 0.96, { heading: 360, pitch: 0, twist: 360 });
  r.at(1, { ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("butterfly-twist-round");
}
