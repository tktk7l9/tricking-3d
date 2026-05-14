import * as THREE from "three";
import { Builder, mixamoBoneName } from "../authoring";
import {
  stand,
  armsOverhead,
  armsBack,
  armsForward,
  armsTuck,
  armsWide,
  armsCross,
  armForward,
  armBack,
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

/* All 20 tricking animations — every trick now poses spine, neck, head,
 * arms and forearms through every phase so the upper body is visibly
 * choreographed alongside hip rotation/translation. */

const HIPS_Y = 0.95;
const NAME = mixamoBoneName;

/* ============================ BACK FLIP ============================ */
export function buildBackFlip(): THREE.AnimationClip {
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
export function buildFrontFlip(): THREE.AnimationClip {
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
export function buildSideFlip(): THREE.AnimationClip {
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
export function buildGainer(): THREE.AnimationClip {
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

  // takeoff: right leg drives up, arms swing overhead, look up
  b.key("rightUpLeg", 0.28 * D, { eulerDeg: { x: 30 } });
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
export function buildCorkscrew(): THREE.AnimationClip {
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

  // takeoff
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

  // land
  stand(b, D);
  legsAbsorb(b, D);

  b.hipsArc([0, HIPS_Y, 0], 1.05, [0.3, HIPS_Y, 1.0], 0.22 * D, D, 10);
  b.rotateOver("hips", "x", 0, -360, 0.22 * D, D, 8);
  b.rotateOver("hips", "y", 25, 25 + 360, 0.22 * D, D, 8);
  return b.build("corkscrew", NAME);
}

/* ============================ BUTTERFLY ============================ */
export function buildButterfly(): THREE.AnimationClip {
  const D = 1.7;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);

  // start side-on
  b.key("hips", 0, { eulerDeg: { y: -20 } });
  b.key("rightUpLeg", 0, { eulerDeg: { x: 25 } });
  b.key("leftUpLeg", 0, { eulerDeg: { x: -10 } });
  spineTwist(b, 0, -15);
  headTurn(b, 0, -25);
  // arms ready (right back, left across)
  b.key("rightArm", 0, { eulerDeg: { x: 30, y: 0, z: 110 } });
  b.key("leftArm", 0, { eulerDeg: { x: -30, y: 0, z: -50 } });

  // load: deep crouch on left leg, arms drop low across
  b.key("hips", 0.2 * D, {
    pos: { y: HIPS_Y - 0.15 },
    eulerDeg: { y: 30 },
  });
  spineTwist(b, 0.2 * D, 20);
  spineBend(b, 0.2 * D, 15);
  b.key("leftArm", 0.2 * D, { eulerDeg: { x: 0, y: 0, z: -110 } });
  b.key("rightArm", 0.2 * D, { eulerDeg: { x: -40, y: 0, z: 60 } });
  headDown(b, 0.2 * D, 20);

  // takeoff & body tilt to horizontal — arms whip out wide
  b.key("hips", 0.45 * D, {
    pos: { y: HIPS_Y + 0.45 },
    eulerDeg: { y: 180, z: -75, x: -10 },
  });
  b.key("leftUpLeg", 0.45 * D, { eulerDeg: { x: -45, y: 30 } });
  b.key("rightUpLeg", 0.45 * D, { eulerDeg: { x: -90, y: -10 } });
  armsWide(b, 0.45 * D);
  spineSide(b, 0.45 * D, 25);
  spineTwist(b, 0.45 * D, 40);
  headUp(b, 0.45 * D, 15);
  headTurn(b, 0.45 * D, 30);

  // continue rotation, body still tilted
  b.key("hips", 0.7 * D, {
    pos: { y: HIPS_Y + 0.2 },
    eulerDeg: { y: 300, z: -55 },
  });
  b.key("rightUpLeg", 0.7 * D, { eulerDeg: { x: -30 } });
  b.key("leftUpLeg", 0.7 * D, { eulerDeg: { x: -60, y: 0 } });
  // arms come back in and across
  b.key("leftArm", 0.7 * D, { eulerDeg: { x: -20, y: 0, z: -95 } });
  b.key("rightArm", 0.7 * D, { eulerDeg: { x: -20, y: 0, z: 5 } });
  spineSide(b, 0.7 * D, 12);
  spineTwist(b, 0.7 * D, 20);
  headTurn(b, 0.7 * D, 10);

  // landing — body upright again
  b.key("hips", D, {
    pos: { x: 0.4, y: HIPS_Y, z: 0.4 },
    eulerDeg: { x: 0, y: 360, z: 0 },
  });
  legsAbsorb(b, D);
  stand(b, D);

  return b.build("butterfly", NAME);
}

/* ============================ CHEAT KICK ============================ */
export function buildCheatKick(): THREE.AnimationClip {
  const D = 1.6;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);

  // cheat (front-foot step): body pre-rotates a bit
  b.key("hips", 0.2 * D, {
    pos: { y: HIPS_Y - 0.05, z: 0.15 },
    eulerDeg: { y: 60 },
  });
  b.key("leftUpLeg", 0.2 * D, { eulerDeg: { x: -35 } });
  b.key("leftLeg", 0.2 * D, { eulerDeg: { x: 45 } });
  spineTwist(b, 0.2 * D, 25);
  headTurn(b, 0.2 * D, 35);
  // left arm whips across body, right arm pulls back
  armForward(b, "left", 0.2 * D);
  armBack(b, "right", 0.2 * D);

  // takeoff: body 180 lead, arms swing through
  b.key("hips", 0.45 * D, {
    pos: { y: HIPS_Y + 0.4 },
    eulerDeg: { y: 180 },
  });
  b.key("rightUpLeg", 0.45 * D, { eulerDeg: { x: -90, y: -25 } });
  b.key("rightLeg", 0.45 * D, { eulerDeg: { x: -10 } });
  armsWide(b, 0.45 * D);
  spineSide(b, 0.45 * D, -15);
  spineBend(b, 0.45 * D, -10);
  headTurn(b, 0.45 * D, 50);
  headUp(b, 0.45 * D, 10);

  // kick impact — head rotates with body, arms sharp
  b.key("hips", 0.7 * D, {
    pos: { y: HIPS_Y + 0.25 },
    eulerDeg: { y: 320 },
  });
  b.key("rightUpLeg", 0.7 * D, { eulerDeg: { x: -110, y: -40 } });
  armForward(b, "right", 0.7 * D);
  armBack(b, "left", 0.7 * D);
  spineSide(b, 0.7 * D, -25);
  headTurn(b, 0.7 * D, 30);

  // land
  b.key("hips", D, {
    pos: { x: 0, y: HIPS_Y, z: 0.3 },
    eulerDeg: { x: 0, y: 360, z: 0 },
  });
  legsAbsorb(b, D);
  stand(b, D);
  return b.build("cheat-kick", NAME);
}

/* ============================ DOUBLE LEG ============================ */
export function buildDoubleLeg(): THREE.AnimationClip {
  const D = 1.4;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  leanForward(b, 0, 10);

  crouch(b, 0.22 * D, 0.18);
  armsBack(b, 0.22 * D);

  // takeoff: arms drive forward, body extends
  b.key("hips", 0.4 * D, { pos: { y: HIPS_Y + 0.35, z: 0.3 } });
  armsForward(b, 0.4 * D);
  spineBend(b, 0.4 * D, 5);
  headUp(b, 0.4 * D, 15);

  // peak: knees driven forward, body folds, arms reach to feet
  b.key("hips", 0.6 * D, { pos: { y: HIPS_Y + 0.45, z: 0.6 } });
  b.key("leftUpLeg", 0.6 * D, { eulerDeg: { x: -100 } });
  b.key("rightUpLeg", 0.6 * D, { eulerDeg: { x: -100 } });
  b.key("leftLeg", 0.6 * D, { eulerDeg: { x: 30 } });
  b.key("rightLeg", 0.6 * D, { eulerDeg: { x: 30 } });
  armsTuck(b, 0.6 * D);
  spineBend(b, 0.6 * D, 35);
  headDown(b, 0.6 * D, 30);

  // descend
  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineBend(b, 0.85 * D, 10);
  headDown(b, 0.85 * D, 10);

  // land
  b.key("hips", D, { pos: { y: HIPS_Y, z: 0.9 } });
  stand(b, D);
  legsAbsorb(b, D);
  return b.build("double-leg", NAME);
}

/* ============================ POP KICK ============================ */
export function buildPopKick(): THREE.AnimationClip {
  const D = 1.5;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);

  // straight crouch (no cheat step)
  b.key("hips", 0.22 * D, { pos: { y: HIPS_Y - 0.18 }, eulerDeg: { y: 0 } });
  b.key("leftUpLeg", 0.22 * D, { eulerDeg: { x: -45 } });
  b.key("rightUpLeg", 0.22 * D, { eulerDeg: { x: -45 } });
  b.key("leftLeg", 0.22 * D, { eulerDeg: { x: 70 } });
  b.key("rightLeg", 0.22 * D, { eulerDeg: { x: 70 } });
  armsBack(b, 0.22 * D);
  spineBend(b, 0.22 * D, 15);
  headDown(b, 0.22 * D, 10);

  // pop (vertical), arms whip up, twist begins
  b.key("hips", 0.45 * D, {
    pos: { y: HIPS_Y + 0.45 },
    eulerDeg: { y: 150 },
  });
  legsStraight(b, 0.45 * D);
  armsOverhead(b, 0.45 * D);
  spineTwist(b, 0.45 * D, 40);
  spineBend(b, 0.45 * D, -8);
  headUp(b, 0.45 * D, 25);
  headTurn(b, 0.45 * D, 60);

  // mid-air kick (right leg)
  b.key("hips", 0.7 * D, {
    pos: { y: HIPS_Y + 0.25 },
    eulerDeg: { y: 300 },
  });
  b.key("rightUpLeg", 0.7 * D, { eulerDeg: { x: -100, y: -30 } });
  // arms snap: left to chest, right out
  armsCross(b, 0.7 * D);
  spineTwist(b, 0.7 * D, 30);
  spineBend(b, 0.7 * D, -5);
  headTurn(b, 0.7 * D, 45);

  // land
  b.key("hips", D, {
    pos: { y: HIPS_Y },
    eulerDeg: { x: 0, y: 360, z: 0 },
  });
  stand(b, D);
  legsAbsorb(b, D);
  return b.build("pop-kick", NAME);
}

/* ============================ SPIDER ============================ */
export function buildSpider(): THREE.AnimationClip {
  const D = 1.6;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);

  crouch(b, 0.2 * D, 0.15);
  armsBack(b, 0.2 * D);

  // takeoff: tilt right, arms drop toward ground (spider position)
  b.key("hips", 0.4 * D, {
    pos: { y: HIPS_Y + 0.2, x: 0.1 },
    eulerDeg: { z: -45 },
  });
  armsForward(b, 0.4 * D);
  spineSide(b, 0.4 * D, -20);
  headTilt(b, 0.4 * D, -25);

  // peak: body horizontal, legs whip overhead, arms reach to floor
  b.key("hips", 0.55 * D, {
    pos: { y: HIPS_Y + 0.4, x: 0.2 },
    eulerDeg: { z: -120 },
  });
  b.key("leftUpLeg", 0.55 * D, { eulerDeg: { x: -45 } });
  b.key("rightUpLeg", 0.55 * D, { eulerDeg: { x: -75 } });
  // both arms extend down toward "ground" (in body frame, that's forward of head)
  b.key("leftArm", 0.55 * D, { eulerDeg: { x: -90, y: 0, z: 30 } });
  b.key("rightArm", 0.55 * D, { eulerDeg: { x: -90, y: 0, z: -30 } });
  b.key("leftForeArm", 0.55 * D, { eulerDeg: { y: -20 } });
  b.key("rightForeArm", 0.55 * D, { eulerDeg: { y: 20 } });
  spineSide(b, 0.55 * D, -40);
  spineBend(b, 0.55 * D, 20);
  headTilt(b, 0.55 * D, -55);
  headDown(b, 0.55 * D, 25);

  // legs whip down
  b.key("hips", 0.78 * D, {
    pos: { y: HIPS_Y + 0.2, x: 0.3 },
    eulerDeg: { z: -260 },
  });
  legsStraight(b, 0.78 * D);
  armsWide(b, 0.78 * D);
  spineSide(b, 0.78 * D, -10);
  headTilt(b, 0.78 * D, -10);

  // land
  b.key("hips", D, {
    pos: { y: HIPS_Y, x: 0.5 },
    eulerDeg: { x: 0, y: 0, z: -360 },
  });
  stand(b, D);
  legsAbsorb(b, D);
  return b.build("spider", NAME);
}

/* ============================ SWING KICK ============================ */
export function buildSwingKick(): THREE.AnimationClip {
  const D = 1.4;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);

  // wind up: right leg back, body coiled
  b.key("rightUpLeg", 0.25 * D, { eulerDeg: { x: -45 } });
  b.key("hips", 0.25 * D, { eulerDeg: { y: 30 }, pos: { y: HIPS_Y - 0.05 } });
  spineTwist(b, 0.25 * D, 25);
  headTurn(b, 0.25 * D, 30);
  armBack(b, "right", 0.25 * D);
  armForward(b, "left", 0.25 * D);

  // kick fully extended, arms whip
  b.key("rightUpLeg", 0.55 * D, { eulerDeg: { x: -110 } });
  b.key("rightLeg", 0.55 * D, { eulerDeg: { x: -10 } });
  b.key("hips", 0.55 * D, { pos: { y: HIPS_Y + 0.25 }, eulerDeg: { y: 90 } });
  armForward(b, "right", 0.55 * D);
  armBack(b, "left", 0.55 * D);
  spineTwist(b, 0.55 * D, 60);
  spineBend(b, 0.55 * D, -10);
  headTurn(b, 0.55 * D, 70);

  // recovery
  b.key("rightUpLeg", 0.85 * D, { eulerDeg: { x: -30 } });
  b.key("hips", 0.85 * D, { pos: { y: HIPS_Y + 0.05 }, eulerDeg: { y: 150 } });
  armsWide(b, 0.85 * D);
  spineTwist(b, 0.85 * D, 30);
  headTurn(b, 0.85 * D, 30);

  // land
  b.key("hips", D, { pos: { y: HIPS_Y }, eulerDeg: { x: 0, y: 180, z: 0 } });
  stand(b, D);
  legsAbsorb(b, D);
  return b.build("swing-kick", NAME);
}

/* ============================ LOTUS ============================ */
export function buildLotus(): THREE.AnimationClip {
  const D = 1.7;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);

  // step in
  b.key("hips", 0.3 * D, {
    pos: { y: HIPS_Y - 0.1, z: 0.2 },
    eulerDeg: { y: 45 },
  });
  b.key("leftUpLeg", 0.3 * D, { eulerDeg: { x: -30 } });
  spineTwist(b, 0.3 * D, 25);
  headTurn(b, 0.3 * D, 30);
  armBack(b, "right", 0.3 * D);
  armForward(b, "left", 0.3 * D);

  // sweep start
  b.key("rightUpLeg", 0.5 * D, { eulerDeg: { x: -80, y: 60 } });
  b.key("rightLeg", 0.5 * D, { eulerDeg: { x: -10 } });
  b.key("hips", 0.5 * D, {
    pos: { y: HIPS_Y + 0.2, z: 0.4 },
    eulerDeg: { y: 180 },
  });
  armsOverhead(b, 0.5 * D);
  spineTwist(b, 0.5 * D, 70);
  spineSide(b, 0.5 * D, -15);
  headUp(b, 0.5 * D, 15);
  headTurn(b, 0.5 * D, 50);

  // peak: kick across, arms snap apart
  b.key("rightUpLeg", 0.7 * D, { eulerDeg: { x: -100, y: -40 } });
  b.key("hips", 0.7 * D, {
    pos: { y: HIPS_Y + 0.15, z: 0.5 },
    eulerDeg: { y: 280 },
  });
  armForward(b, "left", 0.7 * D);
  armBack(b, "right", 0.7 * D);
  spineTwist(b, 0.7 * D, 60);
  headTurn(b, 0.7 * D, 30);

  // land
  b.key("hips", D, {
    pos: { y: HIPS_Y, z: 0.6 },
    eulerDeg: { x: 0, y: 360, z: 0 },
  });
  stand(b, D);
  legsAbsorb(b, D);
  return b.build("lotus", NAME);
}

/* ============================ FULL TWIST ============================ */
export function buildFull(): THREE.AnimationClip {
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
export function buildWebster(): THREE.AnimationClip {
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

  // takeoff: left leg drives up, arms forward, head leads down
  b.key("leftUpLeg", 0.3 * D, { eulerDeg: { x: -80 } });
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

/* ============================ JANITOR ============================ */
export function buildJanitor(): THREE.AnimationClip {
  const D = 1.8;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  leanForward(b, 0, 10);

  b.key("rightUpLeg", 0.2 * D, { eulerDeg: { x: -35 } });
  b.key("hips", 0.2 * D, { pos: { y: HIPS_Y - 0.1 } });
  armsBack(b, 0.2 * D);
  spineBend(b, 0.2 * D, 12);
  headDown(b, 0.2 * D, 10);

  b.key("leftUpLeg", 0.3 * D, { eulerDeg: { x: -80 } });
  armsOverhead(b, 0.3 * D);
  spineBend(b, 0.3 * D, 18);
  spineTwist(b, 0.3 * D, 30);
  headDown(b, 0.3 * D, 20);

  legsTuck(b, 0.55 * D);
  armsCross(b, 0.55 * D);
  spineBend(b, 0.55 * D, 45);
  spineTwist(b, 0.55 * D, 90);
  headDown(b, 0.55 * D, 40);
  headTurn(b, 0.55 * D, 45);

  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineBend(b, 0.85 * D, 8);
  spineTwist(b, 0.85 * D, 120);
  headTurn(b, 0.85 * D, 30);

  stand(b, D);
  legsAbsorb(b, D);

  b.hipsArc([0, HIPS_Y, 0], 1.05, [0, HIPS_Y, 1.0], 0.3 * D, D, 8);
  b.rotateOver("hips", "x", 0, 360, 0.3 * D, D, 8);
  b.rotateOver("hips", "y", 0, 180, 0.3 * D, D, 8);
  return b.build("janitor", NAME);
}

/* ============================ AERIAL ============================ */
export function buildAerial(): THREE.AnimationClip {
  const D = 1.7;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  leanForward(b, 0, 5);

  // load
  b.key("rightUpLeg", 0.25 * D, { eulerDeg: { x: -25 } });
  b.key("hips", 0.25 * D, { pos: { y: HIPS_Y - 0.08, x: 0.05 } });
  // left arm reaches forward, right arm pulls up high
  b.key("leftArm", 0.25 * D, { eulerDeg: { x: -85, y: 0, z: -50 } });
  b.key("rightArm", 0.25 * D, { eulerDeg: { x: 30, y: 0, z: 130 } });
  spineSide(b, 0.25 * D, -10);
  headTilt(b, 0.25 * D, -10);

  // takeoff: left leg whips up, body tilts laterally
  b.key("leftUpLeg", 0.35 * D, { eulerDeg: { x: -45, y: 30 } });
  armsWide(b, 0.35 * D);
  spineSide(b, 0.35 * D, -25);
  headTilt(b, 0.35 * D, -25);

  // peak: body horizontal, legs split, arms reach
  b.key("hips", 0.55 * D, {
    pos: { y: HIPS_Y + 0.3, x: 0.4 },
    eulerDeg: { z: -180 },
  });
  b.key("leftUpLeg", 0.55 * D, { eulerDeg: { x: -50, y: 30 } });
  b.key("rightUpLeg", 0.55 * D, { eulerDeg: { x: 30, y: -20 } });
  // arms point along travel direction (one forward, one behind)
  b.key("leftArm", 0.55 * D, { eulerDeg: { x: -90, y: 0, z: -30 } });
  b.key("rightArm", 0.55 * D, { eulerDeg: { x: -90, y: 0, z: 30 } });
  spineSide(b, 0.55 * D, -45);
  spineBend(b, 0.55 * D, 5);
  headTilt(b, 0.55 * D, -50);

  // legs cycle through
  b.key("hips", 0.78 * D, {
    pos: { y: HIPS_Y + 0.15, x: 0.7 },
    eulerDeg: { z: -300 },
  });
  armsWide(b, 0.78 * D);
  spineSide(b, 0.78 * D, -20);
  headTilt(b, 0.78 * D, -25);

  // land
  b.key("hips", D, {
    pos: { y: HIPS_Y, x: 1.0 },
    eulerDeg: { x: 0, y: 0, z: -360 },
  });
  stand(b, D);
  legsAbsorb(b, D);
  return b.build("aerial", NAME);
}

/* ============================ MASTER SWING ============================ */
export function buildMasterSwing(): THREE.AnimationClip {
  const D = 1.4;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);

  // back foot scoots forward in a big arc
  b.key("rightUpLeg", 0.3 * D, { eulerDeg: { x: -60, y: -45 } });
  b.key("hips", 0.3 * D, {
    pos: { y: HIPS_Y - 0.05, x: 0.15 },
    eulerDeg: { y: 60 },
  });
  spineTwist(b, 0.3 * D, 30);
  headTurn(b, 0.3 * D, 40);
  armForward(b, "left", 0.3 * D);
  armBack(b, "right", 0.3 * D);

  // half rotation, body squared
  b.key("hips", 0.6 * D, {
    pos: { y: HIPS_Y + 0.15, x: 0.3 },
    eulerDeg: { y: 150 },
  });
  b.key("rightUpLeg", 0.6 * D, { eulerDeg: { x: -30, y: -10 } });
  armsWide(b, 0.6 * D);
  spineTwist(b, 0.6 * D, 50);
  spineBend(b, 0.6 * D, -8);
  headTurn(b, 0.6 * D, 50);
  headUp(b, 0.6 * D, 10);

  // land facing reversed
  b.key("hips", D, {
    pos: { y: HIPS_Y, x: 0.4 },
    eulerDeg: { x: 0, y: 180, z: 0 },
  });
  stand(b, D);
  legsAbsorb(b, D);
  return b.build("master-swing", NAME);
}

/* ============================ WRAP (540) ============================ */
export function buildWrap(): THREE.AnimationClip {
  const D = 1.7;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  leanForward(b, 0, 8);

  b.key("leftUpLeg", 0.22 * D, { eulerDeg: { x: -30 } });
  b.key("hips", 0.22 * D, {
    pos: { y: HIPS_Y - 0.1 },
    eulerDeg: { y: 30 },
  });
  spineTwist(b, 0.22 * D, 30);
  headTurn(b, 0.22 * D, 35);
  armBack(b, "right", 0.22 * D);
  armForward(b, "left", 0.22 * D);

  // takeoff: heavy twist, legs fold, arms wrap across chest
  b.key("hips", 0.45 * D, {
    pos: { y: HIPS_Y + 0.4 },
    eulerDeg: { y: 240 },
  });
  b.key("leftUpLeg", 0.45 * D, { eulerDeg: { x: -90, y: -40 } });
  b.key("rightUpLeg", 0.45 * D, { eulerDeg: { x: -50, y: 30 } });
  b.key("leftLeg", 0.45 * D, { eulerDeg: { x: 90 } });
  armsCross(b, 0.45 * D);
  spineTwist(b, 0.45 * D, 90);
  spineBend(b, 0.45 * D, 15);
  headTurn(b, 0.45 * D, 80);
  headDown(b, 0.45 * D, 20);

  // continue twist
  b.key("hips", 0.7 * D, {
    pos: { y: HIPS_Y + 0.2 },
    eulerDeg: { y: 420 },
  });
  legsStraight(b, 0.7 * D);
  armsTuck(b, 0.7 * D);
  spineTwist(b, 0.7 * D, 60);
  headTurn(b, 0.7 * D, 50);

  // open out
  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineTwist(b, 0.85 * D, 30);
  headTurn(b, 0.85 * D, 20);

  // land (was rotated 540°)
  b.key("hips", D, {
    pos: { y: HIPS_Y },
    eulerDeg: { x: 0, y: 540, z: 0 },
  });
  stand(b, D);
  legsAbsorb(b, D);
  return b.build("wrap", NAME);
}

/* ============================ TUCK ============================ */
export function buildTuck(): THREE.AnimationClip {
  const D = 1.5;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  crouch(b, 0.2 * D, 0.2);
  armsForward(b, 0.2 * D);

  // takeoff: arms swing up, body extends
  armsOverhead(b, 0.32 * D);
  legsStraight(b, 0.32 * D);
  spineBend(b, 0.32 * D, 10);
  headDown(b, 0.32 * D, 15);

  // mid-air: VERY deep tuck
  b.key("leftUpLeg", 0.5 * D, { eulerDeg: { x: -135 } });
  b.key("rightUpLeg", 0.5 * D, { eulerDeg: { x: -135 } });
  b.key("leftLeg", 0.5 * D, { eulerDeg: { x: 150 } });
  b.key("rightLeg", 0.5 * D, { eulerDeg: { x: 150 } });
  armsTuck(b, 0.5 * D);
  spineBend(b, 0.5 * D, 65);
  headDown(b, 0.5 * D, 60);

  // open out
  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineBend(b, 0.85 * D, 10);
  headDown(b, 0.85 * D, 10);

  // land
  stand(b, D);
  legsAbsorb(b, D);
  spineBend(b, D, 5);

  b.hipsArc([0, HIPS_Y, 0], 1.0, [0, HIPS_Y, 0.5], 0.32 * D, D, 8);
  b.rotateOver("hips", "x", 0, 360, 0.32 * D, D, 6);
  return b.build("tuck", NAME);
}

/* ============================ RAIZ ============================ */
export function buildRaiz(): THREE.AnimationClip {
  const D = 1.7;
  const b = new Builder(D);

  stand(b, 0);
  hipsAtStand(b, 0);
  leanForward(b, 0, 5);

  b.key("leftUpLeg", 0.22 * D, { eulerDeg: { x: -25 } });
  b.key("hips", 0.22 * D, { pos: { y: HIPS_Y - 0.1 } });
  armsBack(b, 0.22 * D);
  spineSide(b, 0.22 * D, -10);
  headTilt(b, 0.22 * D, -8);

  // takeoff: arms whip overhead, body tilts
  armsOverhead(b, 0.32 * D);
  legsStraight(b, 0.32 * D);
  spineSide(b, 0.32 * D, -20);
  spineTwist(b, 0.32 * D, 25);
  headTilt(b, 0.32 * D, -20);
  headTurn(b, 0.32 * D, 30);

  // mid-air: sideways tuck + half twist
  legsTuck(b, 0.55 * D);
  armsCross(b, 0.55 * D);
  spineSide(b, 0.55 * D, -35);
  spineTwist(b, 0.55 * D, 70);
  spineBend(b, 0.55 * D, 15);
  headTilt(b, 0.55 * D, -45);
  headTurn(b, 0.55 * D, 60);

  // open
  legsStraight(b, 0.85 * D);
  armsWide(b, 0.85 * D);
  spineSide(b, 0.85 * D, -10);
  spineTwist(b, 0.85 * D, 30);
  headTilt(b, 0.85 * D, -10);
  headTurn(b, 0.85 * D, 20);

  // land
  stand(b, D);
  legsAbsorb(b, D);

  b.hipsArc([0, HIPS_Y, 0], 1.0, [0.4, HIPS_Y, 0.6], 0.3 * D, D, 8);
  b.rotateOver("hips", "z", 0, -360, 0.3 * D, D, 8);
  b.rotateOver("hips", "y", 0, 180, 0.3 * D, D, 8);
  return b.build("raiz", NAME);
}

/* ============================ Registry ============================ */
type Factory = () => THREE.AnimationClip;

export const TRICK_FACTORIES: Record<string, Factory> = {
  "back-flip": buildBackFlip,
  "front-flip": buildFrontFlip,
  "side-flip": buildSideFlip,
  gainer: buildGainer,
  corkscrew: buildCorkscrew,
  butterfly: buildButterfly,
  "cheat-kick": buildCheatKick,
  "double-leg": buildDoubleLeg,
  "pop-kick": buildPopKick,
  spider: buildSpider,
  "swing-kick": buildSwingKick,
  lotus: buildLotus,
  full: buildFull,
  webster: buildWebster,
  janitor: buildJanitor,
  aerial: buildAerial,
  "master-swing": buildMasterSwing,
  wrap: buildWrap,
  tuck: buildTuck,
  raiz: buildRaiz,
};

export function buildClipFor(trickId: string): THREE.AnimationClip {
  const f = TRICK_FACTORIES[trickId];
  if (!f) throw new Error(`no animation factory for trick: ${trickId}`);
  return f();
}
