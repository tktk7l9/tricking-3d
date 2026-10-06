import { beforeAll, describe, expect, it } from "vitest";
import * as THREE from "three";
import { Character } from "../../character/Character";
import { TRICKS, type TrickMeta } from "../catalog";
import { buildClipFor } from "./index";

/* Physical plausibility of every clip, measured on the real procedural rig:
 * feet stay on or above the floor, and the foot that leaves the ground last /
 * touches down first matches the catalogue's takeoff / landing legs. */

type Sample = { t: number; left: number; right: number; hands: number };

const SOLE: [number, number, number][] = [
  [0, 0, -0.05],
  [0, 0, 0.15],
];

let character: Character;
beforeAll(async () => {
  character = await Character.load();
});

function sampleClip(trick: TrickMeta, steps = 150): Sample[] {
  const clip = buildClipFor(trick.id);
  const mixer = new THREE.AnimationMixer(character.root);
  const action = mixer.clipAction(clip);
  action.play();
  const out: Sample[] = [];
  const v = new THREE.Vector3();
  const lowest = (bone: "leftFoot" | "rightFoot") =>
    Math.min(...SOLE.map((p) => character.bones[bone].localToWorld(v.set(...p)).y));
  for (let i = 0; i <= steps; i++) {
    const t = Math.min((clip.duration * i) / steps, clip.duration - 1e-4);
    mixer.setTime(t);
    character.root.updateMatrixWorld(true);
    out.push({
      t,
      left: lowest("leftFoot"),
      right: lowest("rightFoot"),
      hands: Math.min(
        character.bones.leftHand.localToWorld(v.set(0.04, 0, 0)).y,
        character.bones.rightHand.localToWorld(v.set(-0.04, 0, 0)).y,
      ),
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
