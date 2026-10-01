// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { getAllByRole, getByRole } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { CameraSwitcher, OverlaySwitcher } from "./CameraSwitcher";
import { makeState, mountHost } from "../test/helpers";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("CameraSwitcher", () => {
  it("offers the four views as a labelled group with the current one pressed", () => {
    const host = mountHost();
    new CameraSwitcher(host, makeState({ cameraMode: "free" }));
    expect(getByRole(document.body, "group", { name: "視点" })).toBe(host);
    const buttons = getAllByRole(host, "button");
    expect(buttons.map((b) => b.textContent)).toEqual(["正面", "側面", "真上", "自由"]);
    expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "false", "true"]);
    expect(getByRole(host, "button", { name: "自由" }).title).toContain("ドラッグ");
  });

  it("switches the camera mode on click and follows external changes", async () => {
    const host = mountHost();
    const state = makeState({ cameraMode: "free" });
    new CameraSwitcher(host, state);

    await userEvent.click(getByRole(host, "button", { name: "側面" }));
    expect(state.get("cameraMode")).toBe("side");
    expect(getByRole(host, "button", { name: "側面" }).getAttribute("aria-pressed")).toBe("true");
    expect(getByRole(host, "button", { name: "自由" }).getAttribute("aria-pressed")).toBe("false");

    // Dragging the 3D view puts the app back into free mode; the HUD must agree.
    state.set("cameraMode", "free");
    expect(getByRole(host, "button", { name: "自由" }).classList.contains("active")).toBe(true);
    expect(getByRole(host, "button", { name: "側面" }).classList.contains("active")).toBe(false);
  });
});

describe("OverlaySwitcher", () => {
  it("shows one toggle per overlay, all on by default", () => {
    const host = mountHost();
    new OverlaySwitcher(host, makeState());
    expect(getByRole(document.body, "group", { name: "表示の切り替え" })).toBe(host);
    const buttons = getAllByRole(host, "button");
    expect(buttons.map((b) => b.textContent)).toEqual(["軸表示", "重心軌跡", "注釈"]);
    expect(buttons.every((b) => b.getAttribute("aria-pressed") === "true")).toBe(true);
    // The colour swatch is decorative; the label carries the meaning.
    expect(buttons[0].querySelector(".swatch")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("toggles each overlay independently and reflects state set elsewhere", async () => {
    const host = mountHost();
    const state = makeState();
    new OverlaySwitcher(host, state);
    const com = getByRole(host, "button", { name: "重心軌跡" });

    await userEvent.click(com);
    expect(state.get("showCom")).toBe(false);
    expect(com.getAttribute("aria-pressed")).toBe("false");
    expect(state.get("showAxis")).toBe(true);
    expect(getByRole(host, "button", { name: "軸表示" }).getAttribute("aria-pressed")).toBe("true");

    await userEvent.click(com);
    expect(state.get("showCom")).toBe(true);

    state.set("showAnnotations", false);
    expect(getByRole(host, "button", { name: "注釈" }).getAttribute("aria-pressed")).toBe("false");
  });
});
