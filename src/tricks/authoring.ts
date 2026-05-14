import * as THREE from "three";
import type { BoneKey } from "../character/Character";

/* Authoring DSL for hand-built tricking animations.
 *
 * Workflow:
 *   const b = new Builder(duration);
 *   b.key('hips', 0.0, {});
 *   b.rotateOver('hips', 'x', 0, -360, 0, 1, 6);
 *   b.key('leftLeg', 0.5, { eulerDeg: [-120, 0, 0] });
 *   ...
 *   const clip = b.build('back-flip', boneNameLookup);
 *
 * Per-bone keyframes are stored as a list of (time, partial Pose). At build time,
 * each axis is densified across the union of unique times by linear interpolation
 * — so independent helpers like rotateOver(x) + rotateOver(y) compose cleanly even
 * if they choose different sample counts.
 *
 * Coordinate convention (character at origin facing +Z):
 *   x axis = lateral (side flips rotate around Z; pitches rotate around X; yaw around Y)
 *   See catalog.ts for the per-trick axis map.
 */

const DEG = Math.PI / 180;
const EPS = 1e-4;

export type Vec3 = [number, number, number];
export type Pose = {
  /** absolute euler angles (degrees, XYZ order) for this bone at this time */
  eulerDeg?: Partial<Record<"x" | "y" | "z", number>>;
  /** absolute local position (overrides bone base.pos) */
  pos?: Partial<Record<"x" | "y" | "z", number>>;
};

type RawKey = { t: number; pose: Pose };

export class Builder {
  readonly duration: number;
  private keys = new Map<BoneKey, RawKey[]>();

  constructor(duration: number) {
    this.duration = duration;
  }

  /** Add or merge a keyframe for a bone at time t (seconds). */
  key(bone: BoneKey, t: number, pose: Pose): this {
    const list = this.keys.get(bone) ?? [];
    const existing = list.find((k) => Math.abs(k.t - t) < EPS);
    if (existing) {
      existing.pose = mergePose(existing.pose, pose);
    } else {
      list.push({ t, pose });
    }
    this.keys.set(bone, list);
    return this;
  }

  /** Convenience: rotate one axis from a degree value at t0 to a value at t1 with N samples in between. */
  rotateOver(
    bone: BoneKey,
    axis: "x" | "y" | "z",
    fromDeg: number,
    toDeg: number,
    t0: number,
    t1: number,
    samples = 4,
    easing: (u: number) => number = (u) => u,
  ): this {
    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const t = t0 + (t1 - t0) * u;
      const v = fromDeg + (toDeg - fromDeg) * easing(u);
      this.key(bone, t, { eulerDeg: { [axis]: v } });
    }
    return this;
  }

  /** Hold pose: write the same euler at t0 and t1 so it doesn't drift in interpolation. */
  hold(bone: BoneKey, axis: "x" | "y" | "z", deg: number, t0: number, t1: number): this {
    this.key(bone, t0, { eulerDeg: { [axis]: deg } });
    this.key(bone, t1, { eulerDeg: { [axis]: deg } });
    return this;
  }

  /** Parabolic hips path: y peaks midway, x/z linearly interpolated. */
  hipsArc(
    from: Vec3,
    peakY: number,
    to: Vec3,
    t0: number,
    t1: number,
    samples = 6,
  ): this {
    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const t = t0 + (t1 - t0) * u;
      const x = from[0] + (to[0] - from[0]) * u;
      const z = from[2] + (to[2] - from[2]) * u;
      const baseY = from[1] + (to[1] - from[1]) * u;
      const arc = 4 * peakY * u * (1 - u);
      this.key("hips", t, { pos: { x, y: baseY + arc, z } });
    }
    return this;
  }

  build(
    name: string,
    boneNameLookup: (k: BoneKey) => string,
  ): THREE.AnimationClip {
    const tracks: THREE.KeyframeTrack[] = [];
    for (const [bone, raw] of this.keys.entries()) {
      raw.sort((a, b) => a.t - b.t);
      const times = raw.map((k) => k.t);
      const boneName = boneNameLookup(bone);

      // Rotation track: collect per-axis samples, densify, build quaternions.
      const hasRot = raw.some((k) => k.pose.eulerDeg);
      if (hasRot) {
        const xs = perAxisSeries(raw, "x", "eulerDeg");
        const ys = perAxisSeries(raw, "y", "eulerDeg");
        const zs = perAxisSeries(raw, "z", "eulerDeg");
        const values: number[] = [];
        const e = new THREE.Euler();
        const q = new THREE.Quaternion();
        for (const t of times) {
          e.set(
            sampleAt(xs, t) * DEG,
            sampleAt(ys, t) * DEG,
            sampleAt(zs, t) * DEG,
            "XYZ",
          );
          q.setFromEuler(e);
          values.push(q.x, q.y, q.z, q.w);
        }
        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            `${boneName}.quaternion`,
            times.slice(),
            values,
          ),
        );
      }

      // Position track
      const hasPos = raw.some((k) => k.pose.pos);
      if (hasPos) {
        const xs = perAxisSeries(raw, "x", "pos");
        const ys = perAxisSeries(raw, "y", "pos");
        const zs = perAxisSeries(raw, "z", "pos");
        const values: number[] = [];
        for (const t of times) {
          values.push(sampleAt(xs, t), sampleAt(ys, t), sampleAt(zs, t));
        }
        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${boneName}.position`,
            times.slice(),
            values,
          ),
        );
      }
    }
    return new THREE.AnimationClip(name, this.duration, tracks);
  }
}

function mergePose(a: Pose, b: Pose): Pose {
  const out: Pose = {};
  if (a.eulerDeg || b.eulerDeg) out.eulerDeg = { ...a.eulerDeg, ...b.eulerDeg };
  if (a.pos || b.pos) out.pos = { ...a.pos, ...b.pos };
  return out;
}

type Series = { t: number; v: number }[];

function perAxisSeries(
  raw: RawKey[],
  axis: "x" | "y" | "z",
  field: "eulerDeg" | "pos",
): Series {
  const out: Series = [];
  for (const k of raw) {
    const blob = k.pose[field];
    if (blob && blob[axis] !== undefined) {
      out.push({ t: k.t, v: blob[axis] as number });
    }
  }
  return out;
}

/** Linear interpolate the per-axis series at time t. Default is 0 if series is empty. */
function sampleAt(series: Series, t: number): number {
  if (series.length === 0) return 0;
  if (t <= series[0].t) return series[0].v;
  if (t >= series[series.length - 1].t) return series[series.length - 1].v;
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1];
    const b = series[i];
    if (t <= b.t) {
      const u = (t - a.t) / (b.t - a.t);
      return a.v + (b.v - a.v) * u;
    }
  }
  return series[series.length - 1].v;
}

/* ============================================================
 * Bone-name lookup helpers
 * ============================================================ */

const MIXAMO: Record<BoneKey, string> = {
  hips: "mixamorigHips",
  spine: "mixamorigSpine",
  spine1: "mixamorigSpine1",
  spine2: "mixamorigSpine2",
  neck: "mixamorigNeck",
  head: "mixamorigHead",
  leftShoulder: "mixamorigLeftShoulder",
  leftArm: "mixamorigLeftArm",
  leftForeArm: "mixamorigLeftForeArm",
  leftHand: "mixamorigLeftHand",
  rightShoulder: "mixamorigRightShoulder",
  rightArm: "mixamorigRightArm",
  rightForeArm: "mixamorigRightForeArm",
  rightHand: "mixamorigRightHand",
  leftUpLeg: "mixamorigLeftUpLeg",
  leftLeg: "mixamorigLeftLeg",
  leftFoot: "mixamorigLeftFoot",
  leftToe: "mixamorigLeftToeBase",
  rightUpLeg: "mixamorigRightUpLeg",
  rightLeg: "mixamorigRightLeg",
  rightFoot: "mixamorigRightFoot",
  rightToe: "mixamorigRightToeBase",
};

export const mixamoBoneName = (k: BoneKey) => MIXAMO[k];
