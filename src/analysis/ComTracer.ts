import * as THREE from "three";
import type { Character } from "../character/Character";
import type { AnimationPlayer } from "../character/AnimationPlayer";
import { clampSeekTime } from "../lib/seek";

const SAMPLES = 90;

export class ComTracer {
  readonly line: THREE.Line;
  private positions: Float32Array;
  private character: Character;
  private player: AnimationPlayer;

  constructor(character: Character, player: AnimationPlayer) {
    this.character = character;
    this.player = player;
    this.positions = new Float32Array(SAMPLES * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    geom.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.9,
    });
    this.line = new THREE.Line(geom, mat);
    this.line.frustumCulled = false;
  }

  setVisible(v: boolean) {
    this.line.visible = v;
  }

  /** Hips positions from the last bake (xyz triplets evenly spread over the clip). */
  get samples(): Float32Array {
    return this.positions;
  }

  /** Re-bake the trajectory by stepping through the clip without disturbing playback. */
  bake() {
    const player = this.player;
    const duration = player.getDuration();
    const savedTime = player.getTime();
    const savedPlaying = player.isPlaying();
    player.setPlaying(false);

    const tmp = new THREE.Vector3();
    for (let i = 0; i < SAMPLES; i++) {
      // The looping player wraps t = duration to the start pose; sample the
      // last frame instead so the trace (and the camera follow) ends where the
      // trick lands.
      player.setTime(clampSeekTime((duration * i) / (SAMPLES - 1), duration));
      this.character.bones.hips.getWorldPosition(tmp);
      this.positions[i * 3 + 0] = tmp.x;
      this.positions[i * 3 + 1] = tmp.y;
      this.positions[i * 3 + 2] = tmp.z;
    }

    const attr = this.line.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    attr.needsUpdate = true;
    this.line.geometry.setDrawRange(0, SAMPLES);
    this.line.geometry.computeBoundingSphere();

    // restore
    player.setTime(savedTime);
    player.setPlaying(savedPlaying);
  }
}
