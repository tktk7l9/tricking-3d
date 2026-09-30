// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeState, mountHost } from "../test/helpers";

// Catalog text is rendered through innerHTML, so markup in it must be shown as text.
vi.mock("../tricks/catalog", () => ({
  getTrick: () => ({
    id: "x",
    nameJp: "<img src=x onerror=alert(1)>",
    nameEn: 'A & "B"',
    category: "kick",
    takeoff: "both",
    primaryAxis: "x",
    duration: 1,
    description: "<script>bad()</script>",
    keypoints: [{ t: 0, label: "<b>start</b>" }],
  }),
}));

const { InfoPanel } = await import("./InfoPanel");

afterEach(() => {
  document.body.innerHTML = "";
});

describe("InfoPanel escaping", () => {
  it("renders catalog text literally instead of as markup", () => {
    const host = mountHost("aside");
    new InfoPanel(host, makeState({ trickId: "x" }));
    expect(host.querySelector("img, script, b")).toBeNull();
    expect(host.querySelector("h2")!.textContent).toBe("<img src=x onerror=alert(1)>");
    expect(host.querySelector(".meta")!.textContent).toBe('A & "B"');
    expect(host.querySelector(".desc")!.textContent).toBe("<script>bad()</script>");
    expect(host.querySelector("button.kp")!.textContent).toBe("0.00s<b>start</b>");
  });
});
