import * as THREE from "three";
import type { Character } from "./Character";
import { buildClipFor } from "../tricks/animations/index";

export class AnimationPlayer {
  readonly mixer: THREE.AnimationMixer;
  private character: Character;
  private current: {
    clip: THREE.AnimationClip;
    action: THREE.AnimationAction;
    trickId: string;
  } | null = null;
  private speed = 1;
  private playing = true;

  constructor(character: Character) {
    this.character = character;
    this.mixer = new THREE.AnimationMixer(character.root);
  }

  loadTrick(trickId: string) {
    if (this.current?.trickId === trickId) return;

    if (this.current) {
      this.current.action.stop();
      this.mixer.uncacheAction(this.current.clip, this.character.root);
    }
    this.character.resetPose();

    const clip = buildClipFor(trickId);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.timeScale = 1; // master speed handled by mixer.update multiplier
    action.play();

    this.current = { clip, action, trickId };
    this.setTime(0);
    this.setPlaying(this.playing);
  }

  setTime(t: number) {
    if (!this.current) return;
    const d = this.current.clip.duration;
    const tt = ((t % d) + d) % d;
    this.current.action.time = tt;
    // force the mixer to apply the pose immediately even when paused
    this.mixer.update(0);
  }

  getTime(): number {
    return this.current?.action.time ?? 0;
  }

  getDuration(): number {
    return this.current?.clip.duration ?? 1;
  }

  setSpeed(s: number) {
    this.speed = Math.max(0.05, s);
  }

  setPlaying(p: boolean) {
    this.playing = p;
    if (this.current) this.current.action.paused = !p;
  }

  isPlaying() {
    return this.playing;
  }

  /** Step one frame at 30fps. */
  stepFrame(direction: 1 | -1) {
    if (!this.current) return;
    const dt = direction * (1 / 30);
    let t = this.getTime() + dt;
    const d = this.getDuration();
    if (t < 0) t += d;
    if (t >= d) t -= d;
    this.setTime(t);
  }

  /** Called every frame from the main loop. */
  update(deltaSeconds: number) {
    if (!this.current) return;
    if (this.playing) {
      this.mixer.update(deltaSeconds * this.speed);
    }
  }
}
