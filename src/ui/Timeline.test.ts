// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, getByLabelText, getByRole, getByText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { Timeline } from "./Timeline";
import { FRAME } from "../lib/seek";
import { makeState, mountHost } from "../test/helpers";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup(overrides = {}) {
  const host = mountHost("footer");
  const state = makeState(overrides);
  const timeline = new Timeline(host, state);
  return { host, state, timeline };
}

describe("Timeline", () => {
  it("shows the time label and a 1× speed by default", () => {
    const { host } = setup({ time: 0.4, duration: 1.6 });
    expect(getByText(host, "0.40 / 1.60 s")).toBeTruthy();
    const speed = getByLabelText(host, "再生速度") as HTMLSelectElement;
    expect(speed.value).toBe("1");
    expect(Array.from(speed.options).map((o) => o.textContent)).toEqual([
      "0.1×",
      "0.25×",
      "0.5×",
      "1×",
      "1.5×",
      "2×",
    ]);
  });

  it("toggles play and pause from the button and reflects external state", async () => {
    const { host, state } = setup({ playing: true });
    const btn = getByRole(host, "button", { name: "一時停止（Space）" });
    expect(btn.textContent).toBe("⏸");

    await userEvent.click(btn);
    expect(state.get("playing")).toBe(false);
    expect(btn.textContent).toBe("▶");
    expect(btn.getAttribute("aria-label")).toBe("再生（Space）");
    expect(btn.title).toBe("再生（Space）");

    state.set("playing", true);
    expect(btn.textContent).toBe("⏸");
  });

  it("steps one frame forward or back, pausing playback and wrapping at the loop ends", async () => {
    const { host, state } = setup({ time: 0, duration: 1.6, playing: true });
    await userEvent.click(getByRole(host, "button", { name: "1コマ進む（→）" }));
    expect(state.get("playing")).toBe(false);
    expect(state.get("time")).toBeCloseTo(FRAME);

    await userEvent.click(getByRole(host, "button", { name: "1コマ戻る（←）" }));
    expect(state.get("time")).toBeCloseTo(0);

    await userEvent.click(getByRole(host, "button", { name: "1コマ戻る（←）" }));
    expect(state.get("time")).toBeCloseTo(1.6 - FRAME);
    expect(getByText(host, `${(1.6 - FRAME).toFixed(2)} / 1.60 s`)).toBeTruthy();
  });

  it("scrubbing the slider pauses and seeks proportionally to the duration", () => {
    const { host, state } = setup({ duration: 2, playing: true });
    const slider = getByLabelText(host, "再生位置") as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "0.25" } });
    expect(state.get("playing")).toBe(false);
    expect(state.get("time")).toBeCloseTo(0.5);
    expect(getByText(host, "0.50 / 2.00 s")).toBeTruthy();
  });

  it("dragging the slider to the very end stays on the last frame instead of looping to the start", () => {
    const { host, state } = setup({ duration: 1.6 });
    const slider = getByLabelText(host, "再生位置") as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "1" } });
    expect(state.get("time")).toBeLessThan(1.6);
    expect(state.get("time")).toBeGreaterThan(1.59);
  });

  it("changes the playback speed from the select", async () => {
    const { host, state } = setup();
    const speed = getByLabelText(host, "再生速度") as HTMLSelectElement;
    await userEvent.selectOptions(speed, "0.5");
    expect(state.get("speed")).toBe(0.5);
    await userEvent.selectOptions(speed, "2");
    expect(state.get("speed")).toBe(2);
  });

  it("syncFromTime moves the slider and label without touching state", () => {
    const { host, state, timeline } = setup({ duration: 2, time: 0 });
    const slider = getByLabelText(host, "再生位置") as HTMLInputElement;
    timeline.syncFromTime(1);
    expect(parseFloat(slider.value)).toBeCloseTo(0.5);
    expect(state.get("playing")).toBe(true);
    // A sub-threshold change leaves the slider value alone.
    timeline.syncFromTime(1.0005);
    expect(slider.value).toBe("0.5");
  });

  it("syncFromTime is a no-op while the duration is unknown", () => {
    const { host, timeline } = setup({ duration: 0 });
    const slider = getByLabelText(host, "再生位置") as HTMLInputElement;
    timeline.syncFromTime(0.7);
    expect(slider.value).toBe("0");
  });

  describe("keyboard shortcuts", () => {
    it("space toggles play, arrows step frames", async () => {
      const { state } = setup({ playing: true, time: 0.5, duration: 1.6 });
      await userEvent.keyboard(" ");
      expect(state.get("playing")).toBe(false);
      await userEvent.keyboard("{ArrowRight}");
      expect(state.get("time")).toBeCloseTo(0.5 + FRAME);
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(state.get("time")).toBeCloseTo(0.5 - FRAME);
      await userEvent.keyboard(" ");
      expect(state.get("playing")).toBe(true);
    });

    it("claims handled keys so Space does not scroll the page or arrows move focus", () => {
      setup({ playing: true, time: 0.5, duration: 1.6 });
      // fireEvent returns false when a listener called preventDefault().
      expect(fireEvent.keyDown(document.body, { key: " " })).toBe(false);
      expect(fireEvent.keyDown(document.body, { key: "ArrowRight" })).toBe(false);
      expect(fireEvent.keyDown(document.body, { key: "ArrowLeft" })).toBe(false);
      // Keys the timeline does not handle keep their default behaviour.
      expect(fireEvent.keyDown(document.body, { key: "ArrowDown" })).toBe(true);
    });

    it("leaves keys alone while typing in a text field", async () => {
      const { state } = setup({ playing: true, time: 0.5 });
      const input = document.createElement("input");
      input.type = "search";
      document.body.appendChild(input);
      input.focus();
      await userEvent.keyboard(" {ArrowRight}");
      expect(state.get("playing")).toBe(true);
      expect(state.get("time")).toBe(0.5);
      expect(input.value).toBe(" ");
    });

    it("space on a focused button does not double-fire", async () => {
      const { host, state } = setup({ playing: true });
      getByRole(host, "button", { name: "一時停止（Space）" }).focus();
      await userEvent.keyboard(" ");
      // The button's own click toggles once; the global shortcut stays quiet.
      expect(state.get("playing")).toBe(false);
    });

    it("ignores modifier combinations", async () => {
      const { state } = setup({ playing: true });
      await userEvent.keyboard("{Meta>} {/Meta}");
      expect(state.get("playing")).toBe(true);
    });
  });
});
