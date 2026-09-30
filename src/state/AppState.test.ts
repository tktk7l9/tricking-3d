import { describe, expect, it, vi } from "vitest";
import { AppState, type AppStateShape } from "./AppState";

const initial: AppStateShape = {
  trickId: "back-flip",
  time: 0,
  duration: 1.6,
  speed: 1,
  playing: true,
  cameraMode: "free",
  showAxis: true,
  showCom: true,
  showAnnotations: true,
};

describe("AppState", () => {
  it("returns the initial values and does not share the initial object", () => {
    const seed = { ...initial };
    const s = new AppState(seed);
    seed.time = 99;
    expect(s.get("time")).toBe(0);
    expect(s.get("trickId")).toBe("back-flip");
  });

  it("notifies subscribers with the new and previous value", () => {
    const s = new AppState(initial);
    const fn = vi.fn();
    s.subscribe("time", fn);
    s.set("time", 0.5);
    expect(fn).toHaveBeenCalledWith(0.5, 0);
    expect(s.get("time")).toBe(0.5);
  });

  it("does not notify when the value is unchanged", () => {
    const s = new AppState(initial);
    const fn = vi.fn();
    s.subscribe("playing", fn);
    s.set("playing", true);
    expect(fn).not.toHaveBeenCalled();
  });

  it("can fire immediately on subscribe with the current value", () => {
    const s = new AppState(initial);
    const fn = vi.fn();
    s.subscribe("cameraMode", fn, true);
    expect(fn).toHaveBeenCalledWith("free", "free");
  });

  it("stops notifying after unsubscribe while keeping other listeners", () => {
    const s = new AppState(initial);
    const a = vi.fn();
    const b = vi.fn();
    const off = s.subscribe("speed", a);
    s.subscribe("speed", b);
    off();
    s.set("speed", 2);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith(2, 1);
  });

  it("keeps keys independent", () => {
    const s = new AppState(initial);
    const fn = vi.fn();
    s.subscribe("showAxis", fn);
    s.set("showCom", false);
    expect(fn).not.toHaveBeenCalled();
    expect(s.get("showAxis")).toBe(true);
  });
});
