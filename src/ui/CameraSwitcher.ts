import type { AppState } from "../state/AppState";
import type { CameraMode } from "../scene/Cameras";

const CAMERA_BUTTONS: { mode: CameraMode; label: string }[] = [
  { mode: "front", label: "正面" },
  { mode: "side", label: "側面" },
  { mode: "top", label: "真上" },
  { mode: "free", label: "自由" },
];

export class CameraSwitcher {
  constructor(host: HTMLElement, state: AppState) {
    host.innerHTML = "";
    const buttons: HTMLButtonElement[] = [];
    for (const { mode, label } of CAMERA_BUTTONS) {
      const b = document.createElement("button");
      b.className = "hud-btn";
      b.textContent = label;
      b.dataset.mode = mode;
      b.addEventListener("click", () => state.set("cameraMode", mode));
      host.appendChild(b);
      buttons.push(b);
    }
    state.subscribe(
      "cameraMode",
      (m) => {
        for (const b of buttons) b.classList.toggle("active", b.dataset.mode === m);
      },
      true,
    );
  }
}

const OVERLAY_BUTTONS: {
  key: "showAxis" | "showCom" | "showAnnotations";
  label: string;
  swatch: string;
}[] = [
  { key: "showAxis", label: "軸表示", swatch: "#ff5566" },
  { key: "showCom", label: "重心軌跡", swatch: "#ffd166" },
  { key: "showAnnotations", label: "注釈", swatch: "#88c0ff" },
];

export class OverlaySwitcher {
  constructor(host: HTMLElement, state: AppState) {
    host.innerHTML = "";
    for (const { key, label, swatch } of OVERLAY_BUTTONS) {
      const b = document.createElement("button");
      b.className = "hud-btn";
      b.innerHTML = `<span class="swatch" style="background:${swatch}"></span>${label}`;
      const sync = (v: boolean) => b.classList.toggle("active", v);
      b.addEventListener("click", () => state.set(key, !state.get(key)));
      state.subscribe(key, sync, true);
      host.appendChild(b);
    }
  }
}
