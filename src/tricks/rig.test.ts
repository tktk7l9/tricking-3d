import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { Character, type BoneKey } from "../character/Character";
import { Rig, SKELETON, sampleCurve } from "./rig";
import { mixamoBoneName } from "./authoring";

const name = (k: string) => k;

function track(clip: THREE.AnimationClip, suffix: string): THREE.KeyframeTrack {
  const t = clip.tracks.find((x) => x.name.toLowerCase().endsWith(suffix.toLowerCase()));
  if (!t) throw new Error(`missing track ${suffix}`);
  return t;
}

/** Hips position sampled from the built clip at time t (linear between keys). */
function hipsAt(clip: THREE.AnimationClip, t: number): THREE.Vector3 {
  const tr = track(clip, "hips.position");
  const times = tr.times;
  let i = 0;
  while (i < times.length - 1 && times[i + 1] <= t) i++;
  const v = tr.values;
  if (i === times.length - 1 || times[i] === t) return new THREE.Vector3(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
  const u = (t - times[i]) / (times[i + 1] - times[i]);
  const a = new THREE.Vector3(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
  const b = new THREE.Vector3(v[(i + 1) * 3], v[(i + 1) * 3 + 1], v[(i + 1) * 3 + 2]);
  return a.lerp(b, u);
}

/** Play a rig clip on the real procedural character and return world positions of a bone-local point. */
async function worldPointAt(clip: THREE.AnimationClip, t: number, bone: BoneKey, local: [number, number, number]) {
  const ch = await Character.load();
  const mixer = new THREE.AnimationMixer(ch.root);
  const action = mixer.clipAction(clip);
  action.play();
  mixer.setTime(t);
  ch.root.updateMatrixWorld(true);
  return ch.bones[bone].localToWorld(new THREE.Vector3(...local));
}

describe("sampleCurve", () => {
  it("holds the end values outside the key range and passes through keys", () => {
    const keys = [
      { t: 0, v: 1 },
      { t: 1, v: 3 },
      { t: 2, v: 2 },
    ];
    expect(sampleCurve(keys, -1)).toBe(1);
    expect(sampleCurve(keys, 5)).toBe(2);
    expect(sampleCurve(keys, 1)).toBeCloseTo(3, 9);
    expect(sampleCurve(keys, 0)).toBe(1);
  });

  it("is monotone between keys and never overshoots", () => {
    const keys = [
      { t: 0, v: 0 },
      { t: 0.1, v: 10 },
      { t: 0.2, v: 11 },
      { t: 1, v: 12 },
    ];
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = sampleCurve(keys, i / 100);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(v).toBeLessThanOrEqual(12 + 1e-9);
      prev = v;
    }
  });

  it("flattens the slope at a local extremum", () => {
    const keys = [
      { t: 0, v: 0 },
      { t: 1, v: 5 },
      { t: 2, v: 0 },
    ];
    expect(sampleCurve(keys, 1)).toBeCloseTo(5, 9);
    expect(sampleCurve(keys, 0.99)).toBeLessThan(5);
    expect(sampleCurve(keys, 1.01)).toBeLessThan(5);
  });
});

describe("SKELETON", () => {
  it("matches the procedural character's bone hierarchy and rest offsets", async () => {
    const ch = await Character.load();
    for (const k of Object.keys(SKELETON) as BoneKey[]) {
      const bone = ch.bones[k];
      const def = SKELETON[k];
      const parentKey = def.parent;
      if (parentKey) expect(bone.parent, k).toBe(ch.bones[parentKey]);
      else expect(bone.parent, k).toBe(ch.root);
      expect(bone.position.toArray().map((x) => +x.toFixed(6)), k).toEqual(def.offset);
    }
  });
});

describe("Rig", () => {
  it("keeps a standing character's hips at 0.95 and arms by its sides by default", () => {
    const clip = new Rig(1).build("stand", name);
    expect(clip.duration).toBe(1);
    expect(clip.tracks.map((t) => t.name)).toContain("hips.position");
    expect(hipsAt(clip, 0).y).toBeCloseTo(0.95, 6);
    expect(hipsAt(clip, 0.5).y).toBeCloseTo(0.95, 6);
  });

  it("keys replace values at the same time and curves hold the first key before it", () => {
    const rig = new Rig(1).at(0.5, { heading: 10 }).at(0.5, { heading: 90 });
    expect(rig.value("heading", 0.5)).toBe(90);
    expect(rig.value("heading", 0)).toBe(90);
    expect(rig.value("pitch", 0.3)).toBe(0);
  });

  it("raises the hips so that a lifted leg never pushes the standing foot through the floor", async () => {
    // Standing on the right leg with the left knee driven up: the right sole must stay on the floor.
    const clip = new Rig(1).at(0, { "L.el": 90, "L.knee": 90 }).build("knee", mixamoBoneName);
    const toe = await worldPointAt(clip, 0.5, "rightFoot", [0, 0, 0.15]);
    const heel = await worldPointAt(clip, 0.5, "rightFoot", [0, 0, -0.05]);
    expect(Math.min(toe.y, heel.y)).toBeCloseTo(0, 5);
    const leftToe = await worldPointAt(clip, 0.5, "leftFoot", [0, 0, 0.15]);
    expect(leftToe.y).toBeGreaterThan(0.3);
  });

  it("pivots around a pinned foot while the heading turns", async () => {
    const rig = new Rig(1)
      .at(0, { heading: 0, "L.az": 20 })
      .at(1, { heading: 180, "L.az": 20 })
      .pin("R", 0, 1);
    const clip = rig.build("pivot", mixamoBoneName);
    const a = await worldPointAt(clip, 0, "rightFoot", [0, 0, 0.1]);
    const b = await worldPointAt(clip, 0.5, "rightFoot", [0, 0, 0.1]);
    const c = await worldPointAt(clip, 1, "rightFoot", [0, 0, 0.1]);
    expect(b.x).toBeCloseTo(a.x, 2);
    expect(b.z).toBeCloseTo(a.z, 2);
    expect(c.x).toBeCloseTo(a.x, 2);
    expect(c.z).toBeCloseTo(a.z, 2);
    // The hips end up on the opposite side of the planted foot.
    const h0 = hipsAt(clip, 0);
    const h1 = hipsAt(clip, 1);
    expect(h1.x).toBeCloseTo(-h0.x + 2 * a.x, 2);
  });

  it("hands can be contact points so a cartwheel keeps its palms on the floor", async () => {
    const rig = new Rig(1, { hands: true }).at(0, { roll: -90, "armL.el": 180, "armL.az": 90 });
    const clip = rig.build("hand", mixamoBoneName);
    const palm = await worldPointAt(clip, 0.5, "leftHand", [0.04, 0, 0]);
    expect(palm.y).toBeCloseTo(0, 5);
    // Without hand contacts, the feet would be put on the floor and the hand would sink.
    const sunk = new Rig(1).at(0, { roll: -90, "armL.el": 180, "armL.az": 90 }).build("sunk", mixamoBoneName);
    const palm2 = await worldPointAt(sunk, 0.5, "leftHand", [0.04, 0, 0]);
    expect(palm2.y).toBeLessThan(-0.01);
  });

  it("flies on a parabola between grounded takeoff and landing, travelling the requested distance", () => {
    const rig = new Rig(2).pin("L", 0, 0.25).flight(0.25, 0.75, { travel: [0, 1] }).pin("L", 0.75, 1);
    const clip = rig.build("jump", name);
    const t0 = hipsAt(clip, 0.5);
    const mid = hipsAt(clip, 1.0);
    const t1 = hipsAt(clip, 1.5);
    expect(t0.y).toBeCloseTo(0.95, 6);
    expect(t1.y).toBeCloseTo(0.95, 6);
    // 1 s of airtime: g*T^2/8 = 1.226 m above the takeoff height at the apex
    expect(mid.y).toBeCloseTo(0.95 + (9.81 * 1 * 1) / 8, 2);
    expect(mid.z).toBeCloseTo(0.5, 3);
    expect(t1.z).toBeCloseTo(1, 3);
    expect(hipsAt(clip, 2).z).toBeCloseTo(1, 3);
    const custom = new Rig(2).flight(0.25, 0.75, { apex: 0.3 }).build("low", name);
    expect(hipsAt(custom, 1.0).y).toBeCloseTo(1.25, 6);
  });

  it("composes hip rotation as heading, tilted spin, pitch, roll and twist", () => {
    const rig = new Rig(1)
      .at(0, { heading: 90, tilt: 0, spin: 0, pitch: 0, roll: 0, twist: 0 })
      .at(1, { heading: 90, tilt: 45, spin: 180, pitch: 10, roll: 5, twist: 20 });
    const q0 = rig.localRotations(0).hips;
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q0);
    expect(fwd.x).toBeCloseTo(1, 6);
    expect(fwd.z).toBeCloseTo(0, 6);
    // A 180° spin about an axis tilted 45° forward lays the body horizontal.
    const q1 = new Rig(1).at(0, { tilt: 45, spin: 180 }).localRotations(0).hips;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q1);
    expect(up.y).toBeCloseTo(0, 6);
    expect(up.z).toBeCloseTo(1, 6);
    // Untilted spin is plain heading; with zero spin, tilt has no effect.
    const q2 = new Rig(1).at(0, { tilt: 45, spin: 0, pitch: 0 }).localRotations(0).hips;
    expect(q2.angleTo(new THREE.Quaternion())).toBeCloseTo(0, 6);
    const q3 = rig.localRotations(1).hips;
    expect(q3.w).not.toBeCloseTo(1, 3);
  });

  it("maps semantic leg and arm channels to the expected bone directions", () => {
    const rig = new Rig(1).at(0, {
      "R.az": -90,
      "R.el": 90,
      "R.knee": 90,
      "armL.az": 0,
      "armL.el": 90,
      "armL.elbow": 90,
      "armR.az": -90,
      "armR.el": 180,
    });
    const r = rig.localRotations(0);
    const thigh = new THREE.Vector3(0, -1, 0).applyQuaternion(r.rightUpLeg);
    expect(thigh.x).toBeCloseTo(-1, 6); // horizontal, out to the character's right
    expect(thigh.y).toBeCloseTo(0, 6);
    const shin = new THREE.Vector3(0, -1, 0).applyQuaternion(r.rightUpLeg.clone().multiply(r.rightLeg));
    expect(shin.y).toBeCloseTo(-1, 6); // knee bent: shin hangs down
    const upper = new THREE.Vector3(1, 0, 0).applyQuaternion(r.leftArm);
    expect(upper.z).toBeCloseTo(1, 6); // left upper arm straight forward
    const fore = new THREE.Vector3(1, 0, 0).applyQuaternion(r.leftArm.clone().multiply(r.leftForeArm));
    expect(fore.y).toBeCloseTo(1, 6); // elbow flexed: forearm points up
    const right = new THREE.Vector3(-1, 0, 0).applyQuaternion(r.rightArm);
    expect(right.y).toBeCloseTo(1, 6); // right arm overhead
  });

  it("includes key, pin and flight boundary times in the sampled tracks", () => {
    const clip = new Rig(1, { fps: 10 }).at(0.333, { pitch: 5 }).pin("L", 0.111, 0.222).flight(0.444, 0.555).build("times", name);
    const times = Array.from(track(clip, "hips.quaternion").times);
    for (const t of [0.333, 0.111, 0.222, 0.444, 0.555]) {
      expect(times.some((x) => Math.abs(x - t) < 1e-6), String(t)).toBe(true);
    }
    expect(times[0]).toBe(0);
    expect(times[times.length - 1]).toBe(1);
  });
});
