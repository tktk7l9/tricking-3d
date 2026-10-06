import { describe, expect, it } from "vitest";
import { DEFAULT_TRICK_ID, TRICKS, getTrick } from "./catalog";
import { TRICK_FACTORIES, buildClipFor } from "./animations/index";

describe("trick catalog", () => {
  it("lists 27 tricks with unique ids and non-empty names", () => {
    expect(TRICKS).toHaveLength(27);
    const ids = TRICKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TRICKS) {
      expect(t.nameJp).not.toBe("");
      expect(t.nameEn).not.toBe("");
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.duration).toBeGreaterThan(0);
    }
  });

  it("keeps every keypoint list sorted from 0 to 1 with a landing at the end", () => {
    for (const t of TRICKS) {
      const ts = t.keypoints.map((k) => k.t);
      expect(ts[0]).toBe(0);
      expect(ts[ts.length - 1]).toBe(1);
      for (let i = 1; i < ts.length; i++) expect(ts[i]).toBeGreaterThan(ts[i - 1]);
      expect(t.keypoints[t.keypoints.length - 1].label).toContain("着地");
    }
  });

  it("getTrick returns the entry or throws for unknown ids", () => {
    expect(getTrick("back-flip").nameJp).toBe("バク宙");
    expect(getTrick(DEFAULT_TRICK_ID).id).toBe(DEFAULT_TRICK_ID);
    expect(() => getTrick("nope")).toThrow(/unknown trick: nope/);
  });

  it("has an animation for every trick and no orphan animations", () => {
    const ids = TRICKS.map((t) => t.id).sort();
    expect(Object.keys(TRICK_FACTORIES).sort()).toEqual(ids);
    expect(() => buildClipFor("nope")).toThrow(/no animation factory/);
  });

  it("animation clip durations agree with the catalog so the timeline and player stay in sync", () => {
    for (const t of TRICKS) {
      const clip = buildClipFor(t.id);
      expect(clip.name).toBe(t.id);
      expect(clip.duration, t.id).toBeCloseTo(t.duration, 6);
      expect(clip.tracks.length).toBeGreaterThan(0);
    }
  });
});
