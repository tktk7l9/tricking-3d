// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { getAllByRole, getByRole, getByText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { InfoPanel } from "./InfoPanel";
import { getTrick } from "../tricks/catalog";
import { makeState, mountHost } from "../test/helpers";

afterEach(() => {
  document.body.innerHTML = "";
});

function keypointButtons(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>("button.kp"));
}

describe("InfoPanel", () => {
  it("describes the current trick in plain Japanese", () => {
    const host = mountHost("aside");
    new InfoPanel(host, makeState({ trickId: "back-flip" }));
    const trick = getTrick("back-flip");

    expect(getByRole(host, "heading", { level: 2 }).textContent).toBe(trick.nameJp);
    expect(getByText(host, trick.nameEn)).toBeTruthy();
    expect(getByText(host, "カテゴリ").nextElementSibling!.textContent).toBe("フリップ");
    expect(getByText(host, "踏切").nextElementSibling!.textContent).toBe("両足");
    expect(getByText(host, "主回転軸").nextElementSibling!.textContent).toBe("X 軸（左右・宙返り）");
    expect(getByText(host, "捻り軸").nextElementSibling!.textContent).toBe("なし");
    expect(getByText(host, "所要時間").nextElementSibling!.textContent).toBe("1.60 s");
    expect(getByText(host, trick.description)).toBeTruthy();
    expect(host.classList.contains("info-panel")).toBe(true);
  });

  it("lists every keypoint with its time, keeping the landing inside the clip", () => {
    const host = mountHost("aside");
    new InfoPanel(host, makeState({ trickId: "back-flip" }));
    const trick = getTrick("back-flip");
    const buttons = keypointButtons(host);
    expect(buttons).toHaveLength(trick.keypoints.length);
    expect(buttons[0].textContent).toBe(`0.00s${trick.keypoints[0].label}`);
    const last = buttons[buttons.length - 1];
    expect(last.textContent).toContain("着地");
    // 1.0 * 1.6 would wrap the looping player to frame 0; the label shows the clamped time.
    expect(last.querySelector(".t")!.textContent).toBe("1.60s");
  });

  it("pressing a keypoint pauses and seeks to that moment", async () => {
    const host = mountHost("aside");
    const state = makeState({ trickId: "back-flip", playing: true });
    new InfoPanel(host, state);
    const trick = getTrick("back-flip");
    const buttons = keypointButtons(host);

    await userEvent.click(buttons[1]);
    expect(state.get("playing")).toBe(false);
    expect(state.get("time")).toBeCloseTo(trick.keypoints[1].t * trick.duration);
    expect(buttons[1].getAttribute("aria-current")).toBe("step");

    await userEvent.click(buttons[buttons.length - 1]);
    expect(state.get("time")).toBeLessThan(trick.duration);
    expect(state.get("time")).toBeGreaterThan(trick.duration - 0.01);
  });

  it("highlights the keypoint nearest to the playhead and clears it when none is close", () => {
    const host = mountHost("aside");
    const state = makeState({ trickId: "back-flip" });
    new InfoPanel(host, state);
    const trick = getTrick("back-flip");
    const buttons = keypointButtons(host);
    const t1 = trick.keypoints[1].t * trick.duration;

    state.set("time", t1 + 0.05);
    expect(buttons[1].classList.contains("active")).toBe(true);
    expect(buttons[1].getAttribute("aria-current")).toBe("step");
    expect(buttons[0].hasAttribute("aria-current")).toBe(false);

    // Midway between two keypoints that are far apart: nothing is current.
    const gap = trick.keypoints
      .map((k, i) => (i > 0 ? k.t - trick.keypoints[i - 1].t : 0))
      .reduce((a, b) => Math.max(a, b), 0);
    expect(gap * trick.duration).toBeGreaterThan(0.3);
    const gapIdx = trick.keypoints.findIndex((k, i) => i > 0 && k.t - trick.keypoints[i - 1].t === gap);
    const mid = ((trick.keypoints[gapIdx - 1].t + trick.keypoints[gapIdx].t) / 2) * trick.duration;
    state.set("time", mid);
    expect(host.querySelector("[aria-current]")).toBeNull();
    expect(host.querySelector(".kp.active")).toBeNull();
  });

  it("re-renders when the trick changes and drops the old keypoints", () => {
    const host = mountHost("aside");
    const state = makeState({ trickId: "back-flip" });
    new InfoPanel(host, state);
    state.set("trickId", "cheat-kick");
    const trick = getTrick("cheat-kick");
    expect(getByRole(host, "heading", { level: 2 }).textContent).toBe(trick.nameJp);
    expect(getByText(host, "踏切").nextElementSibling!.textContent).toBe("左足");
    expect(getByText(host, "捻り軸").nextElementSibling!.textContent).toBe("Y 軸（縦・ひねり）");
    expect(keypointButtons(host)).toHaveLength(trick.keypoints.length);
    expect(getAllByRole(host, "heading", { level: 2 })).toHaveLength(1);
  });

  it("keeps the first keypoint current right after switching tricks while paused at 0", () => {
    const host = mountHost("aside");
    const state = makeState({ trickId: "back-flip", time: 0, playing: false });
    new InfoPanel(host, state);
    state.set("trickId", "cheat-kick");
    expect(keypointButtons(host)[0].getAttribute("aria-current")).toBe("step");
  });
});
