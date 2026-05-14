import * as THREE from "three";
import type { Character } from "../character/Character";
import type { AnimationPlayer } from "../character/AnimationPlayer";
import type { TrickMeta } from "../tricks/catalog";

type AnnotationItem = {
  t: number;
  label: string;
  pos: THREE.Vector3;
  sprite: THREE.Sprite;
};

export class Annotations {
  readonly group: THREE.Group;
  private items: AnnotationItem[] = [];
  private character: Character;
  private player: AnimationPlayer;
  private camera: THREE.Camera | null = null;
  private onSeek: ((t: number) => void) | null = null;

  constructor(character: Character, player: AnimationPlayer) {
    this.character = character;
    this.player = player;
    this.group = new THREE.Group();
    this.group.frustumCulled = false;
  }

  setCamera(c: THREE.Camera) {
    this.camera = c;
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

    for (const kp of trick.keypoints) {
      const t = kp.t * duration;
      player.setTime(t);
      const pos = new THREE.Vector3();
      this.character.bones.hips.getWorldPosition(pos);
      pos.y += 0.7;

      const sprite = makeLabelSprite(kp.label);
      sprite.position.copy(pos);
      sprite.userData.t = t;
      this.group.add(sprite);
      this.items.push({ t, label: kp.label, pos: pos.clone(), sprite });
    }

    player.setTime(savedTime);
    player.setPlaying(savedPlaying);
  }

  setVisible(v: boolean) {
    this.group.visible = v;
  }

  highlightAt(currentTime: number) {
    for (const item of this.items) {
      const dt = Math.abs(item.t - currentTime);
      const active = dt < 0.12;
      const mat = item.sprite.material;
      mat.opacity = active ? 1.0 : 0.55;
      const s = active ? 0.55 : 0.42;
      item.sprite.scale.set(s, s * 0.32, 1);
    }
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
  ctx.font = "600 56px system-ui, -apple-system, 'Hiragino Sans', sans-serif";
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
