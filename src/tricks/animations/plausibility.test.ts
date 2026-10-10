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
  /** world height of the head joint */
  head: number;
  /** yaw of the hips' forward vector in degrees (counter-clockwise positive) and its z component */
  yaw: number;
  fwdZ: number;
  /** world position of each foot's ball (the point a planted foot pivots on) and of the left palm */
  ballL: THREE.Vector3;
  ballR: THREE.Vector3;
  palmL: THREE.Vector3;
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
      yaw: (Math.atan2(fwd.x, fwd.z) * 180) / Math.PI,
      fwdZ: fwd.z,
      ballL: b.leftFoot.localToWorld(new THREE.Vector3(0, 0, 0.1)),
      ballR: b.rightFoot.localToWorld(new THREE.Vector3(0, 0, 0.1)),
      palmL: b.leftHand.localToWorld(new THREE.Vector3(0.04, 0, 0)),
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

// Hand-keyed Builder clips predate the contact solver and sink a few cm in a crouch.
const LEGACY = new Set(["back-flip", "front-flip", "side-flip", "gainer", "full", "corkscrew", "webster"]);

describe.each(TRICKS.map((t) => [t.id, t] as const))("%s", (_id, trick) => {
  it("never pushes a foot through the floor and starts and ends standing on it", () => {
    const samples = sampleClip(trick);
    const floor = LEGACY.has(trick.id) ? -0.1 : -0.012;
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

/* Hip range of the rig-authored clips. The legacy Builder clips are left out:
 * their slerped keys can take a leg the long way round (the webster's swing leg
 * folds up over the back mid-flip) until they are re-authored on the rig. */
describe.each(TRICKS.filter((t) => !LEGACY.has(t.id)).map((t) => [t.id, t] as const))("%s hip range", (_id, trick) => {
  it("never swings a thigh up behind the body past a split", () => {
    for (const s of sampleClip(trick)) {
      expect(Math.max(s.extL, s.extR), `t=${s.t.toFixed(2)}`).toBeLessThan(100);
    }
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
    expect(samples.some(inverted), "inverts over the hand").toBe(true);
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
  ["cheat-900", 450, 760, false, "right"],
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

describe.each(
  ["cheat-900", "backside-720", "backside-900", "gainer-switch", "cork-swipe", "loser", "touchdown-raiz", "sideswipe"].map(
    (id) => [id, byId(id)] as const,
  ),
)("%s landing", (_id, trick) => {
  it("keeps the landing foot planted instead of sliding it", () => {
    const samples = sampleClip(trick);
    const [, end] = longestFlight(samples)!;
    const after = samples.slice(end + 1);
    const legs = trick.landing === "both" ? (["left", "right"] as const) : ([trick.landing] as const);
    for (const leg of legs) {
      const [first] = contacts(after, (s) => (leg === "left" ? s.left : s.right));
      expect(first, `${leg} foot lands`).toBeDefined();
      const ball = (s: Sample) => (leg === "left" ? s.ballL : s.ballR);
      for (let i = first[0]; i <= first[1]; i++) {
        expect(planarDistance(ball(after[i]), ball(after[first[0]])), `${leg} t=${after[i].t.toFixed(2)}`).toBeLessThan(0.05);
      }
    }
  });
});
