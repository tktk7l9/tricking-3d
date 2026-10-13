import { beforeAll, describe, expect, it } from "vitest";
import * as THREE from "three";
import { Character } from "../../character/Character";
import { TRICKS, type TrickMeta } from "../catalog";
import { buildClipFor } from "./index";

/* Physical plausibility of every clip, measured on the real procedural rig:
 * feet stay on or above the floor, and the foot that leaves the ground last /
 * touches down first matches the catalogue's takeoff / landing legs. */

type Sample = {
  t: number;
  left: number;
  right: number;
  hands: number;
  handL: number;
  handR: number;
  /** world position of the hips */
  hips: THREE.Vector3;
  /** world height and position of the head joint */
  head: number;
  headPos: THREE.Vector3;
  /** yaw of the hips' forward vector in degrees (counter-clockwise positive) and its z and y components */
  yaw: number;
  fwdZ: number;
  fwdY: number;
  /** world position of each foot's ball (the point a planted foot pivots on) and of each palm */
  ballL: THREE.Vector3;
  ballR: THREE.Vector3;
  palmL: THREE.Vector3;
  palmR: THREE.Vector3;
  /** how far each thigh has swung up behind the body (see thighExtension) */
  extL: number;
  extR: number;
};

const SOLE: [number, number, number][] = [
  [0, 0, -0.05],
  [0, 0, 0.15],
];

let character: Character;
beforeAll(async () => {
  character = await Character.load();
});

/** Degrees a thigh has swung up behind the pelvis: 0 = straight down, 90 =
 * horizontal behind, 180 = folded up along the back. 0 while the thigh is in
 * front of the hips or mostly out to the side (abduction is not extension). */
function thighExtension(upLeg: THREE.Object3D, knee: THREE.Object3D, pelvisInverse: THREE.Quaternion): number {
  const d = knee
    .getWorldPosition(new THREE.Vector3())
    .sub(upLeg.getWorldPosition(new THREE.Vector3()))
    .normalize()
    .applyQuaternion(pelvisInverse);
  if (d.z >= 0 || Math.abs(d.x) > 0.71) return 0;
  return (Math.atan2(-d.z, -d.y) * 180) / Math.PI;
}

function sampleClip(trick: TrickMeta, steps = 150): Sample[] {
  const clip = buildClipFor(trick.id);
  const mixer = new THREE.AnimationMixer(character.root);
  const action = mixer.clipAction(clip);
  action.play();
  const out: Sample[] = [];
  const v = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const lowest = (bone: "leftFoot" | "rightFoot") =>
    Math.min(...SOLE.map((p) => character.bones[bone].localToWorld(v.set(...p)).y));
  for (let i = 0; i <= steps; i++) {
    const t = Math.min((clip.duration * i) / steps, clip.duration - 1e-4);
    mixer.setTime(t);
    character.root.updateMatrixWorld(true);
    const handL = character.bones.leftHand.localToWorld(v.set(0.04, 0, 0)).y;
    const handR = character.bones.rightHand.localToWorld(v.set(-0.04, 0, 0)).y;
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(character.bones.hips.getWorldQuaternion(q));
    const pelvisInverse = q.clone().invert();
    const b = character.bones;
    out.push({
      t,
      left: lowest("leftFoot"),
      right: lowest("rightFoot"),
      hands: Math.min(handL, handR),
      handL,
      handR,
      hips: character.bones.hips.getWorldPosition(new THREE.Vector3()),
      head: character.bones.head.getWorldPosition(v).y,
      headPos: character.bones.head.getWorldPosition(new THREE.Vector3()),
      yaw: (Math.atan2(fwd.x, fwd.z) * 180) / Math.PI,
      fwdZ: fwd.z,
      fwdY: fwd.y,
      ballL: b.leftFoot.localToWorld(new THREE.Vector3(0, 0, 0.1)),
      ballR: b.rightFoot.localToWorld(new THREE.Vector3(0, 0, 0.1)),
      palmL: b.leftHand.localToWorld(new THREE.Vector3(0.04, 0, 0)),
      palmR: b.rightHand.localToWorld(new THREE.Vector3(-0.04, 0, 0)),
      extL: thighExtension(b.leftUpLeg, b.leftLeg, pelvisInverse),
      extR: thighExtension(b.rightUpLeg, b.rightLeg, pelvisInverse),
    });
  }
  mixer.stopAllAction();
  mixer.uncacheClip(clip);
  character.resetPose();
  return out;
}

/** Longest stretch where both feet are clearly off the floor. */
function longestFlight(samples: Sample[], clearance = 0.12): [number, number] | null {
  let best: [number, number] | null = null;
  let start = -1;
  for (let i = 0; i < samples.length; i++) {
    const air = samples[i].left > clearance && samples[i].right > clearance;
    if (air && start < 0) start = i;
    if ((!air || i === samples.length - 1) && start >= 0) {
      const end = air ? i : i - 1;
      if (!best || end - start > best[1] - best[0]) best = [start, end];
      start = -1;
    }
  }
  return best;
}

function expectLeg(s: Sample, leg: TrickMeta["takeoff"], what: string) {
  const diff = s.left - s.right;
  if (leg === "both") expect(Math.abs(diff), `${what}: both feet level`).toBeLessThan(0.1);
  else if (leg === "left") expect(diff, `${what}: left foot lower`).toBeLessThan(-0.04);
  else expect(diff, `${what}: right foot lower`).toBeGreaterThan(0.04);
}


describe.each(TRICKS.map((t) => [t.id, t] as const))("%s", (_id, trick) => {
  it("never pushes a foot through the floor and starts and ends standing on it", () => {
    const samples = sampleClip(trick);
    const floor = -0.012;
    for (const s of samples) {
      expect(Math.min(s.left, s.right), `t=${s.t.toFixed(2)}`).toBeGreaterThan(floor);
    }
    const first = samples[0];
    const last = samples[samples.length - 1];
    expect(Math.min(first.left, first.right)).toBeLessThan(0.15);
    expect(Math.min(last.left, last.right)).toBeLessThan(0.15);
  });

  it("takes off from and lands on the catalogued feet", () => {
    const samples = sampleClip(trick);
    const flight = longestFlight(samples);
    if (!flight || samples[flight[1]].t - samples[flight[0]].t < 0.35) {
      // Ground-based transitions (scoot, masterscoot, cartwheel): a hand must touch the floor instead.
      expect(Math.min(...samples.map((s) => s.hands)), "a hand reaches the floor").toBeLessThan(0.05);
      return;
    }
    const [a, b] = flight;
    const onFloor = (s: Sample) => Math.min(s.left, s.right) < 0.03;
    let off = a - 1;
    while (off > 0 && !onFloor(samples[off])) off--;
    let on = b + 1;
    while (on < samples.length - 1 && !onFloor(samples[on])) on++;
    expectLeg(samples[off], trick.takeoff, "takeoff");
    expectLeg(samples[on], trick.landing, "landing");
  });
});

/* Hip range of every clip, including the hand-keyed Builder ones: a thigh may
 * swing behind the body as far as a split, never up over the back (a Builder
 * key more than 180° away from the next one slerps the short way round). */
describe.each(TRICKS.map((t) => [t.id, t] as const))("%s hip range", (_id, trick) => {
  it("never swings a thigh up behind the body past a split", () => {
    for (const s of sampleClip(trick)) {
      expect(Math.max(s.extL, s.extR), `t=${s.t.toFixed(2)}`).toBeLessThan(100);
    }
  });
});

/* Keypoints that name a hand plant, a touchdown or a takeoff sit on the frame
 * where that contact happens in the clip, so the labels and the timeline say
 * what the figure is doing at that moment. */

type ContactEvent = "handL" | "handR" | "L" | "R" | "both" | "takeoff";

/** Which contact a keypoint label names, if any. */
function contactEvent(label: string): ContactEvent | null {
  if (/左手をつく/.test(label)) return "handL";
  if (/右手をつく/.test(label)) return "handR";
  if (/両足[^・]*接地/.test(label)) return "both";
  if (/右足[^・]*接地/.test(label)) return "R";
  if (/左足[^・]*接地|左足を下ろす/.test(label)) return "L";
  if (/踏切|ポップ/.test(label)) return "takeoff";
  return null;
}

/** Sample index where the named contact happens: a hand's first plant; a foot's
 * first touchdown after the main flight (or, without one, after it first left
 * the floor); the last foot leaving the floor before the main flight. */
function contactEventIndex(samples: Sample[], event: ContactEvent): number | undefined {
  const flight = longestFlight(samples);
  const touchdown = (height: (s: Sample) => number) =>
    contacts(samples, height).find(([a]) => (flight ? a > flight[1] : a > 0))?.[0];
  switch (event) {
    case "handL":
      return contacts(samples, (s) => s.handL)[0]?.[0];
    case "handR":
      return contacts(samples, (s) => s.handR)[0]?.[0];
    case "L":
      return touchdown((s) => s.left);
    case "R":
      return touchdown((s) => s.right);
    case "both": {
      const l = touchdown((s) => s.left);
      const r = touchdown((s) => s.right);
      return l === undefined || r === undefined ? undefined : Math.max(l, r);
    }
    case "takeoff": {
      if (!flight) return undefined;
      let i = flight[0] - 1;
      while (i > 0 && Math.min(samples[i].left, samples[i].right) >= 0.03) i--;
      return i + 1;
    }
  }
}

/** How far (normalized clip time) a contact keypoint may sit from its contact. */
const CONTACT_TOLERANCE = 0.02;

const contactKeyed = TRICKS.filter((t) => t.keypoints.some((k) => k.t < 1 && contactEvent(k.label)));

describe.each(contactKeyed.map((t) => [t.id, t] as const))("%s contact keypoints", (_id, trick) => {
  it("sit on the frames where the hand or foot lands or leaves", () => {
    const samples = sampleClip(trick, 300);
    for (const kp of trick.keypoints) {
      const event = kp.t < 1 ? contactEvent(kp.label) : null;
      if (!event) continue;
      const i = contactEventIndex(samples, event);
      expect(i, `${kp.label}: no ${event} contact in the clip`).toBeDefined();
      const u = samples[i!].t / trick.duration;
      expect(Math.abs(kp.t - u), `${kp.label} is keyed at ${kp.t}, the ${event} contact is at ${u.toFixed(3)}`).toBeLessThanOrEqual(
        CONTACT_TOLERANCE,
      );
    }
  });
});

/* The last frame: both feet rest on the floor, unless the trick deliberately
 * ends with one leg held up (listed here, each for a reason its keypoints or
 * contracts state), and then that foot is clearly up and the other is down.
 * No foot ends hovering just off the floor. */

const ENDS_WITH_LEG_UP: Record<string, "left" | "right"> = {
  "gainer-switch": "right", // ready to swing into the next trick
  "gainer-switch-half": "right", // right leg left up behind, as in the gainer switch
  "butterfly-kick-switch": "right", // landed on the switched leg
  scoot: "right", // right leg left behind
  "master-swing": "right", // ready for the next trick
  "touchdown-raiz": "right", // right leg left behind
  "scoot-hyper": "left", // left leg kept in front
};

/** How far above the floor (metres) a foot may end and still count as resting on it. */
const RESTING = 0.005;

describe.each(TRICKS.map((t) => [t.id, t] as const))("%s end", (id, trick) => {
  it("ends with both feet on the floor, or one leg clearly held up", () => {
    const samples = sampleClip(trick);
    const last = samples[samples.length - 1];
    const up = ENDS_WITH_LEG_UP[id];
    if (!up) {
      expect(last.left, "left foot on the floor").toBeLessThan(RESTING);
      expect(last.right, "right foot on the floor").toBeLessThan(RESTING);
      return;
    }
    const [raised, standing] = up === "left" ? [last.left, last.right] : [last.right, last.left];
    expect(standing, "standing foot on the floor").toBeLessThan(RESTING);
    expect(raised, `${up} leg clearly up`).toBeGreaterThan(0.12);
  });
});

/* Contracts specific to the tricks that fill the progression tree (2026-10). */

const byId = (id: string): TrickMeta => TRICKS.find((t) => t.id === id)!;
const inverted = (s: Sample) => s.head < s.hips.y - 0.3;

/** Horizontal distance between two world points. */
const planarDistance = (p: THREE.Vector3, q: THREE.Vector3) => Math.hypot(p.x - q.x, p.z - q.z);

/** Index ranges [first, last] where `height(sample)` is on the floor. */
function contacts(samples: Sample[], height: (s: Sample) => number, eps = 0.03): [number, number][] {
  const out: [number, number][] = [];
  let start = -1;
  samples.forEach((s, i) => {
    const on = height(s) < eps;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      out.push([start, i - 1]);
      start = -1;
    }
  });
  if (start >= 0) out.push([start, samples.length - 1]);
  return out;
}

/** Signed yaw travelled between two times, unwrapped sample to sample (counter-clockwise positive). */
function yawTravel(samples: Sample[], from: number, to: number): number {
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].t < from || samples[i].t > to) continue;
    let d = samples[i].yaw - samples[i - 1].yaw;
    if (d > 180) d -= 360;
    else if (d < -180) d += 360;
    total += d;
  }
  return total;
}

describe("touchdown raiz", () => {
  it("plants the left hand before the left foot lands and keeps the right leg trailing", () => {
    const samples = sampleClip(byId("touchdown-raiz"));
    const [start] = longestFlight(samples)!;
    const after = samples.slice(start);
    const handDown = after.findIndex((s) => s.handL < 0.03);
    const footDown = after.findIndex((s) => Math.min(s.left, s.right) < 0.03);
    expect(handDown, "left hand reaches the floor").toBeGreaterThanOrEqual(0);
    expect(handDown, "hand touches before any foot").toBeLessThan(footDown);
    expect(after[footDown].left, "left foot lands first").toBeLessThan(after[footDown].right - 0.1);
    expect(samples.some(inverted), "goes past horizontal in the air").toBe(true);
    expect(samples.every((s) => s.handR > 0.1), "right hand stays off the floor").toBe(true);
    expect(samples[samples.length - 1].right, "right leg still trailing at the end").toBeGreaterThan(0.15);
  });

  it("keeps the hand planted in one contact until the foot takes over", () => {
    const samples = sampleClip(byId("touchdown-raiz"));
    const [start] = longestFlight(samples)!;
    const after = samples.slice(start);
    const hand = contacts(after, (s) => s.handL);
    expect(hand, "a single hand contact, no bounce").toHaveLength(1);
    const footDown = after.findIndex((s) => s.left < 0.03);
    expect(hand[0][1], "hand still down when the foot lands").toBeGreaterThanOrEqual(footDown - 1);
    const [a, b] = hand[0];
    for (let i = a; i <= b; i++) {
      expect(planarDistance(after[i].palmL, after[a].palmL), `t=${after[i].t.toFixed(2)}: hand stays put`).toBeLessThan(0.05);
    }
  });
});

describe.each(["sideswipe", "cork-swipe"])("%s", (id) => {
  it("inverts, swings the right foot above the hips and lands on it (hyper)", () => {
    const samples = sampleClip(byId(id));
    expect(samples.some(inverted)).toBe(true);
    expect(samples.some((s) => s.right > s.hips.y), "right foot swipes over").toBe(true);
    expect(byId(id).landing).toBe("right");
  });
});

describe("gainer switch", () => {
  it("flips over and lands on the plant foot with the right leg still in the air", () => {
    const samples = sampleClip(byId("gainer-switch"));
    expect(samples.some(inverted)).toBe(true);
    const [, end] = longestFlight(samples)!;
    const grounded = samples.slice(end + 1).filter((s) => s.left < 0.03);
    expect(grounded.length).toBeGreaterThan(10);
    for (const s of grounded) expect(s.right, `t=${s.t.toFixed(2)}: right foot trailing`).toBeGreaterThan(0.15);
  });
});

describe("loser", () => {
  it("flips over while travelling backward", () => {
    const samples = sampleClip(byId("loser"));
    expect(samples.some(inverted)).toBe(true);
    expect(samples[samples.length - 1].hips.z).toBeLessThan(samples[0].hips.z - 0.4);
  });
});

// Overall turn counts from the opening stance: a backside start is already 180°
// round, so the Backside 720 turns ~540° to land facing the target like the
// Cheat 720, and the 900s turn as far as a Tornado plus a full spin.
describe.each([
  ["backside-720", 400, 500, true, "left"],
  ["backside-900", 450, 580, true, "right"],
  ["backside-900-hyper", 500, 600, true, "right"],
  ["cheat-900", 450, 760, false, "right"],
  ["pop-tornado", 250, 400, false, "right"],
  ["pop-540", 350, 500, false, "right"],
  ["pop-720", 500, 650, false, "left"],
  ["swing-900", 450, 760, false, "right"],
  ["backside-900-sidekick", 450, 580, true, "right"],
  ["backside-900-gyro", 800, 900, true, "right"],
  ["cheat-900-hyper", 450, 760, false, "right"],
  ["swing-1080", 650, 1000, false, "left"],
  ["pop-360-gyro", 500, 650, false, "left"],
  ["540-gyro", 550, 800, false, "right"],
  ["cheat-900-gyro", 800, 1100, false, "right"],
  ["pop-900", 600, 750, false, "right"],
  ["pop-360-gyro-round", 600, 750, false, "right"],
] as const)("%s", (id, minAirTurn, minTurn, backside, kickLeg) => {
  it(`turns more than ${minAirTurn}° counter-clockwise in the air (${minTurn}° overall) and kicks the ${kickLeg} foot above hip height`, () => {
    const samples = sampleClip(byId(id));
    const [a, b] = longestFlight(samples)!;
    expect(yawTravel(samples, samples[a].t, samples[b].t), "in the air").toBeGreaterThan(minAirTurn);
    expect(yawTravel(samples, 0, samples[samples.length - 1].t), "overall").toBeGreaterThan(minTurn);
    if (backside) expect(samples[0].fwdZ, "starts with the back to the target").toBeLessThan(-0.9);
    else expect(samples[0].fwdZ, "starts facing the target").toBeGreaterThan(0.9);
    expect(samples.some((s) => (kickLeg === "left" ? s.left : s.right) > s.hips.y)).toBe(true);
  });
});

/* Every contact in every clip: a foot's ball or a hand's palm stays where it
 * came within 3 cm of the floor until it lifts again, so no foot or hand skates
 * while it carries weight, whether stepping, planting a hand or landing. */

type ContactPoint = { name: string; height: (s: Sample) => number; point: (s: Sample) => THREE.Vector3 };

const CONTACT_POINTS: ContactPoint[] = [
  { name: "left foot", height: (s) => s.left, point: (s) => s.ballL },
  { name: "right foot", height: (s) => s.right, point: (s) => s.ballR },
  { name: "left hand", height: (s) => s.handL, point: (s) => s.palmL },
  { name: "right hand", height: (s) => s.handR, point: (s) => s.palmR },
];

/** How far (metres) a planted foot or hand may move across the floor. */
const MAX_CONTACT_DRIFT = 0.05;

describe.each(TRICKS.map((t) => [t.id, t] as const))("%s contacts", (_id, trick) => {
  it("keep every planted foot and hand in place until it lifts", () => {
    const samples = sampleClip(trick, 300);
    const at = (i: number) => (samples[i].t / trick.duration).toFixed(2);
    for (const { name, height, point } of CONTACT_POINTS) {
      for (const [a, b] of contacts(samples, height)) {
        const drift = Math.max(...samples.slice(a, b + 1).map((s) => planarDistance(point(s), point(samples[a]))));
        expect(drift, `${name} on the floor from ${at(a)} to ${at(b)}`).toBeLessThan(MAX_CONTACT_DRIFT);
      }
    }
  });
});

/* Contracts for the third batch (2026-10). */

describe("gumbi", () => {
  it("passes over the right hand, then the left hand, before the left foot lands, never leaving the floor", () => {
    const samples = sampleClip(byId("gumbi"));
    const takeoff = contacts(samples, (s) => s.right).find(([, b]) => samples[b].t > 0.5)!;
    const handR = contacts(samples, (s) => s.handR)[0];
    const handL = contacts(samples, (s) => s.handL)[0];
    const footL = contacts(samples, (s) => s.left).find(([a]) => a > takeoff[1])!;
    expect(handR, "right hand plants").toBeDefined();
    expect(handL, "left hand plants").toBeDefined();
    expect(handR[0], "right hand before the right foot leaves").toBeLessThanOrEqual(takeoff[1]);
    expect(handR[0]).toBeLessThan(handL[0]);
    expect(handL[0]).toBeLessThan(footL[0]);
    // Supported all the way from the right foot to the left foot (a cartwheel, not a flip).
    for (let i = takeoff[1]; i <= footL[0]; i++) {
      const s = samples[i];
      expect(Math.min(s.left, s.right, s.handL, s.handR), `t=${s.t.toFixed(2)}`).toBeLessThan(0.03);
    }
    expect(samples.some(inverted), "upside down over the hands").toBe(true);
  });
});

describe("sailor moon", () => {
  it("plants the right hand just before the right foot leaves and uses no other hand", () => {
    const samples = sampleClip(byId("sailor-moon"));
    const step = contacts(samples, (s) => s.right).find(([, b]) => samples[b].t > 0.5)!;
    const hand = contacts(samples, (s) => s.handR);
    expect(hand, "one right-hand contact").toHaveLength(1);
    expect(hand[0][0], "hand down before the foot leaves").toBeLessThanOrEqual(step[1]);
    expect(samples.every((s) => s.handL > 0.1), "left hand stays off the floor").toBe(true);
    // After the hand lets go the body is fully airborne (no hand or foot down) for a raiz-length flight.
    let end = hand[0][1] + 1;
    while (end < samples.length && Math.min(samples[end].left, samples[end].right, samples[end].handL, samples[end].handR) > 0.03) end++;
    expect(samples[end - 1].t - samples[hand[0][1] + 1].t, "a real raiz flight").toBeGreaterThan(0.4);
  });
});

describe("arabian", () => {
  it("half twists so the flip finishes forward, landing facing the way it travelled", () => {
    const samples = sampleClip(byId("arabian"));
    expect(samples.some(inverted)).toBe(true);
    expect(samples[0].fwdZ, "starts facing forward").toBeGreaterThan(0.9);
    expect(samples[samples.length - 1].fwdZ, "lands facing back").toBeLessThan(-0.9);
    expect(samples[samples.length - 1].hips.z, "travels backward").toBeLessThan(samples[0].hips.z - 0.3);
  });
});

describe("corkscrew hyper", () => {
  it("inverts and lands on the right foot without a kick", () => {
    const samples = sampleClip(byId("corkscrew-hyper"));
    const lastInverted = samples.reduce((acc, s, i) => (inverted(s) ? i : acc), -1);
    expect(lastInverted).toBeGreaterThan(0);
    // Once upright again the right leg stays under the body (the swipe kicks it out to hip height).
    const upright = samples.slice(lastInverted).filter((s) => s.head > s.hips.y + 0.4);
    expect(upright.length).toBeGreaterThan(10);
    for (const s of upright) {
      expect(s.hips.y - s.right, `t=${s.t.toFixed(2)}: no swipe`).toBeGreaterThan(0.45);
    }
  });
});

describe("aerial twist", () => {
  it("inverts and lands complete (left foot) where the aerial lands hyper", () => {
    const samples = sampleClip(byId("aerial-twist"));
    expect(samples.some(inverted)).toBe(true);
    expect(byId("aerial").landing).toBe("right");
    expect(byId("aerial-twist").landing).toBe("left");
    expect(samples[samples.length - 1].fwdZ, "ends facing the way it started").toBeGreaterThan(0.9);
  });
});

/* Contracts for the fourth batch (2026-10). */

describe("tornado sidekick", () => {
  it("drives the straight right leg out at hip height toward the target, side on", () => {
    const samples = sampleClip(byId("tornado-sidekick"));
    const [a, b] = longestFlight(samples)!;
    const air = samples.slice(a, b + 1);
    const kick = air.reduce((best, s) => (s.right > best.right ? s : best));
    expect(kick.right, "foot at hip height").toBeGreaterThan(kick.hips.y - 0.1);
    expect(kick.ballR.distanceTo(kick.hips), "leg straight").toBeGreaterThan(0.85);
    expect(kick.ballR.z - kick.hips.z, "toward the target").toBeGreaterThan(0.6);
    expect(Math.abs(kick.fwdZ), "body side on to the target").toBeLessThan(0.5);
  });
});

describe("x-out", () => {
  it("splits the legs wide at the top of the back flip and closes them to land", () => {
    const samples = sampleClip(byId("x-out"));
    expect(samples.some(inverted)).toBe(true);
    const [a, b] = longestFlight(samples)!;
    const spread = Math.max(...samples.slice(a, b + 1).map((s) => s.ballL.distanceTo(s.ballR)));
    expect(spread, "feet far apart in the air").toBeGreaterThan(1.2);
    expect(samples[samples.length - 1].hips.z, "travels backward").toBeLessThan(samples[0].hips.z - 0.2);
  });
});

describe.each([
  ["gainer-arabian", 1],
  ["front-half", 1],
  ["webster-half", 1],
] as const)("%s", (id, direction) => {
  it("flips over with a half twist, landing facing back while travelling forward", () => {
    const samples = sampleClip(byId(id));
    expect(samples.some(inverted)).toBe(true);
    expect(samples[0].fwdZ, "starts facing forward").toBeGreaterThan(0.9);
    expect(samples[samples.length - 1].fwdZ, "lands facing back").toBeLessThan(-0.9);
    expect(direction * (samples[samples.length - 1].hips.z - samples[0].hips.z), "travels forward").toBeGreaterThan(0.3);
  });
});

describe("gainer arabian", () => {
  it("takes off from the left foot with the right leg swung up", () => {
    const samples = sampleClip(byId("gainer-arabian"));
    const [a] = longestFlight(samples)!;
    const takeoff = samples.slice(0, a).filter((s) => s.left < 0.03 && s.right > s.hips.y - 0.3);
    expect(takeoff.length, "right leg swings up while the left foot is still down").toBeGreaterThan(0);
  });
});

describe("roundoff", () => {
  it("places the left hand, then the right, and lands on both feet at once facing back the way it came", () => {
    const samples = sampleClip(byId("roundoff"));
    expect(samples.some(inverted)).toBe(true);
    const handL = contacts(samples, (s) => s.handL)[0];
    const handR = contacts(samples, (s) => s.handR)[0];
    expect(handL, "left hand plants").toBeDefined();
    expect(handR, "right hand plants").toBeDefined();
    expect(handL[0]).toBeLessThan(handR[0]);
    const [, end] = longestFlight(samples)!;
    const left = contacts(samples, (s) => s.left).find(([i]) => i > end)!;
    const right = contacts(samples, (s) => s.right).find(([i]) => i > end)!;
    expect(Math.abs(left[0] - right[0]), "both feet touch down together").toBeLessThanOrEqual(1);
    const last = samples[samples.length - 1];
    expect(Math.abs(last.yaw + 90), "faces back along the cartwheel line (-X)").toBeLessThan(15);
    expect(last.hips.x - samples[0].hips.x, "travels to the left").toBeGreaterThan(1);
  });
});

describe("one-handed cartwheel", () => {
  it("passes over the left hand only and stays supported from the left foot to the right foot", () => {
    const samples = sampleClip(byId("one-handed-cartwheel"));
    expect(samples.some(inverted)).toBe(true);
    expect(contacts(samples, (s) => s.handL), "one left-hand contact").toHaveLength(1);
    expect(Math.min(...samples.map((s) => s.handR)), "right hand stays off the floor").toBeGreaterThan(0.1);
    const step = contacts(samples, (s) => s.left)[0];
    const footR = contacts(samples, (s) => s.right).find(([i]) => i > step[1])!;
    for (let i = step[1]; i <= footR[0]; i++) {
      const s = samples[i];
      expect(Math.min(s.left, s.right, s.handL), `t=${s.t.toFixed(2)}`).toBeLessThan(0.03);
    }
  });
});

describe("doubleleg twist", () => {
  it("adds a full twist to the doubleleg and lands complete (left foot)", () => {
    const twist = sampleClip(byId("doubleleg-twist"));
    const base = sampleClip(byId("double-leg"));
    const airTurn = (samples: Sample[]) => {
      const [a, b] = longestFlight(samples)!;
      return yawTravel(samples, samples[a].t, samples[b].t);
    };
    expect(airTurn(twist) - airTurn(base), "an extra turn in the air").toBeGreaterThan(270);
    expect(byId("double-leg").landing).toBe("both");
    expect(byId("doubleleg-twist").landing).toBe("left");
    expect(twist.some(inverted), "the hips never rise over the chest").toBe(false);
  });
});

/* Contracts for the fifth batch (2026-10). */

describe("back pike", () => {
  it("folds the straight legs up to the chest over the top of the back flip", () => {
    const samples = sampleClip(byId("back-pike"));
    expect(samples.some(inverted)).toBe(true);
    const [a, b] = longestFlight(samples)!;
    const piked = samples
      .slice(a, b + 1)
      .some((s) => s.ballL.distanceTo(s.headPos) < 0.8 && s.ballL.distanceTo(s.hips) > 0.85 && s.ballR.distanceTo(s.hips) > 0.85);
    expect(piked, "feet near the head with the knees straight").toBe(true);
    expect(samples[samples.length - 1].hips.z, "travels backward").toBeLessThan(samples[0].hips.z - 0.2);
  });
});

describe("front x-out", () => {
  it("splits the legs wide at the top of the front flip and closes them to land", () => {
    const samples = sampleClip(byId("front-x-out"));
    expect(samples.some(inverted)).toBe(true);
    const [a, b] = longestFlight(samples)!;
    const spread = Math.max(...samples.slice(a, b + 1).map((s) => s.ballL.distanceTo(s.ballR)));
    expect(spread, "feet far apart in the air").toBeGreaterThan(1.2);
    expect(samples[samples.length - 1].hips.z, "travels forward").toBeGreaterThan(samples[0].hips.z + 0.3);
  });
});

describe("butterfly kick switch", () => {
  it("lands on the left foot with the right leg still up, where the butterfly kick lands on the right", () => {
    expect(byId("butterfly").landing).toBe("right");
    const samples = sampleClip(byId("butterfly-kick-switch"));
    const [, end] = longestFlight(samples)!;
    const after = samples.slice(end + 1);
    const down = after.findIndex((s) => Math.min(s.left, s.right) < 0.03);
    expect(after[down].left, "left foot down first").toBeLessThan(0.03);
    for (const s of after.slice(down)) expect(s.right, `t=${s.t.toFixed(2)}: right leg up behind`).toBeGreaterThan(0.12);
  });
});

describe("scoot hyper", () => {
  it("lands on the right foot after the hand and keeps the left leg up to the end", () => {
    const samples = sampleClip(byId("scoot-hyper"));
    const hand = contacts(samples, (s) => s.handL);
    expect(hand, "one left-hand plant").toHaveLength(1);
    const [, handUp] = hand[0];
    const footR = contacts(samples, (s) => s.right).find(([i]) => i > 0)!;
    expect(footR[0], "right foot back down by the time the hand lifts").toBeLessThanOrEqual(handUp + 1);
    const leftStep = contacts(samples, (s) => s.left)[0];
    for (const s of samples.slice(leftStep[1] + 1)) expect(s.left, `t=${s.t.toFixed(2)}: left foot up`).toBeGreaterThan(0.03);
  });
});

describe("sailor moon round", () => {
  it("plants only the right hand, then kicks the right foot above the hips before the left foot lands", () => {
    const samples = sampleClip(byId("sailor-moon-round"));
    expect(contacts(samples, (s) => s.handR), "one right-hand contact").toHaveLength(1);
    expect(samples.every((s) => s.handL > 0.1), "left hand stays off the floor").toBe(true);
    const lastInverted = samples.reduce((acc, s, i) => (inverted(s) ? i : acc), -1);
    expect(lastInverted).toBeGreaterThan(0);
    const [, end] = longestFlight(samples)!;
    const kick = samples.slice(lastInverted, end + 1).some((s) => s.right > s.hips.y);
    expect(kick, "round kick after the spin").toBe(true);
  });
});

describe("spyder twist", () => {
  it("turns over (chest up) in the air, which the Spyder never does", () => {
    const horizontalChestUp = (s: Sample) => s.fwdY > 0.6 && Math.abs(s.head - s.hips.y) < 0.35;
    const air = (samples: Sample[]) => {
      const [a, b] = longestFlight(samples)!;
      return samples.slice(a, b + 1);
    };
    expect(air(sampleClip(byId("spyder-twist"))).some(horizontalChestUp)).toBe(true);
    expect(air(sampleClip(byId("spider"))).some(horizontalChestUp)).toBe(false);
  });
});

/* Contracts for the sixth batch (2026-10). */

describe("front pike", () => {
  it("folds the straight legs up to the chest over the top of the front flip", () => {
    const samples = sampleClip(byId("front-pike"));
    expect(samples.some(inverted)).toBe(true);
    const [a, b] = longestFlight(samples)!;
    const piked = samples
      .slice(a, b + 1)
      .some((s) => s.ballL.distanceTo(s.headPos) < 0.8 && s.ballL.distanceTo(s.hips) > 0.85 && s.ballR.distanceTo(s.hips) > 0.85);
    expect(piked, "feet near the head with the knees straight").toBe(true);
    expect(samples[samples.length - 1].hips.z, "travels forward").toBeGreaterThan(samples[0].hips.z + 0.3);
  });
});

describe.each([
  ["webster-x-out", "webster"],
  ["gainer-x-out", "gainer"],
] as const)("%s", (id, base) => {
  it(`splits the legs wide upside down, which the ${base} does not, and travels forward`, () => {
    const spread = (trickId: string) =>
      Math.max(...sampleClip(byId(trickId)).filter(inverted).map((s) => s.ballL.distanceTo(s.ballR)));
    const samples = sampleClip(byId(id));
    expect(samples.some(inverted)).toBe(true);
    expect(spread(id), "feet far apart upside down").toBeGreaterThan(1.2);
    expect(spread(base), `the ${base} keeps its legs together`).toBeLessThan(1.2);
    expect(samples[samples.length - 1].hips.z - samples[0].hips.z, "travels forward").toBeGreaterThan(0.3);
  });
});

/** Lying flat in the air with the chest facing up (the twist of a butterfly twist). */
const chestUpFlat = (s: Sample) => s.fwdY > 0.6 && Math.abs(s.head - s.hips.y) < 0.35;

/** Both feet above the hips (the V of a doubleleg). */
const legsUp = (s: Sample) => s.left > s.hips.y && s.right > s.hips.y;

describe.each([
  ["corkscrew-round", inverted],
  ["sideflip-round", inverted],
  ["butterfly-twist-round", chestUpFlat],
  ["full-round", inverted],
  ["wrap-full-round", inverted],
  ["doubleleg-twist-round", legsUp],
  ["tak-full-round", inverted],
  ["spyder-twist-round", chestUpFlat],
  ["full-swipe", inverted],
  ["butterfly-twist-swipe", chestUpFlat],
  ["tak-full-swipe", inverted],
  ["wrap-full-swipe", inverted],
] as const)("%s", (id, turnedOver) => {
  it("kicks the right foot alone above the hips, body upright, once it has turned over, before landing", () => {
    const samples = sampleClip(byId(id));
    const last = samples.reduce((acc, s, i) => (turnedOver(s) ? i : acc), -1);
    expect(last, "turns over in the air").toBeGreaterThan(0);
    const [, end] = longestFlight(samples)!;
    const kick = (s: Sample) => s.head > s.hips.y + 0.3 && s.right > s.hips.y && s.left < s.hips.y;
    expect(samples.slice(last, end + 1).some(kick), "round kick after turning over").toBe(true);
  });
});

describe("double sideflip", () => {
  it("goes upside down twice in one jump, where the sideflip goes over once", () => {
    const timesInverted = (id: string) =>
      sampleClip(byId(id)).filter((s, i, all) => inverted(s) && (i === 0 || !inverted(all[i - 1]))).length;
    expect(timesInverted("double-sideflip")).toBe(2);
    expect(timesInverted("side-flip")).toBe(1);
  });
});

describe.each([
  ["cheat-900-sidekick", 450],
  ["backside-900-sidekick", 450],
  ["doubleleg-sidekick", 300],
] as const)("%s", (id, minTurn) => {
  it(`drives the straight right leg out at hip height toward the target, side on, after turning ${minTurn}°`, () => {
    const samples = sampleClip(byId(id));
    const [a, b] = longestFlight(samples)!;
    const air = samples.slice(a, b + 1);
    // The kick is where the right foot reaches furthest toward the target.
    const kick = air.reduce((best, s) => (s.ballR.z - s.hips.z > best.ballR.z - best.hips.z ? s : best));
    expect(kick.right, "foot at hip height").toBeGreaterThan(kick.hips.y - 0.1);
    expect(kick.ballR.distanceTo(kick.hips), "leg straight").toBeGreaterThan(0.85);
    expect(kick.ballR.z - kick.hips.z, "toward the target").toBeGreaterThan(0.6);
    expect(Math.abs(kick.fwdZ), "body side on to the target").toBeLessThan(0.5);
    expect(yawTravel(samples, samples[a].t, kick.t), "turns before the kick").toBeGreaterThan(minTurn);
  });
});

/* Contracts for the seventh batch (2026-10). */

/** Separate stretches of the clip where `up` holds. */
const stretches = (samples: Sample[], up: (s: Sample) => boolean) =>
  samples.filter((s, i) => up(s) && (i === 0 || !up(samples[i - 1]))).length;

describe.each([
  ["tornado-double", "cheat-kick"],
  ["cheat-900-double", "cheat-900"],
  ["cheat-900-double-hyper", "cheat-900-hyper"],
] as const)("%s", (id, base) => {
  it(`kicks the right foot above the hips twice in the air, where the ${base} kicks once`, () => {
    const kicks = (trickId: string) => {
      const samples = sampleClip(byId(trickId));
      const [a, b] = longestFlight(samples)!;
      return stretches(samples.slice(a, b + 1), (s) => s.right > s.hips.y);
    };
    expect(kicks(id)).toBe(2);
    expect(kicks(base)).toBe(1);
  });
});

describe.each([
  ["cheat-feilong", "cheat-kick"],
  ["cheat-900-feilong", "cheat-900"],
  ["pop-feilong", "pop-tornado"],
] as const)("%s", (id, base) => {
  it("swings the straight left leg up above the hips before the right leg's round kick", () => {
    const crescent = (s: Sample) => s.left > s.hips.y && s.ballL.distanceTo(s.hips) > 0.85;
    const samples = sampleClip(byId(id));
    const first = samples.findIndex(crescent);
    expect(first, "left leg crescent").toBeGreaterThan(0);
    const round = samples.findIndex((s, i) => i > first && !crescent(s) && s.right > s.hips.y);
    expect(round, "then the right round kick").toBeGreaterThan(first);
    expect(sampleClip(byId(base)).some(crescent), `the ${base} drives the left knee instead`).toBe(false);
  });
});

describe.each(["front-axe", "webster-axe", "arabian-axe"])("%s", (id) => {
  it("opens the straight right leg up over the top with the left folded, then lands on the right foot", () => {
    const samples = sampleClip(byId(id));
    const [a, b] = longestFlight(samples)!;
    const axe = samples
      .slice(a, b + 1)
      .some((s) => s.right > s.hips.y + 0.5 && s.ballR.distanceTo(s.hips) > 0.85 && s.ballL.distanceTo(s.hips) < 0.65);
    expect(axe, "right leg straight up, left leg folded").toBe(true);
    expect(samples.some(inverted)).toBe(true);
  });
});

describe("janitor twist", () => {
  it("turns over (chest up) while flat in the air, which the janitor never does", () => {
    const air = (id: string) => {
      const samples = sampleClip(byId(id));
      const [a, b] = longestFlight(samples)!;
      return samples.slice(a, b + 1);
    };
    expect(air("janitor-twist").some(chestUpFlat)).toBe(true);
    expect(air("janitor").some(chestUpFlat)).toBe(false);
  });
});

/* Contracts for the eighth batch (2026-10). */

describe.each([
  ["cheat-900-hyper", "cheat-900"],
  ["full-hyper", "full"],
  ["butterfly-twist-hyper", "butterfly-twist"],
  ["full-swipe", "full"],
  ["butterfly-twist-swipe", "butterfly-twist"],
  ["wrap-full-hyper", "wrap"],
  ["tak-full-swipe", "tak"],
  ["wrap-full-swipe", "wrap"],
  ["sailor-moon-hyperhook", "sailor-moon"],
  ["pop-900-hyper", "pop-900"],
  ["cheat-900-double-hyper", "cheat-900-double"],
  ["raiz-hyperhook", "raiz"],
  ["double-butterfly-twist-hyper", "double-butterfly-twist"],
] as const)("%s", (id, base) => {
  it(`lands on the right foot and keeps the left leg up for a moment, where the ${base} does not land on the right`, () => {
    expect(byId(base).landing).not.toBe("right");
    const samples = sampleClip(byId(id));
    const [, end] = longestFlight(samples)!;
    const after = samples.slice(end + 1);
    const down = after.findIndex((s) => Math.min(s.left, s.right) < 0.03);
    expect(after[down].right, "right foot down first").toBeLessThan(0.03);
    const held = after.slice(down, down + 8);
    for (const s of held) expect(s.left, `t=${s.t.toFixed(2)}: left leg still up`).toBeGreaterThan(0.1);
  });
});

describe.each([
  ["arabian-x-out", "arabian", inverted],
  ["doubleleg-x-out", "double-leg", (s: Sample) => s.hips.y > 1.2],
] as const)("%s", (id, base, during) => {
  it(`splits the legs wide in the air, which the ${base} does not`, () => {
    const spread = (trickId: string) => {
      const samples = sampleClip(byId(trickId));
      const [a, b] = longestFlight(samples)!;
      return Math.max(...samples.slice(a, b + 1).filter(during).map((s) => s.ballL.distanceTo(s.ballR)));
    };
    expect(spread(id), "feet far apart").toBeGreaterThan(1.2);
    expect(spread(base), `the ${base} keeps its legs together`).toBeLessThan(1.2);
  });
});

/* Contracts for the ninth batch (2026-10). */

describe("arabian half", () => {
  it("twists a full turn and lands facing the way it started, where the arabian lands facing back", () => {
    const ends = (id: string) => {
      const samples = sampleClip(byId(id));
      expect(samples.some(inverted)).toBe(true);
      return [samples[0].fwdZ, samples[samples.length - 1].fwdZ];
    };
    const [start, end] = ends("arabian-half");
    expect(start, "starts facing the target").toBeGreaterThan(0.9);
    expect(end, "lands facing the target").toBeGreaterThan(0.9);
    expect(ends("arabian")[1], "the arabian lands facing back").toBeLessThan(-0.9);
  });
});

describe("x-out full", () => {
  it("splits the legs wide upside down, then turns side on in the air (the twist), which the x-out never does", () => {
    const sideOn = (s: Sample) => Math.abs(Math.sin((s.yaw * Math.PI) / 180)) > 0.8 && Math.abs(s.fwdY) < 0.6;
    const air = (id: string) => {
      const samples = sampleClip(byId(id));
      const [a, b] = longestFlight(samples)!;
      return samples.slice(a, b + 1);
    };
    const flight = air("x-out-full");
    expect(Math.max(...flight.filter(inverted).map((s) => s.ballL.distanceTo(s.ballR))), "feet far apart upside down").toBeGreaterThan(1.2);
    expect(flight.some(sideOn), "turns side on").toBe(true);
    expect(air("x-out").some(sideOn), "the x-out stays square").toBe(false);
  });
});

/* Contracts for the tenth batch (2026-10). */

describe("butterfly twist axe", () => {
  it("raises the straight right leg above the head after the twist, which the butterfly twist never does", () => {
    const axe = (s: Sample) => s.right > s.head && s.ballR.distanceTo(s.hips) > 0.85;
    const afterTwist = (id: string) => {
      const samples = sampleClip(byId(id));
      const last = samples.reduce((acc, s, i) => (chestUpFlat(s) ? i : acc), -1);
      expect(last, "twists flat in the air").toBeGreaterThan(0);
      return samples.slice(last);
    };
    expect(afterTwist("butterfly-twist-axe").some(axe)).toBe(true);
    expect(afterTwist("butterfly-twist").some(axe)).toBe(false);
  });
});

describe("gainer switch half", () => {
  it("lands on the left foot facing back, the right leg still up, where the gainer switch lands facing forward", () => {
    const samples = sampleClip(byId("gainer-switch-half"));
    expect(samples.some(inverted)).toBe(true);
    const [, end] = longestFlight(samples)!;
    const grounded = samples.slice(end + 1).filter((s) => s.left < 0.03);
    expect(grounded.length).toBeGreaterThan(10);
    for (const s of grounded) expect(s.right, `t=${s.t.toFixed(2)}: right foot trailing`).toBeGreaterThan(0.15);
    expect(samples[0].fwdZ, "starts facing forward").toBeGreaterThan(0.9);
    expect(samples[samples.length - 1].fwdZ, "lands facing back").toBeLessThan(-0.9);
    const gainerSwitch = sampleClip(byId("gainer-switch"));
    expect(gainerSwitch[gainerSwitch.length - 1].fwdZ, "the gainer switch lands facing forward").toBeGreaterThan(0.9);
  });
});

describe("sailor moon doubleleg", () => {
  it("swings both legs up together after going upside down, which the sailor moon does not", () => {
    const afterInverted = (id: string) => {
      const samples = sampleClip(byId(id));
      const last = samples.reduce((acc, s, i) => (inverted(s) ? i : acc), -1);
      expect(last, "goes upside down").toBeGreaterThan(0);
      return samples.slice(last + 1);
    };
    expect(afterInverted("sailor-moon-doubleleg").some(legsUp)).toBe(true);
    expect(afterInverted("sailor-moon").some(legsUp)).toBe(false);
  });
});

/* Contracts for the eleventh batch (2026-10). */

/** Body-relative direction (degrees, counter-clockwise positive) of a point seen from the hips. */
const bearing = (s: Sample, p: THREE.Vector3) => {
  let d = (Math.atan2(p.x - s.hips.x, p.z - s.hips.z) * 180) / Math.PI - s.yaw;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
};

/** The hawkeye: with the body upright, the straight right leg out to its right side at about hip height. */
const hawkeye = (s: Sample) =>
  s.head > s.hips.y + 0.3 &&
  s.right > s.hips.y - 0.15 &&
  s.ballR.distanceTo(s.hips) > 0.85 &&
  bearing(s, s.ballR) < -60 &&
  bearing(s, s.ballR) > -120;

describe.each([
  ["tornado-hawkeye", "cheat-kick"],
  ["butterfly-twist-hawkeye", "butterfly-twist-round"],
] as const)("%s", (id, base) => {
  it(`drives the straight right leg out to the body's right side at hip height, which the ${base} never does`, () => {
    expect(sampleClip(byId(id)).some(hawkeye)).toBe(true);
    expect(sampleClip(byId(base)).some(hawkeye)).toBe(false);
  });
});

describe.each([
  ["cheat-720-double", "cheat-720"],
  ["pop-720-double", "pop-720"],
] as const)("%s", (id, base) => {
  it(`straightens the left leg above the hips twice in the air, where the ${base} does it once`, () => {
    const kicks = (trickId: string) => {
      const samples = sampleClip(byId(trickId));
      const [a, b] = longestFlight(samples)!;
      return stretches(samples.slice(a, b + 1), (s) => s.left > s.hips.y && s.ballL.distanceTo(s.hips) > 0.85);
    };
    expect(kicks(id)).toBe(2);
    expect(kicks(base)).toBe(1);
  });
});

describe("full down", () => {
  it("goes upside down untwisted and turns side on only after, where the full twists on the way up", () => {
    const sideOn = (s: Sample) => Math.abs(Math.sin((s.yaw * Math.PI) / 180)) > 0.8 && Math.abs(s.fwdY) < 0.6;
    const order = (id: string) => {
      const samples = sampleClip(byId(id));
      return [samples.findIndex(inverted), samples.findIndex(sideOn)];
    };
    const [inv, side] = order("full-down");
    expect(inv).toBeGreaterThan(0);
    expect(side, "twists after going upside down").toBeGreaterThan(inv);
    const [fullInv, fullSide] = order("full");
    expect(fullSide, "the full twists before").toBeLessThan(fullInv);
  });
});

describe("gainer scissor", () => {
  it("grabs the right leg with the right hand at the top, which the gainer arabian never does", () => {
    const grab = (s: Sample) => s.palmR.distanceTo(s.ballR) < 0.4 && inverted(s);
    expect(sampleClip(byId("gainer-scissor")).some(grab)).toBe(true);
    expect(sampleClip(byId("gainer-arabian")).some(grab)).toBe(false);
  });
});

describe.each([
  ["double-butterfly-twist", 2, "butterfly-twist", 1],
  ["double-butterfly-twist-hyper", 2, "butterfly-twist-hyper", 1],
  ["triple-butterfly-twist", 3, "double-butterfly-twist", 2],
] as const)("%s", (id, count, base, baseCount) => {
  it(`turns chest up ${count} times while flat in the air, where the ${base} does it ${baseCount === 1 ? "once" : "twice"}`, () => {
    const twists = (trickId: string) => {
      const samples = sampleClip(byId(trickId), 300);
      const [a, b] = longestFlight(samples)!;
      return stretches(samples.slice(a, b + 1), chestUpFlat);
    };
    expect(twists(id)).toBe(count);
    expect(twists(base)).toBe(baseCount);
  });
});

describe("butterfly twist doubleleg", () => {
  it("swings both legs up together after the twist, which the butterfly twist never does", () => {
    const afterTwist = (id: string) => {
      const samples = sampleClip(byId(id));
      const last = samples.reduce((acc, s, i) => (chestUpFlat(s) ? i : acc), -1);
      expect(last, "twists flat in the air").toBeGreaterThan(0);
      return samples.slice(last);
    };
    expect(afterTwist("butterfly-twist-doubleleg").some(legsUp)).toBe(true);
    expect(afterTwist("butterfly-twist").some(legsUp)).toBe(false);
  });
});

describe("sailor moon doubleleg twist", () => {
  it("twists a full turn after the doubleleg, which the sailor moon doubleleg does not", () => {
    const turnAfterDoubleleg = (id: string) => {
      const samples = sampleClip(byId(id));
      const last = samples.reduce((acc, s, i) => (legsUp(s) ? i : acc), -1);
      expect(last, "doubleleg").toBeGreaterThan(0);
      const [, end] = longestFlight(samples)!;
      return yawTravel(samples, samples[last].t, samples[end].t);
    };
    expect(turnAfterDoubleleg("sailor-moon-doubleleg-twist")).toBeGreaterThan(250);
    expect(turnAfterDoubleleg("sailor-moon-doubleleg")).toBeLessThan(100);
  });
});

/* Contracts for the twelfth batch (2026-10). */

describe.each([
  ["pop-360-shuriken", "pop-kick"],
  ["cheat-720-shuriken", "cheat-720"],
] as const)("%s", (id, base) => {
  it(`lands on the left (kicking) foot and keeps the right leg up for a moment, where the ${base} does not land on the left`, () => {
    expect(byId(base).landing).not.toBe("left");
    const samples = sampleClip(byId(id));
    const [start, end] = longestFlight(samples)!;
    expect(samples.slice(start, end + 1).some((s) => s.left > s.hips.y), "left foot kicks above the hips").toBe(true);
    const after = samples.slice(end + 1);
    const down = after.findIndex((s) => Math.min(s.left, s.right) < 0.03);
    expect(after[down].left, "left foot down first").toBeLessThan(0.03);
    const held = after.slice(down, down + 8);
    for (const s of held) expect(s.right, `t=${s.t.toFixed(2)}: right leg still up`).toBeGreaterThan(0.1);
  });
});

/** In the air with the body lying flat (chest down in the butterfly and janitor dives). */
const flatInAir = (s: Sample) => s.left > 0.12 && s.right > 0.12 && Math.abs(s.head - s.hips.y) < 0.35;
/** The scissor: the right hand on the semi-piked right leg. */
const scissorGrab = (s: Sample) => s.palmR.distanceTo(s.ballR) < 0.4;

describe.each([
  ["arabian-scissor", "arabian", inverted],
  ["butterfly-kick-scissor", "butterfly", flatInAir],
  ["janitor-scissor-twist", "janitor-twist", flatInAir],
  ["full-scissor", "full", (s: Sample) => s.left > 0.12 && s.right > 0.12],
] as const)("%s", (id, base, during) => {
  it(`grabs the right leg with the right hand in the air, which the ${base} never does`, () => {
    const grabs = (trickId: string) => sampleClip(byId(trickId)).some((s) => scissorGrab(s) && during(s));
    expect(grabs(id)).toBe(true);
    expect(grabs(base)).toBe(false);
  });
});

describe("janitor scissor twist", () => {
  it("grabs before the twist turns the chest up", () => {
    const samples = sampleClip(byId("janitor-scissor-twist"));
    const grab = samples.findIndex((s) => scissorGrab(s) && flatInAir(s));
    const twist = samples.findIndex(chestUpFlat);
    expect(grab).toBeGreaterThan(0);
    expect(twist, "twists chest up after the grab").toBeGreaterThan(grab);
  });
});

describe.each([
  ["cheat-720-twist", "raiz"],
  ["sailor-moon-twist", "sailor-moon"],
] as const)("%s", (twistId, base) => {
  it(`turns chest down while flat on the tilted spin (a full twist), which the ${base} never does`, () => {
    const chestDownFlat = (s: Sample) => s.fwdY < -0.6 && Math.abs(s.head - s.hips.y) < 0.35;
    const air = (id: string) => {
      const samples = sampleClip(byId(id));
      const [a, b] = longestFlight(samples)!;
      return samples.slice(a, b + 1);
    };
    expect(air(twistId).some(chestDownFlat)).toBe(true);
    expect(air(base).some(chestDownFlat)).toBe(false);
  });
});

/* Contracts for the thirteenth batch (2026-10). */

describe.each([
  ["full-late-round", "full-round"],
  ["full-scissor", "full"],
] as const)("%s", (id, base) => {
  it(`lands on the left foot facing the way it travelled (mega), where the ${base} lands facing back`, () => {
    const end = (trickId: string) => {
      const samples = sampleClip(byId(trickId));
      const [, b] = longestFlight(samples)!;
      const last = samples[samples.length - 1];
      return { first: samples[b + 1], last, travel: last.hips.z - samples[0].hips.z };
    };
    const mine = end(id);
    expect(mine.travel, "travels backwards").toBeLessThan(-0.2);
    expect(mine.first.left, "left foot down first").toBeLessThan(mine.first.right);
    expect(mine.last.fwdZ, "faces the way it travelled").toBeLessThan(-0.9);
    expect(end(base).last.fwdZ, `the ${base} faces back the way it came`).toBeGreaterThan(0.9);
  });
});

describe("full late round", () => {
  it("kicks the right foot above the hips with the body upright in the air", () => {
    const samples = sampleClip(byId("full-late-round"));
    const [a, b] = longestFlight(samples)!;
    expect(samples.slice(a, b + 1).some((s) => s.right > s.hips.y && s.head > s.hips.y)).toBe(true);
  });
});

describe.each([
  ["sailor-moon-hyperhook", "sailor-moon"],
  ["raiz-hyperhook", "raiz"],
] as const)("%s", (id, base) => {
  it(`hooks the straight left leg above the hips once upright, which the ${base} never does`, () => {
    const hook = (s: Sample) => s.head > s.hips.y + 0.3 && s.left > s.hips.y && s.ballL.distanceTo(s.hips) > 0.85;
    expect(sampleClip(byId(id)).some(hook)).toBe(true);
    expect(sampleClip(byId(base)).some(hook)).toBe(false);
  });
});

/* Contracts for the fourteenth batch (2026-10). */

describe("double full", () => {
  it("turns side on four times in the air (two twists), where the full does it twice", () => {
    const sideOn = (s: Sample) => Math.abs(Math.sin((s.yaw * Math.PI) / 180)) > 0.8 && Math.abs(s.fwdY) < 0.6;
    const twists = (id: string) => {
      const samples = sampleClip(byId(id), 300);
      const [a, b] = longestFlight(samples)!;
      return stretches(samples.slice(a, b + 1), sideOn);
    };
    expect(twists("double-full")).toBe(4);
    expect(twists("full")).toBe(2);
  });
});

describe("full doubleleg", () => {
  it("swings both legs up together with the body upright in the air, which the full never does", () => {
    const doubleleg = (id: string) => {
      const samples = sampleClip(byId(id));
      const [a, b] = longestFlight(samples)!;
      return samples.slice(a, b + 1).some((s) => legsUp(s) && s.head > s.hips.y + 0.3);
    };
    expect(doubleleg("full-doubleleg")).toBe(true);
    expect(doubleleg("full")).toBe(false);
  });
});
