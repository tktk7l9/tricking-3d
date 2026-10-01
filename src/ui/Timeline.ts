import type { AppState } from "../state/AppState";
import { stepTime } from "../lib/seek";
import { shortcutFor } from "../lib/shortcuts";

const SPEEDS = [0.1, 0.25, 0.5, 1, 1.5, 2];

export class Timeline {
  private state: AppState;
  private playBtn!: HTMLButtonElement;
  private slider!: HTMLInputElement;
  private timeLabel!: HTMLSpanElement;

  constructor(host: HTMLElement, state: AppState) {
    this.state = state;
    host.innerHTML = "";

    this.playBtn = button("▶", "tl-button primary", "再生（Space）");
    const stepBack = button("|◀", "tl-button", "1コマ戻る（←）");
    const stepFwd = button("▶|", "tl-button", "1コマ進む（→）");

    const scrub = document.createElement("div");
    scrub.className = "tl-scrubber";
    this.slider = document.createElement("input");
    this.slider.type = "range";
    this.slider.min = "0";
    this.slider.max = "1";
    this.slider.step = "0.001";
    this.slider.value = "0";
    this.slider.setAttribute("aria-label", "再生位置");
    scrub.appendChild(this.slider);

    this.timeLabel = document.createElement("span");
    this.timeLabel.className = "tl-time";
    this.timeLabel.textContent = "0.00 / 0.00 s";

    const speed = document.createElement("select");
    speed.className = "tl-speed";
    speed.setAttribute("aria-label", "再生速度");
    for (const s of SPEEDS) {
      const opt = document.createElement("option");
      opt.value = String(s);
      opt.textContent = `${s.toString().replace(/\.0+$/, "")}×`;
      if (s === 1) opt.selected = true;
      speed.appendChild(opt);
    }

    host.append(this.playBtn, stepBack, stepFwd, scrub, this.timeLabel, speed);

    // Wiring
    const togglePlay = () => state.set("playing", !state.get("playing"));
    const step = (dir: 1 | -1) => {
      state.set("playing", false);
      state.set("time", stepTime(state.get("time"), state.get("duration"), dir));
    };
    this.playBtn.addEventListener("click", togglePlay);
    stepBack.addEventListener("click", () => step(-1));
    stepFwd.addEventListener("click", () => step(1));
    this.slider.addEventListener("input", () => {
      state.set("playing", false);
      const u = parseFloat(this.slider.value);
      const d = state.get("duration");
      state.set("time", u * d);
    });
    speed.addEventListener("change", () => {
      state.set("speed", parseFloat(speed.value));
    });

    // Keyboard shortcuts for the most frequent analysis actions (SHIG 22).
    window.addEventListener("keydown", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : document.body;
      const action = shortcutFor({
        key: e.key,
        targetTag: target.tagName,
        targetType: target instanceof HTMLInputElement ? target.type : undefined,
        isContentEditable: target.isContentEditable,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
      });
      if (!action) return;
      e.preventDefault();
      if (action === "toggle-play") togglePlay();
      else step(action === "step-back" ? -1 : 1);
    });

    state.subscribe(
      "playing",
      (p) => {
        this.playBtn.textContent = p ? "⏸" : "▶";
        const label = p ? "一時停止（Space）" : "再生（Space）";
        this.playBtn.setAttribute("aria-label", label);
        this.playBtn.title = label;
      },
      true,
    );
    state.subscribe("time", () => this.refreshLabel());
    state.subscribe("duration", () => this.refreshLabel(), true);
  }

  /** Pull the latest time without firing the input event. */
  syncFromTime(t: number) {
    const d = this.state.get("duration");
    if (d <= 0) return;
    const u = t / d;
    if (Math.abs(parseFloat(this.slider.value) - u) > 1e-3) {
      this.slider.value = u.toString();
    }
    this.refreshLabel();
  }

  private refreshLabel() {
    const t = this.state.get("time");
    const d = this.state.get("duration");
    this.timeLabel.textContent = `${t.toFixed(2)} / ${d.toFixed(2)} s`;
    // The range runs 0..1; announce seconds instead of the raw fraction.
    this.slider.setAttribute("aria-valuetext", `${t.toFixed(2)}秒 / ${d.toFixed(2)}秒`);
  }
}

function button(text: string, cls: string, label: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.textContent = text;
  b.setAttribute("aria-label", label);
  b.title = label;
  return b;
}
