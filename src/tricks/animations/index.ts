import * as THREE from "three";
import { Builder, mixamoBoneName } from "../authoring";
import { build540, buildCheat720, buildLotus, buildPop360, buildSwing360, buildTornado } from "./kicks";
import { buildAerial, buildButterflyKick, buildButterflyTwist, buildCartwheel, buildMasterscoot, buildScoot } from "./inside";
import { buildDoubleleg, buildRaiz, buildSpyder } from "./outside";
import { buildFlashKick, buildGainerFlash, buildJanitor, buildTakFull, buildWrapFull } from "./flips";
import {
  stand,
  armsOverhead,
  armsBack,
  armsForward,
  armsTuck,
  armsWide,
  armsCross,
  legsTuck,
  legsStraight,
  legsAbsorb,
  crouch,
  leanForward,
  hipsAtStand,
  spineBend,
  spineSide,
  spineTwist,
  headDown,
  headUp,
  headTurn,
  headTilt,
} from "../poses";

/* Trick animation registry. The on-axis flips below are hand-keyed with the
 * Builder DSL; everything else lives in kicks.ts / inside.ts / outside.ts /
 * flips.ts and is authored on the semantic Rig (rig.ts), which also solves
 * foot contact and ballistic flight. */

const HIPS_Y = 0.95;
const NAME = mixamoBoneName;

/* ============================ BACK FLIP ============================ */
function buildBackFlip(): THREE.AnimationClip {
  const D = 1.6;
  const b = new Builder(D);

  // 0  stand
  stand(b, 0);
  hipsAtStand(b, 0);

  // 0.18  load: arms swing back, dip
  crouch(b, 0.18 * D, 0.18);
  armsBack(b, 0.18 * D);

  // 0.32  takeoff: arms whip overhead, look up, spine extends
  armsOverhead(b, 0.32 * D);
  legsStraight(b, 0.32 * D);
  spineBend(b, 0.32 * D, -12); // slight extension
  headUp(b, 0.32 * D, 30);

  // 0.55  apex tuck: arms hug knees, head down to chest, spine flexed hard
  armsTuck(b, 0.55 * D);
  legsTuck(b, 0.55 * D);
  spineBend(b, 0.55 * D, 45);
  headDown(b, 0.55 * D, 50);

  // 0.82  open out: arms wide for spotting, spine extending again
  armsWide(b, 0.82 * D);
  legsStraight(b, 0.82 * D);
  spineBend(b, 0.82 * D, -8);
  headUp(b, 0.82 * D, 18);

  // land
  stand(b, D);
  legsAbsorb(b, D);
  spineBend(b, D, 8); // landing forward absorption
  b.key("hips", D, { pos: { x: 0, z: -0.4 } });

  // hips arc + pitch
  b.hipsArc([0, HIPS_Y, 0], 1.05, [0, HIPS_Y, -0.4], 0.32 * D, D, 8);
  b.rotateOver("hips", "x", 0, -360, 0.32 * D, D, 8);

  return b.build("back-flip", NAME);
}

/* ============================ FRONT FLIP ============================ */
function buildFrontFlip(): THREE.AnimationClip {
  const D = 1.6;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  leanForward(b, 0, 8);

  // load
  crouch(b, 0.18 * D, 0.16);
  armsForward(b, 0.18 * D);

  // takeoff: arms drive forward-up, head down (front rotation init)
  armsOverhead(b, 0.32 * D);
  legsStraight(b, 0.32 * D);
  spineBend(b, 0.32 * D, 20);
  headDown(b, 0.32 * D, 25);

  // apex tuck — head fully tucked
  armsTuck(b, 0.55 * D);
  legsTuck(b, 0.55 * D);
  spineBend(b, 0.55 * D, 55);
  headDown(b, 0.55 * D, 55);

  // open
  armsWide(b, 0.85 * D);
  legsStraight(b, 0.85 * D);
  spineBend(b, 0.85 * D, 12);
  headDown(b, 0.85 * D, 10);

  // land
  stand(b, D);
  legsAbsorb(b, D);
  spineBend(b, D, 6);

  b.hipsArc([0, HIPS_Y, 0], 1.0, [0, HIPS_Y, 0.6], 0.3 * D, D, 8);
  b.rotateOver("hips", "x", 0, 360, 0.3 * D, D, 8);
  return b.build("front-flip", NAME);
}

/* ============================ SIDE FLIP ============================ */
function buildSideFlip(): THREE.AnimationClip {
  const D = 1.6;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);

  crouch(b, 0.18 * D, 0.16);
  // pre-load: arms swing across to one side
  b.key("leftArm", 0.18 * D, { eulerDeg: { x: 0, y: 0, z: -110 } });
  b.key("rightArm", 0.18 * D, { eulerDeg: { x: -40, y: 0, z: 50 } });
  spineSide(b, 0.18 * D, -10);

  // takeoff: arms thrown up & to one side
  armsOverhead(b, 0.32 * D);
  legsStraight(b, 0.32 * D);
  spineSide(b, 0.32 * D, 15);
  headTilt(b, 0.32 * D, -20);

  // mid-flip apex
  legsTuck(b, 0.55 * D);
  armsTuck(b, 0.55 * D);
  spineSide(b, 0.55 * D, 35);
  headTilt(b, 0.55 * D, -45);

  // open
  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineSide(b, 0.85 * D, 10);
  headTilt(b, 0.85 * D, -10);

  // land
  stand(b, D);
  legsAbsorb(b, D);

  b.hipsArc([0, HIPS_Y, 0], 1.0, [0.4, HIPS_Y, 0], 0.3 * D, D, 8);
  b.rotateOver("hips", "z", 0, -360, 0.3 * D, D, 8);
  return b.build("side-flip", NAME);
}

/* ============================ GAINER ============================ */
function buildGainer(): THREE.AnimationClip {
  const D = 1.7;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  leanForward(b, 0, -3);

  // approach: arms ready, slight crouch on left foot
  b.key("leftUpLeg", 0.18 * D, { eulerDeg: { x: -25 } });
  b.key("leftLeg", 0.18 * D, { eulerDeg: { x: 50 } });
  b.key("hips", 0.18 * D, { pos: { y: HIPS_Y - 0.1 } });
  armsBack(b, 0.18 * D);
  spineBend(b, 0.18 * D, -10);
  headUp(b, 0.18 * D, 15);

  // takeoff: right leg swings forward and up, arms swing overhead, look up
  b.key("rightUpLeg", 0.28 * D, { eulerDeg: { x: -85 } });
  b.key("rightLeg", 0.28 * D, { eulerDeg: { x: 10 } });
  armsOverhead(b, 0.28 * D);
  spineBend(b, 0.28 * D, -18);
  headUp(b, 0.28 * D, 30);

  // apex tuck
  legsTuck(b, 0.55 * D);
  armsTuck(b, 0.55 * D);
  spineBend(b, 0.55 * D, 35);
  headDown(b, 0.55 * D, 45);

  // open
  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineBend(b, 0.85 * D, -5);
  headUp(b, 0.85 * D, 15);

  // land
  stand(b, D);
  legsAbsorb(b, D);
  spineBend(b, D, 6);

  b.hipsArc([0, HIPS_Y, 0], 1.0, [0, HIPS_Y, 1.2], 0.28 * D, D, 8);
  b.rotateOver("hips", "x", 0, -360, 0.28 * D, D, 8);
  return b.build("gainer", NAME);
}

/* ============================ CORKSCREW ============================ */
function buildCorkscrew(): THREE.AnimationClip {
  const D = 1.8;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);

  // pre-twist load (already turning before takeoff)
  b.key("hips", 0.1 * D, {
    pos: { y: HIPS_Y - 0.08 },
    eulerDeg: { y: 25 },
  });
  spineTwist(b, 0.1 * D, 30);
  headTurn(b, 0.1 * D, 30);
  // arms wind up: left across, right back
  b.key("leftArm", 0.1 * D, { eulerDeg: { x: -30, y: 0, z: -25 } });
  b.key("rightArm", 0.1 * D, { eulerDeg: { x: 20, y: 0, z: 110 } });

  // takeoff: left foot plants, right leg swings forward and up
  b.key("leftUpLeg", 0.1 * D, { eulerDeg: { x: -20 } });
  b.key("leftLeg", 0.1 * D, { eulerDeg: { x: 40 } });
  b.key("rightUpLeg", 0.1 * D, { eulerDeg: { x: 20 } });
  b.key("leftUpLeg", 0.22 * D, { eulerDeg: { x: 0 } });
  b.key("leftLeg", 0.22 * D, { eulerDeg: { x: 5 } });
  b.key("rightUpLeg", 0.22 * D, { eulerDeg: { x: -85 } });
  b.key("rightLeg", 0.22 * D, { eulerDeg: { x: 10 } });
  armsOverhead(b, 0.22 * D);
  spineTwist(b, 0.22 * D, 60);
  headUp(b, 0.22 * D, 20);

  // mid-air corkscrew (tight)
  legsTuck(b, 0.5 * D);
  armsCross(b, 0.5 * D);
  spineTwist(b, 0.5 * D, 180);
  spineBend(b, 0.5 * D, 30);
  headDown(b, 0.5 * D, 35);
  headTurn(b, 0.5 * D, 60);

  // open
  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineTwist(b, 0.85 * D, 320);
  spineBend(b, 0.85 * D, -5);
  headUp(b, 0.85 * D, 10);
  headTurn(b, 0.85 * D, 20);

  // land complete: left foot under the body, right leg trailing behind
  stand(b, D);
  b.key("leftUpLeg", D, { eulerDeg: { x: -15 } });
  b.key("leftLeg", D, { eulerDeg: { x: 20 } });
  b.key("rightUpLeg", D, { eulerDeg: { x: 25 } });
  b.key("rightLeg", D, { eulerDeg: { x: 45 } });

  b.hipsArc([0, HIPS_Y, 0], 1.05, [0.3, HIPS_Y, 1.0], 0.22 * D, D, 10);
  b.rotateOver("hips", "x", 0, -360, 0.22 * D, D, 8);
  b.rotateOver("hips", "y", 25, 25 + 360, 0.22 * D, D, 8);
  return b.build("corkscrew", NAME);
}

/* ============================ FULL TWIST ============================ */
function buildFull(): THREE.AnimationClip {
  const D = 1.8;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  crouch(b, 0.18 * D, 0.18);
  armsBack(b, 0.18 * D);

  // takeoff: arms whip overhead, look up, body extends
  armsOverhead(b, 0.32 * D);
  legsStraight(b, 0.32 * D);
  spineBend(b, 0.32 * D, -12);
  headUp(b, 0.32 * D, 25);

  // mid-air: tight twist, arms across chest, head tucked & turning
  legsTuck(b, 0.5 * D);
  armsCross(b, 0.5 * D);
  spineTwist(b, 0.5 * D, 180);
  spineBend(b, 0.5 * D, 35);
  headDown(b, 0.5 * D, 35);
  headTurn(b, 0.5 * D, 90);

  // open
  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineTwist(b, 0.85 * D, 320);
  spineBend(b, 0.85 * D, -5);
  headUp(b, 0.85 * D, 15);
  headTurn(b, 0.85 * D, 30);

  // land
  stand(b, D);
  legsAbsorb(b, D);
  spineBend(b, D, 6);

  b.hipsArc([0, HIPS_Y, 0], 1.1, [0, HIPS_Y, -0.4], 0.32 * D, D, 10);
  b.rotateOver("hips", "x", 0, -360, 0.32 * D, D, 8);
  b.rotateOver("hips", "y", 0, 360, 0.32 * D, D, 8);
  return b.build("full", NAME);
}

/* ============================ WEBSTER ============================ */
function buildWebster(): THREE.AnimationClip {
  const D = 1.7;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  leanForward(b, 0, 10);

  // single foot load (right)
  b.key("rightUpLeg", 0.2 * D, { eulerDeg: { x: -35 } });
  b.key("rightLeg", 0.2 * D, { eulerDeg: { x: 60 } });
  b.key("hips", 0.2 * D, { pos: { y: HIPS_Y - 0.1 } });
  armsBack(b, 0.2 * D);
  spineBend(b, 0.2 * D, 15);
  headDown(b, 0.2 * D, 8);

  // takeoff: left leg swings back and up (swing-through), arms forward, head leads down
  b.key("leftUpLeg", 0.3 * D, { eulerDeg: { x: 70 } });
  b.key("leftLeg", 0.3 * D, { eulerDeg: { x: 20 } });
  armsForward(b, 0.3 * D);
  spineBend(b, 0.3 * D, 25);
  headDown(b, 0.3 * D, 30);

  // apex tuck
  legsTuck(b, 0.55 * D);
  armsTuck(b, 0.55 * D);
  spineBend(b, 0.55 * D, 55);
  headDown(b, 0.55 * D, 50);

  // open
  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineBend(b, 0.85 * D, 10);
  headDown(b, 0.85 * D, 8);

  // land
  stand(b, D);
  legsAbsorb(b, D);

  b.hipsArc([0, HIPS_Y, 0], 1.0, [0, HIPS_Y, 1.0], 0.3 * D, D, 8);
  b.rotateOver("hips", "x", 0, 360, 0.3 * D, D, 8);
  return b.build("webster", NAME);
}

/* ============================ Registry ============================ */
type Factory = () => THREE.AnimationClip;

export const TRICK_FACTORIES: Record<string, Factory> = {
  // vertical kicks
  "cheat-kick": buildTornado,
  "540-kick": build540,
  "cheat-720": buildCheat720,
  "pop-kick": buildPop360,
  "swing-kick": buildSwing360,
  // backward
  "back-flip": buildBackFlip,
  "flash-kick": buildFlashKick,
  gainer: buildGainer,
  "gainer-flash": buildGainerFlash,
  full: buildFull,
  corkscrew: buildCorkscrew,
  // forward
  "front-flip": buildFrontFlip,
  webster: buildWebster,
  janitor: buildJanitor,
  // inside
  butterfly: buildButterflyKick,
  "butterfly-twist": buildButterflyTwist,
  cartwheel: buildCartwheel,
  aerial: buildAerial,
  scoot: buildScoot,
  "master-swing": buildMasterscoot,
  wrap: buildWrapFull,
  tak: buildTakFull,
  // outside
  raiz: buildRaiz,
  "double-leg": buildDoubleleg,
  spider: buildSpyder,
  lotus: buildLotus,
  "side-flip": buildSideFlip,
};

export function buildClipFor(trickId: string): THREE.AnimationClip {
  const f = TRICK_FACTORIES[trickId];
  if (!f) throw new Error(`no animation factory for trick: ${trickId}`);
  return f();
}
