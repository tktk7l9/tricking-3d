import * as THREE from "three";

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111418);
    this.scene.fog = new THREE.Fog(0x111418, 18, 60);

    this.addLights();
    this.addGround();
  }

  private addLights() {
    const hemi = new THREE.HemisphereLight(0xbfd5ff, 0x202020, 0.6);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 8, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const s = 6;
    key.shadow.camera.left = -s;
    key.shadow.camera.right = s;
    key.shadow.camera.top = s;
    key.shadow.camera.bottom = -s;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x88aaff, 0.4);
    rim.position.set(-6, 4, -3);
    this.scene.add(rim);
  }

  private addGround() {
    const grid = new THREE.GridHelper(40, 40, 0x444a55, 0x22262d);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.7;
    this.scene.add(grid);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(20, 64),
      new THREE.MeshStandardMaterial({
        color: 0x1a1d22,
        roughness: 0.95,
        metalness: 0.0,
      }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -0.001;
    disc.receiveShadow = true;
    this.scene.add(disc);

    // Reference axes near origin (subtle)
    const axes = new THREE.AxesHelper(0.5);
    (axes.material as THREE.Material).transparent = true;
    (axes.material as THREE.Material).opacity = 0.5;
    this.scene.add(axes);
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
  }
}
