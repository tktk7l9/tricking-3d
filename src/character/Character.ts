import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type BoneKey =
  | "hips"
  | "spine"
  | "spine1"
  | "spine2"
  | "neck"
  | "head"
  | "leftShoulder"
  | "leftArm"
  | "leftForeArm"
  | "leftHand"
  | "rightShoulder"
  | "rightArm"
  | "rightForeArm"
  | "rightHand"
  | "leftUpLeg"
  | "leftLeg"
  | "leftFoot"
  | "leftToe"
  | "rightUpLeg"
  | "rightLeg"
  | "rightFoot"
  | "rightToe";

export type Bones = Record<BoneKey, THREE.Object3D>;

const MIXAMO_NAME: Record<BoneKey, string> = {
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

export class Character {
  readonly root: THREE.Group;
  readonly bones: Bones;
  readonly source: "procedural" | "gltf";

  private constructor(root: THREE.Group, bones: Bones, source: "procedural" | "gltf") {
    this.root = root;
    this.bones = bones;
    this.source = source;
  }

  static async load(gltfUrl?: string): Promise<Character> {
    if (gltfUrl) {
      try {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(gltfUrl);
        const bones = collectMixamoBones(gltf.scene);
        if (bones) {
          gltf.scene.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              o.castShadow = true;
              o.receiveShadow = false;
            }
          });
          const root = new THREE.Group();
          root.add(gltf.scene);
          return new Character(root, bones, "gltf");
        }
        console.warn("[Character] GLB loaded but bones not found, falling back to procedural");
      } catch (e) {
        console.warn("[Character] GLB load failed, falling back to procedural:", e);
      }
    }
    return new Character(...buildProcedural());
  }

  /** Resets every bone to its base local transform (T-pose). */
  resetPose() {
    for (const key of Object.keys(this.bones) as BoneKey[]) {
      const bone = this.bones[key];
      const base = bone.userData.basePose as
        | { pos: THREE.Vector3; quat: THREE.Quaternion }
        | undefined;
      if (base) {
        bone.position.copy(base.pos);
        bone.quaternion.copy(base.quat);
      }
    }
  }

  /** World position of a bone — useful for COM tracing & annotations. */
  getWorldPosition(key: BoneKey, target = new THREE.Vector3()): THREE.Vector3 {
    return this.bones[key].getWorldPosition(target);
  }
}

function collectMixamoBones(scene: THREE.Object3D): Bones | null {
  const map = new Map<string, THREE.Object3D>();
  scene.traverse((o) => {
    if (o.name) map.set(o.name, o);
  });
  const out: Partial<Bones> = {};
  for (const key of Object.keys(MIXAMO_NAME) as BoneKey[]) {
    const node = map.get(MIXAMO_NAME[key]);
    if (!node) return null;
    out[key] = node;
    captureBase(node);
  }
  return out as Bones;
}

function captureBase(o: THREE.Object3D) {
  o.userData.basePose = {
    pos: o.position.clone(),
    quat: o.quaternion.clone(),
  };
}

/* ============================================================
 * Procedural humanoid (Mixamo-compatible bone hierarchy).
 * Used as a fallback when no GLB is provided.
 * ============================================================ */

function buildProcedural(): [THREE.Group, Bones, "procedural"] {
  const root = new THREE.Group();
  root.name = "characterRoot";

  const skin = new THREE.MeshStandardMaterial({
    color: 0xe6c0a4,
    roughness: 0.7,
    metalness: 0.0,
  });
  const shirt = new THREE.MeshStandardMaterial({
    color: 0x3a7bd5,
    roughness: 0.65,
    metalness: 0.0,
  });
  const pants = new THREE.MeshStandardMaterial({
    color: 0x2b2f3a,
    roughness: 0.85,
    metalness: 0.0,
  });
  const shoe = new THREE.MeshStandardMaterial({
    color: 0x101216,
    roughness: 0.6,
    metalness: 0.05,
  });

  const joint = (name: BoneKey, parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const o = new THREE.Object3D();
    o.name = MIXAMO_NAME[name];
    o.position.set(x, y, z);
    parent.add(o);
    captureBase(o);
    return o;
  };

  // Hips at standing height
  const hips = joint("hips", root, 0, 0.95, 0);

  // Pelvis visual
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.22), pants);
  pelvis.position.y = -0.02;
  pelvis.castShadow = true;
  hips.add(pelvis);

  // Spine column
  const spine = joint("spine", hips, 0, 0.1, 0);
  const spine1 = joint("spine1", spine, 0, 0.13, 0);
  const spine2 = joint("spine2", spine1, 0, 0.14, 0);

  // Torso visual on spine1
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.34, 0.22),
    shirt,
  );
  torso.position.y = 0.12;
  torso.castShadow = true;
  spine1.add(torso);

  // Neck + head
  const neck = joint("neck", spine2, 0, 0.16, 0);
  const head = joint("head", neck, 0, 0.07, 0);
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 24, 16),
    skin,
  );
  headMesh.position.y = 0.09;
  headMesh.castShadow = true;
  head.add(headMesh);

  // Eye markers (so we can see facing direction)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), eyeMat);
    eye.position.set(sx * 0.04, 0.10, 0.115);
    head.add(eye);
  }

  // Arms: shoulder → arm → forearm → hand
  buildArm(spine2, "left", 1, shirt, skin);
  buildArm(spine2, "right", -1, shirt, skin);

  // Legs
  buildLeg(hips, "left", 1, pants, shoe);
  buildLeg(hips, "right", -1, pants, shoe);

  return [
    root,
    {
      hips,
      spine,
      spine1,
      spine2,
      neck,
      head,
      leftShoulder: getJoint(root, MIXAMO_NAME.leftShoulder),
      leftArm: getJoint(root, MIXAMO_NAME.leftArm),
      leftForeArm: getJoint(root, MIXAMO_NAME.leftForeArm),
      leftHand: getJoint(root, MIXAMO_NAME.leftHand),
      rightShoulder: getJoint(root, MIXAMO_NAME.rightShoulder),
      rightArm: getJoint(root, MIXAMO_NAME.rightArm),
      rightForeArm: getJoint(root, MIXAMO_NAME.rightForeArm),
      rightHand: getJoint(root, MIXAMO_NAME.rightHand),
      leftUpLeg: getJoint(root, MIXAMO_NAME.leftUpLeg),
      leftLeg: getJoint(root, MIXAMO_NAME.leftLeg),
      leftFoot: getJoint(root, MIXAMO_NAME.leftFoot),
      leftToe: getJoint(root, MIXAMO_NAME.leftToe),
      rightUpLeg: getJoint(root, MIXAMO_NAME.rightUpLeg),
      rightLeg: getJoint(root, MIXAMO_NAME.rightLeg),
      rightFoot: getJoint(root, MIXAMO_NAME.rightFoot),
      rightToe: getJoint(root, MIXAMO_NAME.rightToe),
    },
    "procedural",
  ];
}

function getJoint(root: THREE.Object3D, name: string): THREE.Object3D {
  let found: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (!found && o.name === name) found = o;
  });
  if (!found) throw new Error(`bone not found: ${name}`);
  return found;
}

function buildArm(
  parent: THREE.Object3D,
  side: "left" | "right",
  sx: number,
  shirt: THREE.Material,
  skin: THREE.Material,
) {
  const cap = (axis: "x", len: number, radius: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius, len * 0.7, 4, 12),
      mat,
    );
    if (axis === "x") {
      m.rotation.z = Math.PI / 2;
      m.position.x = (sx * len) / 2;
    }
    m.castShadow = true;
    return m;
  };

  const j = (name: BoneKey, p: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const o = new THREE.Object3D();
    o.name = MIXAMO_NAME[name];
    o.position.set(x, y, z);
    p.add(o);
    captureBase(o);
    return o;
  };

  const shoulder = j(
    side === "left" ? "leftShoulder" : "rightShoulder",
    parent,
    sx * 0.05,
    0.10,
    0,
  );
  const arm = j(
    side === "left" ? "leftArm" : "rightArm",
    shoulder,
    sx * 0.13,
    0,
    0,
  );
  arm.add(cap("x", 0.32, 0.055, shirt));

  const fore = j(
    side === "left" ? "leftForeArm" : "rightForeArm",
    arm,
    sx * 0.30,
    0,
    0,
  );
  fore.add(cap("x", 0.28, 0.045, skin));

  const hand = j(
    side === "left" ? "leftHand" : "rightHand",
    fore,
    sx * 0.28,
    0,
    0,
  );
  const handMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.10),
    skin,
  );
  handMesh.position.x = sx * 0.05;
  handMesh.castShadow = true;
  hand.add(handMesh);
}

function buildLeg(
  parent: THREE.Object3D,
  side: "left" | "right",
  sx: number,
  pants: THREE.Material,
  shoe: THREE.Material,
) {
  const cap = (len: number, radius: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius, len * 0.7, 4, 12),
      mat,
    );
    m.position.y = -len / 2;
    m.castShadow = true;
    return m;
  };

  const j = (name: BoneKey, p: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const o = new THREE.Object3D();
    o.name = MIXAMO_NAME[name];
    o.position.set(x, y, z);
    p.add(o);
    captureBase(o);
    return o;
  };

  const upLeg = j(
    side === "left" ? "leftUpLeg" : "rightUpLeg",
    parent,
    sx * 0.10,
    -0.05,
    0,
  );
  upLeg.add(cap(0.45, 0.075, pants));

  const leg = j(
    side === "left" ? "leftLeg" : "rightLeg",
    upLeg,
    0,
    -0.45,
    0,
  );
  leg.add(cap(0.45, 0.06, pants));

  const foot = j(
    side === "left" ? "leftFoot" : "rightFoot",
    leg,
    0,
    -0.45,
    0,
  );
  const footMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.05, 0.20),
    shoe,
  );
  footMesh.position.set(0, -0.025, 0.05);
  footMesh.castShadow = true;
  foot.add(footMesh);

  j(side === "left" ? "leftToe" : "rightToe", foot, 0, 0, 0.10);
}
