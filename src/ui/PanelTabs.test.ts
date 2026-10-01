// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, getAllByRole, getByRole } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { PanelTabs } from "./PanelTabs";
import { mountHost } from "../test/helpers";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup() {
  const app = mountHost("div", "app");
  const sidebar = document.createElement("aside");
  sidebar.id = "sidebar";
  const info = document.createElement("aside");
  info.id = "info";
  const host = document.createElement("div");
  app.append(sidebar, host, info);
  new PanelTabs(host, app);
  return { app, host, sidebar, info };
}

describe("PanelTabs", () => {
  it("renders an accessible tablist that starts on the trick list", () => {
    const { app, host, sidebar, info } = setup();
    expect(getByRole(document.body, "tablist", { name: "パネル" })).toBe(host);
    const tabs = getAllByRole(host, "tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["技一覧", "解説・キーポイント"]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    expect(app.dataset.panel).toBe("tricks");
    expect(sidebar.getAttribute("aria-labelledby")).toBe("tab-tricks");
    expect(info.getAttribute("aria-labelledby")).toBe("tab-info");
  });

  it("clicking a tab switches the visible panel", async () => {
    const { app, host } = setup();
    await userEvent.click(getByRole(host, "tab", { name: "解説・キーポイント" }));
    expect(app.dataset.panel).toBe("info");
    expect(getByRole(host, "tab", { name: "解説・キーポイント" }).getAttribute("aria-selected")).toBe("true");
    expect(getByRole(host, "tab", { name: "技一覧" }).getAttribute("aria-selected")).toBe("false");
    expect(getByRole(host, "tab", { name: "技一覧" }).tabIndex).toBe(-1);
  });

  it("arrow keys cycle between tabs, move focus, and never reach the frame-step shortcut", async () => {
    const { app, host } = setup();
    const seenByWindow = vi.fn();
    window.addEventListener("keydown", seenByWindow);
    const tricks = getByRole(host, "tab", { name: "技一覧" });
    const info = getByRole(host, "tab", { name: "解説・キーポイント" });

    tricks.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(app.dataset.panel).toBe("info");
    expect(document.activeElement).toBe(info);

    await userEvent.keyboard("{ArrowLeft}");
    expect(app.dataset.panel).toBe("tricks");
    expect(document.activeElement).toBe(tricks);
    expect(seenByWindow).not.toHaveBeenCalled();

    // Other keys are left alone and still bubble.
    await userEvent.keyboard("{ArrowDown}");
    expect(app.dataset.panel).toBe("tricks");
    expect(seenByWindow).toHaveBeenCalledTimes(1);
    window.removeEventListener("keydown", seenByWindow);
  });

  it("arrow keys on a tab cancel the browser default (no page scroll)", () => {
    const { host } = setup();
    const tricks = getByRole(host, "tab", { name: "技一覧" });
    expect(fireEvent.keyDown(tricks, { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(tricks, { key: "ArrowDown" })).toBe(true);
  });

  it("works without the panels it labels being in the document", () => {
    const app = mountHost("div");
    const host = mountHost("div");
    expect(() => new PanelTabs(host, app)).not.toThrow();
    expect(app.dataset.panel).toBe("tricks");
  });
});
