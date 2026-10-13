import { afterEach, describe, expect, it, vi } from "vitest";
import { Rig } from "../rig";
import { TRICK_FACTORIES } from "./index";

/* A body rotation keyed only in the air interpolates from its start value
 * across the whole ground phase, so the body turns while a foot is still down
 * and the foot slides. Every rotation used in the air must therefore also be
 * keyed on the ground, by takeoff at the latest. */
const CHANNELS = ["twist", "roll", "tilt", "spin", "pitch"] as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each(Object.keys(TRICK_FACTORIES))("%s takeoff", (id) => {
  it("keys every body rotation it uses in the air at or before takeoff", () => {
    const at = vi.spyOn(Rig.prototype, "at");
    const flight = vi.spyOn(Rig.prototype, "flight");
    TRICK_FACTORIES[id]();
    const starts = flight.mock.calls.map(([u0]) => u0);
    if (starts.length === 0) return;
    const takeoff = Math.min(...starts);
    for (const channel of CHANNELS) {
      const keys = at.mock.calls
        .map(([u, pose]) => [u, (pose as Record<string, number | undefined>)[channel]] as const)
        .filter(([, value]) => value !== undefined);
      const inAir = keys.filter(([u]) => u > takeoff + 1e-9);
      // The start pose keys every channel at u=0; a key between it and takeoff is what holds the channel.
      const onGround = keys.filter(([u]) => u > 0 && u <= takeoff + 1e-9);
      if (inAir.every(([, value]) => value === 0)) continue;
      expect(onGround.length, `${channel} is first keyed after takeoff (u=${takeoff})`).toBeGreaterThan(0);
    }
  });
});
