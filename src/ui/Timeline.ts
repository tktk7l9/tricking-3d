import type { AppState } from "../state/AppState";

const SPEEDS = [0.1, 0.25, 0.5, 1, 1.5, 2];

export class Timeline {
  private state: AppState;
  private playBtn!: HTMLButtonElement;
  private slider!: HTMLInputElement;
  private timeLabel!: HTMLSpanElement;

  constructor(host: HTMLElement, state: AppState) {
    this.state = state;
    host.innerHTML = "";

    this.playBtn = button("▶", "tl-button primary");
    const stepBack = button("◀", "tl-button");
    const stepFwd = button("▶|", "tl-button");

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
    this.playBtn.addEventListener("click", () =>
      state.set("playing", !state.get("playing")),
    );
    stepBack.addEventListener("click", () => {
      state.set("playing", false);
      const d = state.get("duration");
      let t = state.get("time") - 1 / 30;
      if (t < 0) t += d;
      state.set("time", t);
    });
    stepFwd.addEventListener("click", () => {
      state.set("playing", false);
      const d = state.get("duration");
      let t = state.get("time") + 1 / 30;
      if (t >= d) t -= d;
      state.set("time", t);
    });
    this.slider.addEventListener("input", () => {
      state.set("playing", false);
      const u = parseFloat(this.slider.value);
      const d = state.get("duration");
      state.set("time", u * d);
    });
    speed.addEventListener("change", () => {
      state.set("speed", parseFloat(speed.value));
    });

    state.subscribe(
      "playing",
      (p) => {
        this.playBtn.textContent = p ? "⏸" : "▶";
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
  }
}

function button(text: string, cls: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = cls;
  b.textContent = text;
  return b;
}
