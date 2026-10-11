import { describe, expect, it } from "vitest";
import { Cameras } from "./Cameras";

// OrbitControls only needs event registration and a style object from its element.
function fakeCanvas(): HTMLCanvasElement {
  const noop = () => {};
  const root = { addEventListener: noop, removeEventListener: noop };
  return {
    addEventListener: noop,
    removeEventListener: noop,
    ownerDocument: root,
    getRootNode: () => root,
    style: {},
  } as unknown as HTMLCanvasElement;
}

// Simulate the inertia left behind by a quick drag (OrbitControls' pending rotation).
function leaveDragInertia(cams: Cameras) {
  (cams.controls as unknown as { _sphericalDelta: { theta: number; phi: number } })._sphericalDelta.theta = 0.6;
}

describe("Cameras.setMode", () => {
  it("lands exactly on the preset even when a drag left damping inertia behind", () => {
    const cams = new Cameras(fakeCanvas());
    leaveDragInertia(cams);
    cams.setMode("front");
    for (let i = 0; i < 60; i++) cams.update();
    expect(cams.camera.position.x).toBeCloseTo(0, 5);
    expect(cams.camera.position.y).toBeCloseTo(1.4, 5);
    expect(cams.camera.position.z).toBeCloseTo(5, 5);
    expect(cams.getMode()).toBe("front");
  });

  it("stays in the preset mode when damping settles without user input", () => {
    const cams = new Cameras(fakeCanvas());
    cams.setMode("side");
    for (let i = 0; i < 10; i++) cams.update();
    expect(cams.getMode()).toBe("side");
    expect(cams.camera.position.x).toBeCloseTo(5, 5);
  });

  it("switches to free and notifies when the user orbits a preset view", () => {
    const cams = new Cameras(fakeCanvas());
    let notified = 0;
    cams.setUserOrbitHandler(() => notified++);
    cams.setMode("top");
    cams.controls.dispatchEvent({ type: "start" });
    leaveDragInertia(cams);
    cams.update();
    cams.controls.dispatchEvent({ type: "end" });
    expect(cams.getMode()).toBe("free");
    expect(notified).toBe(1);
  });
});

describe("Cameras.setFollow", () => {
  it("moves the camera and its orbit centre together, keeping the preset angle", () => {
    const cams = new Cameras(fakeCanvas());
    cams.setMode("side");
    cams.setFollow(1.5, 2);
    for (let i = 0; i < 30; i++) cams.update();
    expect(cams.camera.position.x).toBeCloseTo(6.5, 5);
    expect(cams.camera.position.y).toBeCloseTo(1.4, 5);
    expect(cams.camera.position.z).toBeCloseTo(2, 5);
    expect(cams.controls.target.x).toBeCloseTo(1.5, 5);
    expect(cams.controls.target.z).toBeCloseTo(2, 5);
    expect(cams.getMode()).toBe("side");
  });

  it("frames the follow point when the preset changes", () => {
    const cams = new Cameras(fakeCanvas());
    cams.setFollow(2, -1);
    cams.setMode("front");
    expect(cams.camera.position.x).toBeCloseTo(2, 5);
    expect(cams.camera.position.z).toBeCloseTo(4, 5);
    expect(cams.controls.target.x).toBeCloseTo(2, 5);
    expect(cams.controls.target.z).toBeCloseTo(-1, 5);
  });

  it("returns to the fixed framing when the offset goes back to zero", () => {
    const cams = new Cameras(fakeCanvas());
    cams.setMode("top");
    cams.setFollow(3, 1);
    cams.setFollow(0, 0);
    for (let i = 0; i < 10; i++) cams.update();
    expect(cams.controls.target.x).toBeCloseTo(0, 5);
    expect(cams.controls.target.z).toBeCloseTo(0, 5);
    expect(cams.getMode()).toBe("top");
  });

  it("scales the distance from the orbit centre for the zoom factor and back", () => {
    const cams = new Cameras(fakeCanvas());
    cams.setMode("front");
    cams.setFollow(0, 0, 1.5);
    expect(cams.camera.position.y).toBeCloseTo(1.6, 5);
    expect(cams.camera.position.z).toBeCloseTo(7.5, 5);
    cams.setMode("side");
    expect(cams.camera.position.x).toBeCloseTo(7.5, 5);
    cams.setFollow(0, 0, 1);
    expect(cams.camera.position.x).toBeCloseTo(5, 5);
    expect(cams.camera.position.y).toBeCloseTo(1.4, 5);
  });
});
