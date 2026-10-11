import * as THREE from "three";
import type { Character } from "../character/Character";
import type { AnimationPlayer } from "../character/AnimationPlayer";
import type { TrickMeta } from "../tricks/catalog";
import { clampSeekTime } from "../lib/seek";
import { layoutLabels, leaderEnd, type Point, type Rect } from "../lib/labelLayout";

type AnnotationItem = {
  t: number;
  label: string;
  /** where the label belongs: above the hips at its keypoint time */
  anchor: THREE.Vector3;
  sprite: THREE.Sprite;
  /** layout cell from the previous frame (keeps the layout steady) */
  cell: number;
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
/** Time constant (seconds) for easing labels into a new layout cell. */
const EASE_SECONDS = 0.08;
const MAX_LABELS = 32;

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
      this.group.remove(item.sprite);
      item.sprite.material.map?.dispose();
      item.sprite.material.dispose();
    }
    this.items = [];

    const duration = trick.duration;
    const player = this.player;
    const savedTime = player.getTime();
    const savedPlaying = player.isPlaying();
    player.setPlaying(false);

    for (const kp of trick.keypoints.slice(0, MAX_LABELS)) {
      const t = clampSeekTime(kp.t * duration, duration);
      player.setTime(t);
      const pos = new THREE.Vector3();
      this.character.bones.hips.getWorldPosition(pos);
      pos.y += 0.7;

      const sprite = makeLabelSprite(kp.label);
      sprite.position.copy(pos);
      sprite.userData.t = t;
      this.group.add(sprite);
      this.items.push({ t, label: kp.label, anchor: pos.clone(), sprite, cell: 0, active: false, shown: null });
    }
    this.leaders.geometry.setDrawRange(0, 0);

    player.setTime(savedTime);
    player.setPlaying(savedPlaying);
  }

  setVisible(v: boolean) {
    this.group.visible = v;
  }

  highlightAt(currentTime: number) {
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
    // One cell size for every label: the nearest anchor's (the largest on screen).
    let scale = 0;
    this.items.forEach((item, i) => {
      const depth = item.anchor.clone().sub(cam.position).dot(forward);
      if (depth > cam.near && Math.abs(ndc[i].z) <= 1) scale = Math.max(scale, pxPerMetre(depth));
    });
    if (scale === 0) return;
    // Keep labels legible on small canvases: grow them all by the same factor.
    const grow = Math.max(1, MIN_LABEL_PX / (ACTIVE_W * ASPECT * scale));
    for (const item of this.items) {
      const s = (item.active ? ACTIVE_W : IDLE_W) * grow;
      item.sprite.scale.set(s, s * ASPECT, 1);
    }
    const size = { w: ACTIVE_W * grow * scale, h: ACTIVE_W * ASPECT * grow * scale };
    const visible = (i: number) => Math.abs(ndc[i].z) <= 1;
    const anchors = screen.map((p, i) => (visible(i) ? p : { x: -1e6, y: -1e6 }));
    const layout = layoutLabels(anchors, size, this.viewport, {
      previous: this.items.map((item) => item.cell),
      blocked: this.blocked,
    });

    const ease = reduceMotion ? 1 : 1 - Math.exp(-Math.max(dt, 0) / EASE_SECONDS);
    const toWorld = (p: Point, z: number) => new THREE.Vector3((p.x / w) * 2 - 1, 1 - (p.y / h) * 2, z).unproject(cam);
    let segments = 0;
    this.items.forEach((item, i) => {
      item.cell = layout.cells[i];
      if (!visible(i)) {
        item.sprite.position.copy(item.anchor);
        item.shown = null;
        return;
      }
      const target = { x: layout.centers[i].x - screen[i].x, y: layout.centers[i].y - screen[i].y };
      const prev = item.shown ?? target;
      item.shown = { x: prev.x + (target.x - prev.x) * ease, y: prev.y + (target.y - prev.y) * ease };
      const centre = { x: screen[i].x + item.shown.x, y: screen[i].y + item.shown.y };
      item.sprite.position.copy(toWorld(centre, ndc[i].z));
      const end = leaderEnd(screen[i], centre, size);
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

  /** Hit-test in canvas-space and seek to the matching annotation if any. */
  tryClick(ndc: THREE.Vector2): boolean {
    if (!this.camera || !this.onSeek) return false;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hits = ray.intersectObjects(this.items.map((i) => i.sprite), false);
    if (hits.length > 0) {
      const t = hits[0].object.userData.t as number;
      this.onSeek(t);
      return true;
    }
    return false;
  }
}

function makeLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  // background pill
  ctx.fillStyle = "rgba(20, 28, 38, 0.85)";
  roundRect(ctx, 8, 24, canvas.width - 16, canvas.height - 48, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(120, 200, 255, 0.85)";
  ctx.lineWidth = 4;
  ctx.stroke();
  // text
  ctx.fillStyle = "#f4f7fb";
  // Shrink long labels so they fit inside the pill instead of being clipped.
  const maxWidth = canvas.width - 64;
  let size = 56;
  const font = (px: number) => `600 ${px}px system-ui, -apple-system, 'Hiragino Sans', sans-serif`;
  ctx.font = font(size);
  while (size > 24 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = font(size);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.45, 0.14, 1);
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
