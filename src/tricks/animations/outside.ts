import type * as THREE from "three";
import { Rig } from "../rig";
import { armL, armR, armsDown, armsWide, head, legL, legR, legsAbsorb, torso } from "./poses";

/* Outside tricks (raiz, doubleleg, spyder) for a left-twisting tricker. */

/** Cheat-style step shared by raiz and spyder: pivot on the left foot while
 * the right foot steps around to backside (heading 180) and plants. */
function outsideStep(r: Rig) {
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
    heading: 160,
    ...legR(35, 0, 55),
    ...legL(5, 10, 50),
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
  r.at(0.92, { heading: 355, ...legR(0, -10, 30), ...legL(25, 5, 35) });
  r.at(1, { heading: 360, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
  return r.build("raiz");
}

/** Doubleleg (armada dupla): two-foot takeoff, torso winds and lays back while
 * both legs, together and piked, swing around in a V; lands on both feet. */
export function buildDoubleleg(): THREE.AnimationClip {
  const D = 1.7;
  const r = new Rig(D);
  r.start({ ...armsDown, ...legL(0, 15), ...legR(0, -15) });
  r.pin("L", 0, 0.36);
  r.at(0.2, {
    heading: 20,
    ...legL(35, 15, 50),
    ...legR(35, -15, 50),
    ...armL(45, 10, 20),
    ...armR(60, -140, 20),
    ...torso(15, 0, -35),
    ...head(5, -20),
  });
  r.at(0.36, {
    heading: 100,
    tilt: 25,
    spin: 0,
    ...legL(0, 5, 5, 0, 35),
    ...legR(0, -5, 5, 0, 35),
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
  r.at(1, { heading: 360, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0), ...head(0, 0) });
  return r.build("double-leg");
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
  r.at(0.9, { heading: 515, pitch: 5, ...legR(10, -20, 30), ...legL(25, 0, 35), ...torso(10, 0, 0) });
  r.at(1, { heading: 520, pitch: 0, ...legsAbsorb, ...armsDown, ...torso(5, 0, 0) });
  return r.build("spider");
}
