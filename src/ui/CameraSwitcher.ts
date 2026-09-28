import type { AppState } from "../state/AppState";
import type { CameraMode } from "../scene/Cameras";

const CAMERA_BUTTONS: { mode: CameraMode; label: string; hint: string }[] = [
  { mode: "front", label: "正面", hint: "正面から見る" },
  { mode: "side", label: "側面", hint: "真横から見る" },
  { mode: "top", label: "真上", hint: "真上から見る" },
  { mode: "free", label: "自由", hint: "ドラッグで回転・ホイールやピンチで拡大縮小" },
];

export class CameraSwitcher {
  constructor(host: HTMLElement, state: AppState) {
    host.innerHTML = "";
    host.setAttribute("role", "group");
    host.setAttribute("aria-label", "視点");
    const buttons: HTMLButtonElement[] = [];
    for (const { mode, label, hint } of CAMERA_BUTTONS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hud-btn";
      b.textContent = label;
      b.title = hint;
      b.dataset.mode = mode;
      b.addEventListener("click", () => state.set("cameraMode", mode));
      host.appendChild(b);
      buttons.push(b);
    }
    state.subscribe(
      "cameraMode",
      (m) => {
        for (const b of buttons) {
          const active = b.dataset.mode === m;
          b.classList.toggle("active", active);
          b.setAttribute("aria-pressed", String(active));
        }
      },
      true,
    );
  }
}

const OVERLAY_BUTTONS: {
  key: "showAxis" | "showCom" | "showAnnotations";
  label: string;
  hint: string;
  swatch: string;
}[] = [
  { key: "showAxis", label: "軸表示", hint: "赤＝主回転軸、シアン＝捻り軸", swatch: "#ff5566" },
  { key: "showCom", label: "重心軌跡", hint: "腰の通り道を黄色い線で表示", swatch: "#ffd166" },
  { key: "showAnnotations", label: "注釈", hint: "キーポイント名を表示（押すとその瞬間へ移動）", swatch: "#88c0ff" },
];

export class OverlaySwitcher {
  constructor(host: HTMLElement, state: AppState) {
    host.innerHTML = "";
    host.setAttribute("role", "group");
    host.setAttribute("aria-label", "表示の切り替え");
    for (const { key, label, hint, swatch } of OVERLAY_BUTTONS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hud-btn";
      b.title = hint;
      b.innerHTML = `<span class="swatch" style="--swatch:${swatch}" aria-hidden="true"></span>${label}`;
      // Selected state is carried by aria-pressed and a filled/hollow swatch, not colour alone (SHIG 96).
      const sync = (v: boolean) => {
        b.classList.toggle("active", v);
        b.setAttribute("aria-pressed", String(v));
      };
      b.addEventListener("click", () => state.set(key, !state.get(key)));
      state.subscribe(key, sync, true);
      host.appendChild(b);
    }
  }
}
