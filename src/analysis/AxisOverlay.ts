import * as THREE from "three";
import type { Character } from "../character/Character";
import type { Axis, TrickMeta } from "../tricks/catalog";

const AXIS_COLOR = {
  primary: 0xff5566,
  twist: 0x66e0ff,
};

const UNIT: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

export class AxisOverlay {
  readonly group: THREE.Group;
  private primary: THREE.ArrowHelper;
  private twist: THREE.ArrowHelper;
  private hasTwist = false;
  private character: Character;

  constructor(character: Character) {
    this.character = character;
    this.group = new THREE.Group();
    this.primary = makeArrow(AXIS_COLOR.primary, 1.0);
    this.twist = makeArrow(AXIS_COLOR.twist, 0.85);
    this.group.add(this.primary);
    this.group.add(this.twist);
  }

  setTrick(trick: TrickMeta) {
    setArrowAxis(this.primary, UNIT[trick.primaryAxis]);
    if (trick.twistAxis) {
      setArrowAxis(this.twist, UNIT[trick.twistAxis]);
      this.twist.visible = true;
      this.hasTwist = true;
    } else {
      this.twist.visible = false;
      this.hasTwist = false;
    }
  }

  setVisible(v: boolean) {
    this.primary.visible = v;
    this.twist.visible = v && this.hasTwist;
  }

  /** Anchor the arrow group to the character hips each frame. */
  follow() {
    const hips = this.character.bones.hips;
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    hips.getWorldPosition(pos);
    hips.getWorldQuaternion(quat);
    this.group.position.copy(pos);
    this.group.quaternion.copy(quat);
  }
}

function makeArrow(color: number, length: number): THREE.ArrowHelper {
  const a = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    length,
    color,
    length * 0.18,
    length * 0.1,
  );
  (a.line.material as THREE.LineBasicMaterial).linewidth = 2;
  return a;
}

function setArrowAxis(arrow: THREE.ArrowHelper, dir: THREE.Vector3) {
  arrow.setDirection(dir.clone().normalize());
}
