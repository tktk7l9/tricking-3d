import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { Builder, mixamoBoneName } from "./authoring";

const name = (k: string) => `bone_${k}`;

function trackOf(clip: THREE.AnimationClip, suffix: string): THREE.KeyframeTrack {
  const t = clip.tracks.find((x) => x.name.endsWith(suffix));
  if (!t) throw new Error(`missing track ${suffix}`);
  return t;
}

function eulerAt(track: THREE.KeyframeTrack, index: number): THREE.Euler {
  const v = track.values;
  const q = new THREE.Quaternion(v[index * 4], v[index * 4 + 1], v[index * 4 + 2], v[index * 4 + 3]);
  return new THREE.Euler().setFromQuaternion(q, "XYZ");
}

describe("Builder", () => {
  it("builds an empty clip with the requested duration", () => {
    const clip = new Builder(1.5).build("empty", name);
    expect(clip.name).toBe("empty");
    expect(clip.duration).toBe(1.5);
    expect(clip.tracks).toEqual([]);
  });

  it("merges keys at the same time and sorts times on build", () => {
    const b = new Builder(1);
    b.key("hips", 0.5, { eulerDeg: { x: 90 } });
    b.key("hips", 0, { eulerDeg: { x: 0 } });
    b.key("hips", 0.5, { pos: { y: 1 } });
    b.key("hips", 0.50001, { eulerDeg: { y: 45 } });
    const clip = b.build("merge", name);
    const rot = trackOf(clip, "bone_hips.quaternion");
    const pos = trackOf(clip, "bone_hips.position");
    expect(Array.from(rot.times)).toEqual([0, 0.5]);
    expect(Array.from(pos.times)).toEqual([0, 0.5]);
    const e = eulerAt(rot, 1);
    expect(THREE.MathUtils.radToDeg(e.x)).toBeCloseTo(90, 4);
    expect(THREE.MathUtils.radToDeg(e.y)).toBeCloseTo(45, 4);
  });

  it("only emits the track kinds that were keyed", () => {
    const b = new Builder(1);
    b.key("head", 0, { eulerDeg: { z: 10 } });
    b.key("leftHand", 0, { pos: { x: 1 } });
    const clip = b.build("kinds", name);
    expect(clip.tracks.map((t) => t.name).sort()).toEqual(["bone_head.quaternion", "bone_leftHand.position"]);
  });

  it("rotateOver samples linearly by default and accepts an easing", () => {
    const b = new Builder(2);
    b.rotateOver("hips", "x", 0, 90, 0, 1, 2);
    const clip = b.build("rot", name);
    const rot = trackOf(clip, "bone_hips.quaternion");
    expect(Array.from(rot.times)).toEqual([0, 0.5, 1]);
    expect(THREE.MathUtils.radToDeg(eulerAt(rot, 1).x)).toBeCloseTo(45, 4);
    expect(THREE.MathUtils.radToDeg(eulerAt(rot, 2).x)).toBeCloseTo(90, 4);

    const eased = new Builder(2).rotateOver("hips", "x", 0, 90, 0, 1, 2, (u) => u * u).build("eased", name);
    expect(THREE.MathUtils.radToDeg(eulerAt(trackOf(eased, ".quaternion"), 1).x)).toBeCloseTo(22.5, 4);
  });

  it("hold writes the same angle at both ends so it does not drift", () => {
    const clip = new Builder(1).hold("neck", "y", 30, 0.2, 0.8).build("hold", name);
    const rot = trackOf(clip, "bone_neck.quaternion");
    expect(rot.times[0]).toBeCloseTo(0.2, 6);
    expect(rot.times[1]).toBeCloseTo(0.8, 6);
    expect(THREE.MathUtils.radToDeg(eulerAt(rot, 0).y)).toBeCloseTo(30, 4);
    expect(THREE.MathUtils.radToDeg(eulerAt(rot, 1).y)).toBeCloseTo(30, 4);
  });

  it("hipsArc peaks midway and interpolates x/z linearly", () => {
    const clip = new Builder(1).hipsArc([0, 1, 0], 0.5, [1, 1, 2], 0, 1, 2).build("arc", name);
    const pos = trackOf(clip, "bone_hips.position");
    expect(Array.from(pos.times)).toEqual([0, 0.5, 1]);
    expect(Array.from(pos.values)).toEqual([0, 1, 0, 0.5, 1.5, 1, 1, 1, 2]);
  });

  it("densifies independent axes across the union of times", () => {
    // x is keyed at 0 and 1, y only at 0.5: each axis must be resampled at every time.
    const b = new Builder(1);
    b.key("spine", 0, { eulerDeg: { x: 0 } });
    b.key("spine", 1, { eulerDeg: { x: 90 } });
    b.key("spine", 0.5, { eulerDeg: { y: 40 } });
    const rot = trackOf(b.build("dense", name), ".quaternion");
    expect(Array.from(rot.times)).toEqual([0, 0.5, 1]);
    // y before its first sample holds the first value; x at 0.5 interpolates to 45.
    expect(THREE.MathUtils.radToDeg(eulerAt(rot, 0).y)).toBeCloseTo(40, 4);
    const mid = eulerAt(rot, 1);
    expect(THREE.MathUtils.radToDeg(mid.x)).toBeCloseTo(45, 4);
    expect(THREE.MathUtils.radToDeg(mid.y)).toBeCloseTo(40, 4);
    // y after its last sample holds the last value; z was never keyed and stays 0.
    const end = eulerAt(rot, 2);
    expect(THREE.MathUtils.radToDeg(end.y)).toBeCloseTo(40, 4);
    expect(end.z).toBeCloseTo(0, 6);
  });

  it("position axes hold their first/last sample outside their range and default to 0 when never keyed", () => {
    const b = new Builder(1);
    b.key("hips", 0, { pos: { y: 1 } });
    b.key("hips", 0.5, { pos: { x: 2 } });
    b.key("hips", 1, { pos: { y: 3 } });
    const pos = trackOf(b.build("pos", name), ".position");
    // x: held at 2 before and after its only sample; y: 1 -> 2 -> 3; z: never keyed.
    expect(Array.from(pos.values)).toEqual([2, 1, 0, 2, 2, 0, 2, 3, 0]);
  });
});

describe("mixamoBoneName", () => {
  it("maps bone keys to the Mixamo rig names", () => {
    expect(mixamoBoneName("hips")).toBe("mixamorigHips");
    expect(mixamoBoneName("leftToe")).toBe("mixamorigLeftToeBase");
    expect(mixamoBoneName("rightForeArm")).toBe("mixamorigRightForeArm");
  });
});
