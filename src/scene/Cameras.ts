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
  }

  setMode(mode: CameraMode) {
    this.mode = mode;
    const pos = PRESETS[mode];
    this.camera.position.copy(pos);
    this.controls.target.copy(TARGET);
    this.controls.enabled = mode === "free";
    this.camera.lookAt(TARGET);
    this.controls.update();
  }

  getMode() {
    return this.mode;
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update() {
    if (this.controls.enabled) this.controls.update();
  }
}
