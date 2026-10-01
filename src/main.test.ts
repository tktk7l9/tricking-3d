// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getByRole, queryByRole } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

// The real app needs WebGL; replace it with a spy that resolves or rejects per test.
const startApp = vi.fn<() => Promise<void>>();
vi.mock("./app-main", () => ({ startApp }));

function renderTitleScreen() {
  document.body.innerHTML = `
    <div id="app" hidden><main id="viewport"><canvas id="canvas"></canvas><div id="hud-top"></div></main></div>
    <main id="title-overlay" aria-labelledby="title-heading">
      <h1 id="title-heading">Tricking 3D Analyzer</h1>
      <button id="title-start" type="button">3Dで見る</button>
    </main>
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
    // The title screen is the only landmark until the viewer starts.
    expect(getByRole(document.body, "main", { name: "Tricking 3D Analyzer" })).not.toBeNull();
    expect(document.getElementById("app")!.hidden).toBe(true);
  });

  it("pressing the button shows loading feedback, removes the title and starts the app", async () => {
    renderTitleScreen();
    // Mimic the HUD title that startApp builds, so the focus hand-off can be observed.
    startApp.mockImplementation(async () => {
      const title = document.createElement("h1");
      title.className = "title-block";
      title.tabIndex = -1;
      title.textContent = "バックフリップ";
      document.getElementById("hud-top")!.appendChild(title);
    });
    await loadEntry();
    const btn = getByRole(document.body, "button", { name: "3Dで見る" }) as HTMLButtonElement;

    await userEvent.click(btn);
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe("読み込み中…");

    await flush();
    expect(startApp).toHaveBeenCalledTimes(1);
    expect(document.getElementById("title-overlay")).toBeNull();
    expect(document.getElementById("app")).not.toBeNull();
    expect(document.getElementById("app")!.hidden).toBe(false);
    // Focus lands on the trick title instead of being dropped on <body>.
    const heading = getByRole(document.body, "heading", { level: 1, name: "バックフリップ" });
    expect(document.activeElement).toBe(heading);
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
    // A fresh factory counts how often the heavy module is actually evaluated.
    let loads = 0;
    vi.doMock("./app-main", () => {
      loads++;
      return { startApp };
    });
    renderTitleScreen();
    await loadEntry();
    await flush();
    expect(loads).toBe(0);
    const btn = document.getElementById("title-start")!;
    btn.dispatchEvent(new Event("pointerenter"));
    await flush();
    expect(loads).toBe(1);
    btn.dispatchEvent(new Event("touchstart"));
    await flush();
    // The second trigger reuses the in-flight import instead of loading again.
    expect(loads).toBe(1);
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

    // The error screen carries the page's only main landmark; the alert is an
    // inner wrapper so it does not override the landmark role.
    const screen = getByRole(document.body, "main");
    const alert = getByRole(screen, "alert");
    expect(getByRole(alert, "heading", { level: 1 }).textContent).toBe("3D 表示を開始できませんでした");
    expect(alert.textContent).toContain("WebGL");
    expect(alert.textContent).toContain("Chrome・Safari・Edge");
    expect(document.getElementById("app")).toBeNull();
    expect(screen.querySelector("pre")!.textContent).toContain("WebGL unavailable");
    expect(screen.querySelector("summary")!.textContent).toBe("詳しい情報");
    expect(console.error).toHaveBeenCalled();

    const retry = getByRole(screen, "button", { name: "再読み込み" });
    // Focus moves to the next step instead of the removed start button.
    expect(document.activeElement).toBe(retry);
    await userEvent.click(retry);
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

  it("still starts when the page has no app container to unhide", async () => {
    document.body.innerHTML = "";
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
