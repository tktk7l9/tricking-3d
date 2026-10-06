import * as THREE from "three";
import type { BoneKey } from "../character/Character";
import { mixamoBoneName } from "./authoring";

/* Semantic rig for authoring tricking motion.
 *
 * Instead of raw per-bone Euler keys (see authoring.ts), a trick is written as
 * sparse keyframes on *semantic channels* (hip heading / pitch / roll / twist,
 * leg elevation & azimuth, elbow flex, ...). Channels are interpolated with a
 * monotone cubic (no overshoot) and sampled densely into quaternion tracks, so
 * large rotations never take the short way round and motion is smooth.
 *
 * The rig also solves hip translation from contact constraints:
 *   - `pin(effector, t0, t1)` keeps a foot (or hand) planted on the floor,
 *     so the character pivots around it instead of skating;
 *   - `flight(t0, t1, {travel})` makes the hips follow a ballistic parabola
 *     between the grounded takeoff and landing heights;
 *   - outside flights the lowest contact point (feet, optionally hands) is
 *     kept on the floor, so limbs never sink through it.
 *
 * Conventions (character at origin facing +Z, +X is the character's left):
 *   heading  yaw about world Y, positive = turning left (counter-clockwise
 *            seen from above). The whole catalogue is modelled for a
 *            left-twisting (counter-clockwise) tricker.
 *   pitch    rotation about the heading frame's X: positive = head forward /
 *            front flip, negative = back flip.
 *   roll     rotation about the body's Z: positive tips the head toward the
 *            character's right, negative toward the left.
 *   twist    rotation about the body's own long axis (applied innermost).
 *   tilt/spin  rotation `spin` about an axis tilted `tilt` degrees forward
 *            from vertical (raiz-style off-axis spins).
 *   legs     el = hip flexion (0 straight down, 90 thigh horizontal forward,
 *            negative = behind), az = horizontal direction of the thigh
 *            (0 forward, +90 out to the character's left, -90 to the right),
 *            turn = rotation about the thigh, knee = flexion (shin back),
 *            foot = plantar flexion (toes down).
 *   arms     el = 0 hanging, 90 horizontal, 180 overhead; az as for legs
 *            (+90 = out to the left side); elbow = flexion (hand toward the
 *            shoulder's front).
 */

export type Effector = "L" | "R" | "handL" | "handR";

export type Channel =
  | "heading"
  | "pitch"
  | "roll"
  | "twist"
  | "tilt"
  | "spin"
  | "bend"
  | "side"
  | "torsoTwist"
  | "nod"
  | "turn"
  | "headTilt"
  | "L.az"
  | "L.el"
  | "L.turn"
  | "L.knee"
  | "L.foot"
  | "R.az"
  | "R.el"
  | "R.turn"
  | "R.knee"
  | "R.foot"
  | "armL.az"
  | "armL.el"
  | "armL.turn"
  | "armL.elbow"
  | "armR.az"
  | "armR.el"
  | "armR.turn"
  | "armR.elbow";

export type Pose = Partial<Record<Channel, number>>;

const DEFAULTS: Record<Channel, number> = {
  heading: 0,
  pitch: 0,
  roll: 0,
  twist: 0,
  tilt: 0,
  spin: 0,
  bend: 0,
  side: 0,
  torsoTwist: 0,
  nod: 0,
  turn: 0,
  headTilt: 0,
  "L.az": 0,
  "L.el": 0,
  "L.turn": 0,
  "L.knee": 0,
  "L.foot": 0,
  "R.az": 0,
  "R.el": 0,
  "R.turn": 0,
  "R.knee": 0,
  "R.foot": 0,
  "armL.az": 90,
  "armL.el": 10,
  "armL.turn": 0,
  "armL.elbow": 10,
  "armR.az": -90,
  "armR.el": 10,
  "armR.turn": 0,
  "armR.elbow": 10,
};

/** Rest offsets of the procedural skeleton (mirrors Character.buildProcedural). */
export const SKELETON: Record<BoneKey, { parent: BoneKey | null; offset: [number, number, number] }> = {
  hips: { parent: null, offset: [0, 0.95, 0] },
  spine: { parent: "hips", offset: [0, 0.1, 0] },
  spine1: { parent: "spine", offset: [0, 0.13, 0] },
  spine2: { parent: "spine1", offset: [0, 0.14, 0] },
  neck: { parent: "spine2", offset: [0, 0.16, 0] },
  head: { parent: "neck", offset: [0, 0.07, 0] },
  leftShoulder: { parent: "spine2", offset: [0.05, 0.1, 0] },
  leftArm: { parent: "leftShoulder", offset: [0.13, 0, 0] },
  leftForeArm: { parent: "leftArm", offset: [0.3, 0, 0] },
  leftHand: { parent: "leftForeArm", offset: [0.28, 0, 0] },
  rightShoulder: { parent: "spine2", offset: [-0.05, 0.1, 0] },
  rightArm: { parent: "rightShoulder", offset: [-0.13, 0, 0] },
  rightForeArm: { parent: "rightArm", offset: [-0.3, 0, 0] },
  rightHand: { parent: "rightForeArm", offset: [-0.28, 0, 0] },
  leftUpLeg: { parent: "hips", offset: [0.1, -0.05, 0] },
  leftLeg: { parent: "leftUpLeg", offset: [0, -0.45, 0] },
  leftFoot: { parent: "leftLeg", offset: [0, -0.45, 0] },
  leftToe: { parent: "leftFoot", offset: [0, 0, 0.1] },
  rightUpLeg: { parent: "hips", offset: [-0.1, -0.05, 0] },
  rightLeg: { parent: "rightUpLeg", offset: [0, -0.45, 0] },
  rightFoot: { parent: "rightLeg", offset: [0, -0.45, 0] },
  rightToe: { parent: "rightFoot", offset: [0, 0, 0.1] },
};

/** Points (in bone space) that may touch the floor (heel/ball, palm). The sole
 * sits at ankle height. `pivot` is the point a pinned effector turns around. */
const CONTACTS: Record<Effector, { bone: BoneKey; points: [number, number, number][]; pivot: [number, number, number] }> = {
  L: { bone: "leftFoot", points: [[0, 0, -0.05], [0, 0, 0.15]], pivot: [0, 0, 0.1] },
  R: { bone: "rightFoot", points: [[0, 0, -0.05], [0, 0, 0.15]], pivot: [0, 0, 0.1] },
  handL: { bone: "leftHand", points: [[0.04, 0, 0]], pivot: [0.04, 0, 0] },
  handR: { bone: "rightHand", points: [[-0.04, 0, 0]], pivot: [-0.04, 0, 0] },
};

const G = 9.81;
const DEG = Math.PI / 180;

type Key = { t: number; v: number };

/** Monotone cubic (Fritsch–Carlson) interpolation; holds the end values outside the keys. */
export function sampleCurve(keys: Key[], t: number): number {
  const n = keys.length;
  if (t <= keys[0].t) return keys[0].v;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  let i = 0;
  while (keys[i + 1].t < t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const h = b.t - a.t;
  const d = (b.v - a.v) / h;
  const slopeAt = (j: number): number => {
    if (j === 0 || j === n - 1) return d;
    const d0 = (keys[j].v - keys[j - 1].v) / (keys[j].t - keys[j - 1].t);
    const d1 = (keys[j + 1].v - keys[j].v) / (keys[j + 1].t - keys[j].t);
    if (d0 * d1 <= 0) return 0;
    return (d0 + d1) / 2;
  };
  let m0 = slopeAt(i);
  let m1 = slopeAt(i + 1);
  // Fritsch–Carlson limiter keeps the segment monotone (no overshoot).
  const alpha = m0 / d;
  const beta = m1 / d;
  const s = alpha * alpha + beta * beta;
  if (s > 9) {
    const tau = 3 / Math.sqrt(s);
    m0 = tau * alpha * d;
    m1 = tau * beta * d;
  }
  const u = (t - a.t) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * a.v +
    (u3 - 2 * u2 + u) * h * m0 +
    (-2 * u3 + 3 * u2) * b.v +
    (u3 - u2) * h * m1
  );
}

type Pin = { effector: Effector; t0: number; t1: number };
type Flight = { t0: number; t1: number; travel: [number, number]; apex?: number };

export class Rig {
  readonly duration: number;
  private keys = new Map<Channel, Key[]>();
  private pins: Pin[] = [];
  private flights: Flight[] = [];
  private fps: number;
  private handsTouch: boolean;

  constructor(duration: number, opts: { fps?: number; hands?: boolean } = {}) {
    this.duration = duration;
    this.fps = opts.fps ?? 60;
    this.handsTouch = opts.hands ?? false;
  }

  /** Key every channel at u=0 (defaults overridden by `pose`), so nothing
   * holds a later key's value during the opening stance. */
  start(pose: Pose = {}): this {
    return this.at(0, { ...DEFAULTS, ...pose });
  }

  /** Key several channels at normalized time u (0..1 of the clip). */
  at(u: number, pose: Pose): this {
    const t = u * this.duration;
    for (const [ch, v] of Object.entries(pose) as [Channel, number][]) {
      const list = this.keys.get(ch) ?? [];
      const existing = list.find((k) => Math.abs(k.t - t) < 1e-6);
      if (existing) existing.v = v;
      else list.push({ t, v });
      list.sort((a, b) => a.t - b.t);
      this.keys.set(ch, list);
    }
    return this;
  }

  /** Keep an effector planted between normalized times u0..u1. */
  pin(effector: Effector, u0: number, u1: number): this {
    this.pins.push({ effector, t0: u0 * this.duration, t1: u1 * this.duration });
    return this;
  }

  /** Ballistic phase between normalized times u0..u1 travelling [dx, dz] metres. */
  flight(u0: number, u1: number, opts: { travel?: [number, number]; apex?: number } = {}): this {
    this.flights.push({
      t0: u0 * this.duration,
      t1: u1 * this.duration,
      travel: opts.travel ?? [0, 0],
      apex: opts.apex,
    });
    return this;
  }

  value(ch: Channel, t: number): number {
    const list = this.keys.get(ch);
    return list ? sampleCurve(list, t) : DEFAULTS[ch];
  }

  /** Local rotation of every bone at time t (seconds). */
  localRotations(t: number): Record<BoneKey, THREE.Quaternion> {
    const v = (ch: Channel) => this.value(ch, t);
    const out = {} as Record<BoneKey, THREE.Quaternion>;
    for (const k of Object.keys(SKELETON) as BoneKey[]) out[k] = new THREE.Quaternion();

    // hips: heading · tilted spin · pitch · roll · twist
    const tilt = v("tilt");
    out.hips
      .copy(rotY(v("heading")))
      .multiply(rotX(tilt))
      .multiply(rotY(v("spin")))
      .multiply(rotX(-tilt))
      .multiply(rotX(v("pitch")))
      .multiply(rotZ(v("roll")))
      .multiply(rotY(v("twist")));

    // torso spread over three vertebrae
    const bend = v("bend");
    const side = -v("side");
    const tw = v("torsoTwist");
    out.spine.copy(eulerQ(bend * 0.4, tw * 0.3, side * 0.4));
    out.spine1.copy(eulerQ(bend * 0.4, tw * 0.4, side * 0.4));
    out.spine2.copy(eulerQ(bend * 0.2, tw * 0.3, side * 0.2));
    out.neck.copy(eulerQ(v("nod") * 0.5, v("turn") * 0.4, -v("headTilt") * 0.4));
    out.head.copy(eulerQ(v("nod") * 0.5, v("turn") * 0.6, -v("headTilt") * 0.6));

    // legs
    for (const side of ["L", "R"] as const) {
      const up = side === "L" ? "leftUpLeg" : "rightUpLeg";
      const lo = side === "L" ? "leftLeg" : "rightLeg";
      const ft = side === "L" ? "leftFoot" : "rightFoot";
      out[up]
        .copy(rotY(v(`${side}.az`)))
        .multiply(rotX(-v(`${side}.el`)))
        .multiply(rotY(v(`${side}.turn`)));
      out[lo].copy(rotX(v(`${side}.knee`)));
      out[ft].copy(rotX(v(`${side}.foot`)));
    }

    // arms: rest direction is ±X, rotate it to hang down first
    for (const side of ["L", "R"] as const) {
      const arm = side === "L" ? "leftArm" : "rightArm";
      const fore = side === "L" ? "leftForeArm" : "rightForeArm";
      const sign = side === "L" ? 1 : -1;
      const name = side === "L" ? "armL" : "armR";
      out[arm]
        .copy(rotY(v(`${name}.az`)))
        .multiply(rotX(-v(`${name}.el`)))
        .multiply(rotY(v(`${name}.turn`)))
        .multiply(rotZ(-90 * sign));
      out[fore].copy(rotY(-sign * v(`${name}.elbow`)));
    }
    return out;
  }

  build(name: string, boneNameLookup: (k: BoneKey) => string = mixamoBoneName): THREE.AnimationClip {
    const D = this.duration;
    const times = this.sampleTimes();
    const skel = makeSkeleton();
    const rots: Record<BoneKey, number[]> = {} as Record<BoneKey, number[]>;
    for (const k of Object.keys(SKELETON) as BoneKey[]) rots[k] = [];
    const hipsPos: number[] = [];

    // Landing heights are needed before each flight starts.
    const landingY = this.flights.map((f) => this.groundedY(skel, f.t1));

    let xz = new THREE.Vector2(0, 0);
    let lastPin: Pin | null = null;
    let anchor = new THREE.Vector2();
    let prevRel: Record<Effector, Contact> | null = null;
    let flightStart: { xz: THREE.Vector2; y: number } | null = null;
    let lastY = 0;

    for (const t of times) {
      const local = this.localRotations(t);
      applyRotations(skel, local);
      const rel = contactPositions(skel);

      const fi = this.flights.findIndex((f) => t > f.t0 + 1e-9 && t < f.t1 - 1e-9);
      let y: number;
      if (fi >= 0) {
        const f = this.flights[fi];
        if (!flightStart) flightStart = { xz: xz.clone(), y: lastY };
        const T = f.t1 - f.t0;
        const u = (t - f.t0) / T;
        const apex = f.apex ?? (G * T * T) / 8;
        const y0 = flightStart.y;
        const y1 = landingY[fi];
        y = y0 + (y1 - y0) * u + 4 * apex * u * (1 - u);
        xz = new THREE.Vector2(flightStart.xz.x + f.travel[0] * u, flightStart.xz.y + f.travel[1] * u);
        lastPin = null;
      } else {
        // Touchdown sample: finish the flight's travel exactly before planting.
        const ended = this.flights.find((f) => Math.abs(t - f.t1) < 1e-9);
        if (ended && flightStart) {
          xz = new THREE.Vector2(flightStart.xz.x + ended.travel[0], flightStart.xz.y + ended.travel[1]);
        }
        flightStart = null;
        y = -this.lowestContact(rel);
        const pin = this.pins.find((p) => t >= p.t0 - 1e-9 && t <= p.t1 + 1e-9) ?? null;
        if (pin) {
          const r = rel[pin.effector];
          if (pin !== lastPin) {
            const prev = prevRel ? prevRel[pin.effector].xz : r.xz;
            anchor = xz.clone().add(prev);
          }
          xz = anchor.clone().sub(r.xz);
        }
        lastPin = pin;
      }
      lastY = y;
      prevRel = rel;

      for (const k of Object.keys(SKELETON) as BoneKey[]) {
        const q = local[k];
        rots[k].push(q.x, q.y, q.z, q.w);
      }
      hipsPos.push(xz.x, y, xz.y);
    }

    const tracks: THREE.KeyframeTrack[] = [];
    for (const k of Object.keys(SKELETON) as BoneKey[]) {
      tracks.push(new THREE.QuaternionKeyframeTrack(`${boneNameLookup(k)}.quaternion`, times.slice(), rots[k]));
    }
    tracks.push(new THREE.VectorKeyframeTrack(`${boneNameLookup("hips")}.position`, times.slice(), hipsPos));
    return new THREE.AnimationClip(name, D, tracks);
  }

  private sampleTimes(): number[] {
    const set = new Set<number>();
    const n = Math.round(this.duration * this.fps);
    for (let i = 0; i <= n; i++) set.add(round6((this.duration * i) / n));
    for (const list of this.keys.values()) for (const k of list) set.add(round6(k.t));
    for (const p of this.pins) {
      set.add(round6(p.t0));
      set.add(round6(p.t1));
    }
    for (const f of this.flights) {
      set.add(round6(f.t0));
      set.add(round6(f.t1));
    }
    return Array.from(set)
      .filter((t) => t >= 0 && t <= this.duration)
      .sort((a, b) => a - b);
  }

  private groundedY(skel: Skeleton, t: number): number {
    applyRotations(skel, this.localRotations(t));
    return -this.lowestContact(contactPositions(skel));
  }

  private lowestContact(rel: Record<Effector, Contact>): number {
    let min = Math.min(rel.L.y, rel.R.y);
    if (this.handsTouch) min = Math.min(min, rel.handL.y, rel.handR.y);
    return min;
  }
}

type Skeleton = Record<BoneKey, THREE.Object3D>;
type Contact = { xz: THREE.Vector2; y: number };

function makeSkeleton(): Skeleton {
  const nodes = {} as Skeleton;
  for (const k of Object.keys(SKELETON) as BoneKey[]) {
    const o = new THREE.Object3D();
    o.name = k;
    nodes[k] = o;
  }
  for (const k of Object.keys(SKELETON) as BoneKey[]) {
    const def = SKELETON[k];
    if (def.parent) nodes[def.parent].add(nodes[k]);
    nodes[k].position.set(...def.offset);
  }
  // Hips are solved separately; evaluate the skeleton with hips at the origin.
  nodes.hips.position.set(0, 0, 0);
  return nodes;
}

function applyRotations(skel: Skeleton, local: Record<BoneKey, THREE.Quaternion>) {
  for (const k of Object.keys(SKELETON) as BoneKey[]) skel[k].quaternion.copy(local[k]);
  skel.hips.updateMatrixWorld(true);
}

/** Lowest point (y) and pivot point (xz) of each effector, relative to the hips origin. */
function contactPositions(skel: Skeleton): Record<Effector, Contact> {
  const out = {} as Record<Effector, Contact>;
  const tmp = new THREE.Vector3();
  for (const e of Object.keys(CONTACTS) as Effector[]) {
    const c = CONTACTS[e];
    let y = Infinity;
    for (const p of c.points) {
      tmp.set(...p);
      skel[c.bone].localToWorld(tmp);
      y = Math.min(y, tmp.y);
    }
    tmp.set(...c.pivot);
    skel[c.bone].localToWorld(tmp);
    out[e] = { xz: new THREE.Vector2(tmp.x, tmp.z), y };
  }
  return out;
}

const AX = new THREE.Vector3(1, 0, 0);
const AY = new THREE.Vector3(0, 1, 0);
const AZ = new THREE.Vector3(0, 0, 1);
const rotX = (deg: number) => new THREE.Quaternion().setFromAxisAngle(AX, deg * DEG);
const rotY = (deg: number) => new THREE.Quaternion().setFromAxisAngle(AY, deg * DEG);
const rotZ = (deg: number) => new THREE.Quaternion().setFromAxisAngle(AZ, deg * DEG);
const eulerQ = (x: number, y: number, z: number) =>
  new THREE.Quaternion().setFromEuler(new THREE.Euler(x * DEG, y * DEG, z * DEG, "XYZ"));
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
