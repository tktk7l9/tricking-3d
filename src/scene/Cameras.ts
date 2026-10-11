import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type CameraMode = "front" | "side" | "top" | "free";

const TARGET = new THREE.Vector3(0, 1.0, 0);

const PRESETS: Record<CameraMode, THREE.Vector3> = {
  front: new THREE.Vector3(0, 1.4, 5),
  side: new THREE.Vector3(5, 1.4, 0),
  top: new THREE.Vector3(0.001, 6, 0.001),
  free: new THREE.Vector3(3.5, 2.2, 3.5),
};

export class Cameras {
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private mode: CameraMode = "free";
  private interacting = false;
  private onUserOrbit: (() => void) | null = null;
  /** Horizontal offset currently applied to the view (camera follow), and the distance factor. */
  private follow = new THREE.Vector3();
  private zoom = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    this.camera.position.copy(PRESETS.free);
    this.camera.lookAt(TARGET);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(TARGET);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 20;
    this.controls.maxPolarAngle = Math.PI * 0.49;

    // Orbit stays enabled in every mode: dragging a preset view switches to
    // free mode instead of silently doing nothing (SHIG 8, 9).
    this.controls.addEventListener("start", () => (this.interacting = true));
    this.controls.addEventListener("end", () => (this.interacting = false));
    this.controls.addEventListener("change", () => {
      if (!this.interacting || this.mode === "free") return;
      this.mode = "free";
      this.onUserOrbit?.();
    });
  }

  /** Called when the user drags/zooms while a preset view is active. */
  setUserOrbitHandler(fn: () => void) {
    this.onUserOrbit = fn;
  }

  setMode(mode: CameraMode) {
    // Already there (e.g. switched to free by dragging): keep the user's view.
    if (mode === this.mode) return;
    // Controls now update every frame in every mode, so leftover damping from a
    // recent drag would keep rotating the camera away from the preset. Flush it
    // (one undamped update applies and clears the pending delta) before snapping.
    const damping = this.controls.enableDamping;
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = damping;
    this.mode = mode;
    const target = TARGET.clone().add(this.follow);
    this.camera.position.copy(PRESETS[mode]).sub(TARGET).multiplyScalar(this.zoom).add(target);
    this.controls.target.copy(target);
    this.camera.lookAt(target);
    this.controls.update();
  }

  /**
   * Move the view with a travelling trick: the camera and its orbit centre shift
   * together by the change in the horizontal offset, so preset and free views
   * keep their angle and distance (SHIG 7: the user's orbit is never taken
   * over). `zoom` scales the distance from the orbit centre.
   */
  setFollow(x: number, z: number, zoom = 1) {
    const dx = x - this.follow.x;
    const dz = z - this.follow.z;
    if (dx !== 0 || dz !== 0) {
      this.camera.position.x += dx;
      this.camera.position.z += dz;
      this.controls.target.x += dx;
      this.controls.target.z += dz;
      this.follow.set(x, 0, z);
    }
    if (zoom !== this.zoom) {
      const offset = this.camera.position.clone().sub(this.controls.target).multiplyScalar(zoom / this.zoom);
      this.camera.position.copy(this.controls.target).add(offset);
      this.zoom = zoom;
    }
  }

  getMode() {
    return this.mode;
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }
}
