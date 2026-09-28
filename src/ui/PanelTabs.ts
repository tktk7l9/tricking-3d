export type PanelName = "tricks" | "info";

const TABS: { name: PanelName; label: string; controls: string }[] = [
  { name: "tricks", label: "技一覧", controls: "sidebar" },
  { name: "info", label: "解説・キーポイント", controls: "info" },
];

/**
 * Phone-width tab bar that shows either the trick list or the trick details
 * under the 3D view (hierarchical instead of three columns, SHIG 82).
 * Hidden by CSS on wide screens, where both panels are always visible.
 */
export class PanelTabs {
  constructor(host: HTMLElement, app: HTMLElement) {
    host.innerHTML = "";
    host.setAttribute("role", "tablist");
    host.setAttribute("aria-label", "パネル");
    const buttons: HTMLButtonElement[] = [];

    const select = (name: PanelName) => {
      app.dataset.panel = name;
      for (const b of buttons) {
        const active = b.dataset.panel === name;
        b.setAttribute("aria-selected", String(active));
        b.tabIndex = active ? 0 : -1;
      }
    };

    for (const { name, label, controls } of TABS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "panel-tab";
      b.id = `tab-${name}`;
      b.dataset.panel = name;
      b.textContent = label;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", controls);
      b.addEventListener("click", () => select(name));
      b.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        // Arrow keys move between tabs; keep them from reaching the frame-step shortcut.
        e.preventDefault();
        e.stopPropagation();
        const next = TABS[(TABS.findIndex((t) => t.name === name) + 1) % TABS.length].name;
        select(next);
        buttons.find((x) => x.dataset.panel === next)?.focus();
      });
      host.appendChild(b);
      buttons.push(b);
      document.getElementById(controls)?.setAttribute("aria-labelledby", b.id);
    }

    select("tricks");
  }
}
