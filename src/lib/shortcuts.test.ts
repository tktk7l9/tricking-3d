import { describe, expect, it } from "vitest";
import { shortcutFor } from "./shortcuts";

const key = (k: string, extra: Partial<Parameters<typeof shortcutFor>[0]> = {}) =>
  shortcutFor({ key: k, targetTag: "BODY", ...extra });

describe("shortcutFor", () => {
  it("maps space to play/pause and arrows to frame steps", () => {
    expect(key(" ")).toBe("toggle-play");
    expect(key("ArrowLeft")).toBe("step-back");
    expect(key("ArrowRight")).toBe("step-forward");
  });
  it("ignores other keys and modifier combinations", () => {
    expect(key("a")).toBeNull();
    expect(key(" ", { ctrlKey: true })).toBeNull();
    expect(key("ArrowLeft", { metaKey: true })).toBeNull();
    expect(key("ArrowLeft", { altKey: true })).toBeNull();
  });
  it("does not steal keys from text fields, selects and sliders", () => {
    expect(key(" ", { targetTag: "INPUT", targetType: "search" })).toBeNull();
    expect(key("ArrowLeft", { targetTag: "INPUT", targetType: "range" })).toBeNull();
    expect(key("ArrowRight", { targetTag: "SELECT" })).toBeNull();
    expect(key(" ", { targetTag: "TEXTAREA" })).toBeNull();
    expect(key(" ", { targetTag: "DIV", isContentEditable: true })).toBeNull();
  });
  it("leaves space on buttons to the button itself", () => {
    expect(key(" ", { targetTag: "BUTTON" })).toBeNull();
    expect(key("ArrowRight", { targetTag: "BUTTON" })).toBe("step-forward");
  });
});
