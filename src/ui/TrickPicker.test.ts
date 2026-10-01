// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { getByRole, getAllByRole, queryByRole, getByLabelText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { TrickPicker } from "./TrickPicker";
import { TRICKS } from "../tricks/catalog";
import { makeState, mountHost } from "../test/helpers";

afterEach(() => {
  document.body.innerHTML = "";
});

function visibleTrickButtons(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>(".trick-btn")).filter((b) => !b.hidden);
}

describe("TrickPicker", () => {
  it("renders one button per trick under the four category headings", () => {
    const host = mountHost("aside");
    new TrickPicker(host, makeState());

    expect(getByRole(host, "heading", { level: 2 }).textContent).toBe("技一覧");
    const h3 = getAllByRole(host, "heading", { level: 3 }).map((h) => h.textContent);
    expect(h3).toEqual(["キック", "フリップ", "ツイスト", "トランジション"]);
    expect(host.querySelectorAll(".trick-btn")).toHaveLength(TRICKS.length);
    expect(getByRole(host, "button", { name: /バク宙|Back Flip/ })).toBeTruthy();
  });

  it("marks the current trick as pressed and follows state changes", async () => {
    const host = mountHost("aside");
    const state = makeState();
    new TrickPicker(host, state);

    const backFlip = host.querySelector<HTMLButtonElement>('[data-id="back-flip"]')!;
    const sideFlip = host.querySelector<HTMLButtonElement>('[data-id="side-flip"]')!;
    expect(backFlip.getAttribute("aria-pressed")).toBe("true");
    expect(sideFlip.getAttribute("aria-pressed")).toBe("false");

    await userEvent.click(sideFlip);
    expect(state.get("trickId")).toBe("side-flip");
    expect(sideFlip.getAttribute("aria-pressed")).toBe("true");
    expect(sideFlip.classList.contains("active")).toBe(true);
    expect(backFlip.getAttribute("aria-pressed")).toBe("false");

    state.set("trickId", "gainer");
    expect(host.querySelector('[data-id="gainer"]')!.getAttribute("aria-pressed")).toBe("true");
    expect(sideFlip.getAttribute("aria-pressed")).toBe("false");
  });

  it("filters tricks leniently and hides categories that become empty", async () => {
    const host = mountHost("aside");
    new TrickPicker(host, makeState());
    const search = getByLabelText(host, "技を検索") as HTMLInputElement;

    await userEvent.type(search, "こーく");
    const shown = visibleTrickButtons(host);
    expect(shown.map((b) => b.dataset.id)).toEqual(["corkscrew"]);
    const groups = Array.from(host.querySelectorAll<HTMLElement>(".group"));
    const visibleHeadings = groups.filter((g) => !g.hidden).map((g) => g.querySelector("h3")!.textContent);
    expect(visibleHeadings).toEqual(["ツイスト"]);
    expect(queryByRole(host, "status")).toBeNull();
  });

  it("explains when nothing matches, then restores everything when the query is cleared", async () => {
    const host = mountHost("aside");
    new TrickPicker(host, makeState());
    const search = getByLabelText(host, "技を検索") as HTMLInputElement;

    await userEvent.type(search, "zzz");
    expect(visibleTrickButtons(host)).toHaveLength(0);
    const status = getByRole(host, "status");
    expect(status.textContent).toContain("該当する技がありません");

    await userEvent.clear(search);
    expect(visibleTrickButtons(host)).toHaveLength(TRICKS.length);
    expect(queryByRole(host, "status")).toBeNull();
    expect(host.querySelectorAll<HTMLElement>(".group[hidden]")).toHaveLength(0);
  });

  it("matches English names ignoring case and spaces", async () => {
    const host = mountHost("aside");
    new TrickPicker(host, makeState());
    const search = getByLabelText(host, "技を検索") as HTMLInputElement;
    await userEvent.type(search, "Front Flip");
    expect(visibleTrickButtons(host).map((b) => b.dataset.id)).toEqual(["front-flip"]);
  });
});
