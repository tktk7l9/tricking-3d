// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getByRole, queryByRole } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

// The real app needs WebGL; replace it with a spy that resolves or rejects per test.
const startApp = vi.fn<() => Promise<void>>();
vi.mock("./app-main", () => ({ startApp }));

function renderTitleScreen() {
  document.body.innerHTML = `
    <div id="app"><canvas id="canvas"></canvas></div>
    <div id="title-overlay">
      <h1>Tricking 3D Analyzer</h1>
      <button id="title-start" type="button">3Dで見る</button>
    </div>
  `;
}

async function loadEntry() {
  vi.resetModules();
  await import("./main");
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  startApp.mockReset();
  startApp.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

describe("start screen", () => {
  it("does not start the 3D app until the button is pressed", async () => {
    renderTitleScreen();
    await loadEntry();
    expect(startApp).not.toHaveBeenCalled();
    expect(document.getElementById("title-overlay")).not.toBeNull();
  });

  it("pressing the button shows loading feedback, removes the title and starts the app", async () => {
    renderTitleScreen();
    await loadEntry();
    const btn = getByRole(document.body, "button", { name: "3Dで見る" }) as HTMLButtonElement;

    await userEvent.click(btn);
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe("読み込み中…");

    await flush();
    expect(startApp).toHaveBeenCalledTimes(1);
    expect(document.getElementById("title-overlay")).toBeNull();
    expect(document.getElementById("app")).not.toBeNull();
  });

  it("only starts once even if the button is activated repeatedly", async () => {
    renderTitleScreen();
    await loadEntry();
    const btn = document.getElementById("title-start")!;
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();
    expect(startApp).toHaveBeenCalledTimes(1);
  });

  it("hovering preloads the module without starting the app", async () => {
    renderTitleScreen();
    await loadEntry();
    const btn = document.getElementById("title-start")!;
    btn.dispatchEvent(new Event("pointerenter"));
    btn.dispatchEvent(new Event("touchstart"));
    await flush();
    expect(startApp).not.toHaveBeenCalled();
    expect(document.getElementById("title-overlay")).not.toBeNull();
  });

  it("explains a failed start and offers a reload instead of a raw error dump", async () => {
    renderTitleScreen();
    startApp.mockRejectedValue(new Error("WebGL unavailable"));
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    await loadEntry();

    await userEvent.click(getByRole(document.body, "button", { name: "3Dで見る" }));
    await flush();

    const alert = getByRole(document.body, "alert");
    expect(getByRole(alert, "heading", { level: 1 }).textContent).toBe("3D 表示を開始できませんでした");
    expect(alert.textContent).toContain("WebGL");
    expect(alert.textContent).toContain("Chrome・Safari・Edge");
    expect(document.getElementById("app")).toBeNull();
    expect(alert.querySelector("pre")!.textContent).toContain("WebGL unavailable");
    expect(alert.querySelector("summary")!.textContent).toBe("詳しい情報");
    expect(console.error).toHaveBeenCalled();

    await userEvent.click(getByRole(alert, "button", { name: "再読み込み" }));
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("boots immediately when the page has no start button", async () => {
    document.body.innerHTML = `<div id="app"></div>`;
    await loadEntry();
    await flush();
    expect(startApp).toHaveBeenCalledTimes(1);
    expect(queryByRole(document.body, "alert")).toBeNull();
  });

  it("does not inject the analytics beacon outside production", async () => {
    renderTitleScreen();
    await loadEntry();
    expect(document.head.querySelector("script[data-cf-beacon]")).toBeNull();
  });

  it("injects the analytics beacon only in production builds", async () => {
    renderTitleScreen();
    vi.stubEnv("PROD", true);
    try {
      await loadEntry();
    } finally {
      vi.unstubAllEnvs();
    }
    const beacon = document.head.querySelector<HTMLScriptElement>("script[data-cf-beacon]");
    expect(beacon).not.toBeNull();
    expect(beacon!.src).toBe("https://static.cloudflareinsights.com/beacon.min.js");
    expect(beacon!.type).toBe("module");
    expect(startApp).not.toHaveBeenCalled();
  });
});
