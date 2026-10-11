import * as THREE from "three";
import type { BoneKey, Character } from "../character/Character";
import type { AnimationPlayer } from "../character/AnimationPlayer";
import type { TrickMeta } from "../tricks/catalog";
import { clampSeekTime } from "../lib/seek";
import {
  MARKER_CELLS,
  boundingRect,
  clampToViewport,
  focusKeypoint,
  isCrowded,
  layoutLabels,
  leaderEnd,
  splitLabel,
  type Point,
  type Rect,
} from "../lib/labelLayout";

type AnnotationItem = {
  t: number;
  label: string;
  /** where the label belongs: above the hips at its keypoint time */
  anchor: THREE.Vector3;
  sprite: THREE.Sprite;
  /** the label text on one line, and on two lines when it is long (null otherwise) */
  texture: THREE.CanvasTexture;
  wrapped: THREE.CanvasTexture | null;
  /** numbered marker that stands in for the label when the view is crowded */
  marker: THREE.Sprite;
  /** layout cells from the previous frame (keep the layout steady) */
  cell: number;
  markerCell: number;
  /** highlighted because the playhead is at this keypoint */
  active: boolean;
  /** label offset from its anchor on screen, eased toward the layout target */
  shown: Point | null;
};

/** World width of a label (highlighted / normal) and its height ratio. */
const ACTIVE_W = 0.55;
const IDLE_W = 0.42;
const ASPECT = 0.32;
/** Labels are enlarged when a highlighted one would be shorter than this on screen (small phone canvases). */
const MIN_LABEL_PX = 32;
/** The same floor in a crowded view, where a single label remains on screen. */
const MIN_CROWDED_LABEL_PX = 40;
/** On-screen size of a collapsed marker: a touch target of at least 7 mm (SHIG 78). */
const MARKER_PX = 30;
/** Time constant (seconds) for easing labels into a new layout cell. */
const EASE_SECONDS = 0.08;
const MAX_LABELS = 32;
/** Joints whose screen positions outline the figure, and the margin (metres) that stands for the body's thickness. */
const FIGURE_JOINTS: BoneKey[] = [
  "head",
  "hips",
  "leftHand",
  "rightHand",
  "leftForeArm",
  "rightForeArm",
  "leftLeg",
  "rightLeg",
  "leftFoot",
  "rightFoot",
  "leftToe",
  "rightToe",
];
const FIGURE_PAD = 0.15;

export class Annotations {
  readonly group: THREE.Group;
  private items: AnnotationItem[] = [];
  private character: Character;
  private player: AnimationPlayer;
  private camera: THREE.PerspectiveCamera | null = null;
  private onSeek: ((t: number) => void) | null = null;
  private viewport = { w: 0, h: 0 };
  private blocked: Rect[] = [];
  /** Leader lines from displaced labels back to their anchors (SHIG 10). */
  private leaders: THREE.LineSegments;
  private leaderPositions = new Float32Array(MAX_LABELS * 2 * 3);
  /** Playhead time from the last highlightAt() call. */
  private now = 0;

  constructor(character: Character, player: AnimationPlayer) {
    this.character = character;
    this.player = player;
    this.group = new THREE.Group();
    this.group.frustumCulled = false;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(this.leaderPositions, 3));
    geom.setDrawRange(0, 0);
    this.leaders = new THREE.LineSegments(
      geom,
      new THREE.LineBasicMaterial({ color: 0x78c8ff, transparent: true, opacity: 0.6, depthTest: false, depthWrite: false }),
    );
    this.leaders.frustumCulled = false;
    this.leaders.renderOrder = 998;
    this.group.add(this.leaders);
  }

  setCamera(c: THREE.PerspectiveCamera) {
    this.camera = c;
  }

  /** Size of the canvas in CSS pixels (the label layout works in screen space). */
  setViewport(w: number, h: number) {
    this.viewport = { w, h };
  }

  /** Canvas areas covered by on-screen controls (canvas pixels); labels stay clear of them. */
  setBlockedAreas(rects: Rect[]) {
    this.blocked = rects;
  }
  setSeekHandler(fn: (t: number) => void) {
    this.onSeek = fn;
  }

  setTrick(trick: TrickMeta) {
    // remove old
    for (const item of this.items) {
      for (const tex of [item.texture, item.wrapped, item.marker.material.map]) tex?.dispose();
      for (const s of [item.sprite, item.marker]) {
        this.group.remove(s);
        s.material.dispose();
      }
    }
    this.items = [];

    const duration = trick.duration;
    const player = this.player;
    const savedTime = player.getTime();
    const savedPlaying = player.isPlaying();
    player.setPlaying(false);

    trick.keypoints.slice(0, MAX_LABELS).forEach((kp, index) => {
      const t = clampSeekTime(kp.t * duration, duration);
      player.setTime(t);
      const pos = new THREE.Vector3();
      this.character.bones.hips.getWorldPosition(pos);
      pos.y += 0.7;

      const texture = makeLabelTexture(kp.label, false)!;
      const wrapped = makeLabelTexture(kp.label, true);
      const sprite = makeLabelSprite(texture);
      sprite.position.copy(pos);
      sprite.userData.t = t;
      this.group.add(sprite);
      const marker = makeMarkerSprite(index + 1);
      marker.position.copy(pos);
      marker.userData.t = t;
      marker.visible = false;
      this.group.add(marker);
      this.items.push({
        t,
        label: kp.label,
        anchor: pos.clone(),
        sprite,
        texture,
        wrapped,
        marker,
        cell: 0,
        markerCell: 0,
        active: false,
        shown: null,
      });
    });
    this.leaders.geometry.setDrawRange(0, 0);

    player.setTime(savedTime);
    player.setPlaying(savedPlaying);
  }

  setVisible(v: boolean) {
    this.group.visible = v;
  }

  highlightAt(currentTime: number) {
    this.now = currentTime;
    for (const item of this.items) {
      const dt = Math.abs(item.t - currentTime);
      item.active = dt < 0.12;
      item.sprite.material.opacity = item.active ? 1.0 : 0.55;
      const s = item.active ? ACTIVE_W : IDLE_W;
      item.sprite.scale.set(s, s * ASPECT, 1);
    }
  }

  /**
   * Lay the labels out on screen so they never cover each other (SHIG 85):
   * labels whose anchors coincide (tricks that stay in place) spread into a
   * small grid above the body, and a leader line ties each moved label to its
   * anchor. Moves are eased unless the user prefers reduced motion. Call once
   * per frame after the camera has moved.
   */
  updateLayout(dt: number, reduceMotion: boolean) {
    const cam = this.camera;
    const { w, h } = this.viewport;
    if (!cam || w <= 0 || h <= 0 || this.items.length === 0) return;

    const forward = cam.getWorldDirection(new THREE.Vector3());
    const pxPerMetre = (depth: number) => h / (2 * depth * Math.tan((cam.fov * Math.PI) / 360));
    const ndc = this.items.map((item) => item.anchor.clone().project(cam));
    const screen = ndc.map((p) => ({ x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h }));
    const depthOf = (i: number) => this.items[i].anchor.clone().sub(cam.position).dot(forward);
    const visible = (i: number) => Math.abs(ndc[i].z) <= 1;
    // One cell size for every label: the nearest anchor's (the largest on screen).
    let scale = 0;
    this.items.forEach((_, i) => {
      if (depthOf(i) > cam.near && visible(i)) scale = Math.max(scale, pxPerMetre(depthOf(i)));
    });
    if (scale === 0) return;
    // Keep labels legible on small canvases: grow them all by the same factor.
    const growTo = (px: number, at: number) => Math.max(1, px / (ACTIVE_W * ASPECT * at));
    const sizeFor = (g: number, at: number) => ({ w: ACTIVE_W * g * at, h: ACTIVE_W * ASPECT * g * at });
    const offscreen = { x: -1e6, y: -1e6 };

    // Crowded (small phone canvases, many keypoints): keep one label, the
    // keypoint nearest the playhead, and collapse the rest into numbered
    // markers, which expand when tapped because tapping seeks to them (SHIG 67).
    const visibleCount = this.items.filter((_, i) => visible(i)).length;
    const crowded = isCrowded(visibleCount, sizeFor(growTo(MIN_LABEL_PX, scale), scale), this.viewport);
    const focus = crowded ? focusKeypoint(this.items.map((item) => item.t), this.now) : -1;
    const isLabel = (i: number) => !crowded || i === focus;
    // That label is sized at its own distance, so it comes out as large as intended.
    const at = focus >= 0 && visible(focus) && depthOf(focus) > cam.near ? pxPerMetre(depthOf(focus)) : scale;
    const grow = growTo(crowded ? MIN_CROWDED_LABEL_PX : MIN_LABEL_PX, at);
    const size = sizeFor(grow, at);
    // The label left in a crowded view is drawn larger, a long one on two lines, so it stays legible.
    for (const item of this.items) {
      const s = (item.active || crowded ? ACTIVE_W : IDLE_W) * grow;
      item.sprite.scale.set(s, s * ASPECT, 1);
      const map = crowded && item.wrapped ? item.wrapped : item.texture;
      if (item.sprite.material.map !== map) item.sprite.material.map = map;
    }
    // A crowded view also keeps the label and markers off the figure, the
    // thing being studied, whenever there is room nearby (SHIG 20), and pulls
    // them in from the edges of the narrow canvas instead of cutting them off.
    const figure = crowded ? this.figureRect(cam, pxPerMetre, forward) : [];
    const inView = (p: Point, box: { w: number; h: number }) => (crowded ? clampToViewport(p, box, this.viewport) : p);
    const layout = layoutLabels(
      screen.map((p, i) => (visible(i) && isLabel(i) ? inView(p, size) : offscreen)),
      size,
      this.viewport,
      { previous: this.items.map((item) => item.cell), blocked: this.blocked, avoid: figure },
    );
    const markerSize = { w: MARKER_PX, h: MARKER_PX };
    const labelRects = layout.centers
      .filter((_, i) => visible(i) && isLabel(i))
      .map((c) => ({ x: c.x - size.w / 2, y: c.y - size.h / 2, w: size.w, h: size.h }));
    const markers = layoutLabels(
      screen.map((p, i) => (visible(i) && !isLabel(i) ? inView(p, markerSize) : offscreen)),
      markerSize,
      this.viewport,
      {
        previous: this.items.map((item) => item.markerCell),
        blocked: [...this.blocked, ...labelRects],
        avoid: figure,
        cells: MARKER_CELLS,
        clamp: true,
      },
    );

    const ease = reduceMotion ? 1 : 1 - Math.exp(-Math.max(dt, 0) / EASE_SECONDS);
    const toWorld = (p: Point, z: number) => new THREE.Vector3((p.x / w) * 2 - 1, 1 - (p.y / h) * 2, z).unproject(cam);
    let segments = 0;
    this.items.forEach((item, i) => {
      item.cell = layout.cells[i];
      item.markerCell = markers.cells[i];
      const label = isLabel(i);
      item.sprite.visible = label;
      item.marker.visible = !label;
      if (!visible(i)) {
        item.sprite.position.copy(item.anchor);
        item.marker.position.copy(item.anchor);
        item.shown = null;
        return;
      }
      const placed = label ? layout.centers[i] : markers.centers[i];
      const target = { x: placed.x - screen[i].x, y: placed.y - screen[i].y };
      const prev = item.shown ?? target;
      item.shown = { x: prev.x + (target.x - prev.x) * ease, y: prev.y + (target.y - prev.y) * ease };
      const centre = { x: screen[i].x + item.shown.x, y: screen[i].y + item.shown.y };
      const world = toWorld(centre, ndc[i].z);
      if (label) item.sprite.position.copy(world);
      else {
        item.marker.position.copy(world);
        const m = MARKER_PX / pxPerMetre(Math.max(depthOf(i), cam.near));
        item.marker.scale.set(m, m, 1);
      }
      // Leader lines only for labels: a line per marker would criss-cross the figure (SHIG 1).
      const end = label ? leaderEnd(screen[i], centre, size) : null;
      if (end) {
        const a = item.anchor;
        const b = toWorld(end, ndc[i].z);
        this.leaderPositions.set([a.x, a.y, a.z, b.x, b.y, b.z], segments * 6);
        segments++;
      }
    });
    const attr = this.leaders.geometry.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
    this.leaders.geometry.setDrawRange(0, segments * 2);
  }

  /** Screen rectangle around the figure in its current pose (empty when it is off screen). */
  private figureRect(cam: THREE.PerspectiveCamera, pxPerMetre: (depth: number) => number, forward: THREE.Vector3): Rect[] {
    const { w, h } = this.viewport;
    const joints: Point[] = [];
    const v = new THREE.Vector3();
    for (const key of FIGURE_JOINTS) {
      const p = this.character.bones[key].getWorldPosition(v).project(cam);
      if (Math.abs(p.z) <= 1) joints.push({ x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h });
    }
    const depth = this.character.bones.hips.getWorldPosition(v).sub(cam.position).dot(forward);
    const rect = boundingRect(joints, FIGURE_PAD * pxPerMetre(Math.max(depth, cam.near)));
    return rect ? [rect] : [];
  }

  /** Hit-test in canvas-space and seek to the matching annotation if any. */
  tryClick(ndc: THREE.Vector2): boolean {
    if (!this.camera || !this.onSeek) return false;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    // Only what is on screen: a full label or, in a crowded view, its marker.
    const targets = this.items.flatMap((i) => [i.sprite, i.marker]).filter((o) => o.visible);
    const hits = ray.intersectObjects(targets, false);
    if (hits.length > 0) {
      const t = hits[0].object.userData.t as number;
      this.onSeek(t);
      return true;
    }
    return false;
  }
}

/**
 * Label pill with its text: on one line, shrunk to fit if needed, or (`wrap`)
 * on two lines, which only pays off for long text; null when it does not.
 */
function makeLabelTexture(text: string, wrap: boolean): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  const font = (px: number) => `600 ${px}px system-ui, -apple-system, 'Hiragino Sans', sans-serif`;
  // Largest font (down to 24px) at which every line fits inside the pill.
  const maxWidth = canvas.width - 64;
  const fit = (lines: string[], start: number) => {
    let size = start;
    ctx.font = font(size);
    while (size > 24 && Math.max(...lines.map((l) => ctx.measureText(l).width)) > maxWidth) {
      size -= 2;
      ctx.font = font(size);
    }
    return size;
  };
  const lines = wrap ? splitLabel(text) : [text];
  const size = fit(lines, wrap ? 50 : 56);
  if (wrap && (lines[1] === "" || size <= fit([text], 56) + 4)) return null;
  // background pill
  ctx.fillStyle = "rgba(20, 28, 38, 0.85)";
  roundRect(ctx, 8, 24, canvas.width - 16, canvas.height - 48, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(120, 200, 255, 0.85)";
  ctx.lineWidth = 4;
  ctx.stroke();
  // text
  ctx.fillStyle = "#f4f7fb";
  ctx.font = font(size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineHeight = size + 4;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (i - (lines.length - 1) / 2) * lineHeight);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function makeLabelSprite(map: THREE.CanvasTexture): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.45, 0.14, 1);
  sprite.renderOrder = 999;
  return sprite;
}

/** Compact numbered marker for a collapsed keypoint: a dark disc with the
 * keypoint's number (order, not colour, tells them apart: SHIG 96); the
 * transparent margin widens the touch target. */
function makeMarkerSprite(n: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  ctx.arc(64, 64, 40, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(20, 28, 38, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(120, 200, 255, 0.9)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#f4f7fb";
  ctx.font = "700 50px system-ui, -apple-system, 'Hiragino Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n), 64, 67);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  sprite.renderOrder = 999;
  return sprite;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
