// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeState, mountHost } from "../test/helpers";

// Catalog text is rendered through innerHTML, so markup in it must be shown as text.
// The progression links show a neighbouring trick's names the same way.
vi.mock("../tricks/catalog", () => {
  const base = { category: "kick", takeoff: "both", primaryAxis: "x", duration: 1, keypoints: [{ t: 0, label: "<b>start</b>" }] };
  const x = { ...base, id: "x", nameJp: "<img src=x onerror=alert(1)>", nameEn: 'A & "B"', description: "<script>bad()</script>" };
  const y = { ...base, id: "y", nameJp: "<i>next</i>", nameEn: "<u>Next</u>", description: "-", prerequisites: ["x"] };
  return { TRICKS: [x, y], getTrick: (id: string) => (id === "y" ? y : x) };
});

const { InfoPanel } = await import("./InfoPanel");

afterEach(() => {
  document.body.innerHTML = "";
});

describe("InfoPanel escaping", () => {
  it("renders catalog text literally instead of as markup", () => {
    const host = mountHost("aside");
    new InfoPanel(host, makeState({ trickId: "x" }));
    expect(host.querySelector("img, script, b, i, u")).toBeNull();
    expect(host.querySelector("h2")!.textContent).toBe("<img src=x onerror=alert(1)>");
    expect(host.querySelector(".meta")!.textContent).toBe('A & "B"');
    expect(host.querySelector(".desc")!.textContent).toBe("<script>bad()</script>");
    expect(host.querySelector("button.kp")!.textContent).toBe("0.00s<b>start</b>");
    expect(host.querySelector("a.prog-link")!.textContent).toBe("<i>next</i> <u>Next</u>");
  });
});
