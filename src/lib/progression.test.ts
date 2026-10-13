import { describe, expect, it } from "vitest";
import { prerequisitesOf, unlocksOf } from "./progression";
import { TRICKS } from "../tricks/catalog";

const ids = (tricks: { id: string }[]) => tricks.map((t) => t.id);

describe("progression", () => {
  it("lists a trick's prerequisites in the order Loopkicks gives them", () => {
    expect(ids(prerequisitesOf("540-gyro"))).toEqual(["540-kick"]);
    expect(ids(prerequisitesOf("cheat-900-gyro"))).toEqual(["cheat-900-hyper", "540-gyro"]);
    expect(ids(prerequisitesOf("raiz"))).toEqual(["gumbi", "cheat-kick"]);
  });

  it("lists the tricks a trick unlocks in catalogue order", () => {
    expect(ids(unlocksOf("540-gyro"))).toEqual(["cheat-900-gyro"]);
    expect(ids(unlocksOf("back-flip"))).toEqual(["x-out", "back-pike", "flash-kick", "arabian", "gainer"]);
    expect(ids(unlocksOf("butterfly-twist"))).toEqual([
      "janitor-twist",
      "butterfly-twist-round",
      "butterfly-twist-hyper",
      "butterfly-twist-axe",
      "butterfly-twist-doubleleg",
      "aerial-twist",
      "cheat-720-twist",
      "spyder-twist",
    ]);
  });

  it("has nothing before a family's base trick and nothing after the newest variations", () => {
    expect(prerequisitesOf("back-flip")).toEqual([]);
    expect(unlocksOf("cheat-900-gyro")).toEqual([]);
    expect(prerequisitesOf("lotus")).toEqual([]);
    expect(unlocksOf("lotus")).toEqual([]);
  });

  it("links every pair both ways: A unlocks B exactly when B lists A as a prerequisite", () => {
    for (const trick of TRICKS) {
      for (const next of unlocksOf(trick.id)) expect(ids(prerequisitesOf(next.id))).toContain(trick.id);
      for (const before of prerequisitesOf(trick.id)) expect(ids(unlocksOf(before.id))).toContain(trick.id);
    }
  });
});
