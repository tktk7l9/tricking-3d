import type { AppState } from "../state/AppState";
import { getTrick, type TrickMeta } from "../tricks/catalog";

export class InfoPanel {
  private host: HTMLElement;
  private state: AppState;
  private kpRoot: HTMLDivElement | null = null;
  private kpButtons: HTMLButtonElement[] = [];
  private kpTimes: number[] = [];

  constructor(host: HTMLElement, state: AppState) {
    this.host = host;
    this.state = state;
    host.classList.add("info-panel");

    state.subscribe("trickId", (id) => this.render(getTrick(id)), true);
    state.subscribe("time", (t) => this.highlightKeypoint(t));
  }

  private render(t: TrickMeta) {
    const axisLabel = (a?: string) =>
      a ? a.toUpperCase() + " 軸" : "—";
    const takeoff =
      t.takeoff === "both"
        ? "両足"
        : t.takeoff === "left"
          ? "左足"
          : "右足";
    const cat =
      t.category === "kick"
        ? "キック"
        : t.category === "flip"
          ? "フリップ"
          : t.category === "twist"
            ? "ツイスト"
            : "トランジション";

    this.host.innerHTML = `
      <h2>${escapeHtml(t.nameJp)}</h2>
      <div class="meta">${escapeHtml(t.nameEn)}</div>
      <dl class="meta-grid">
        <dt>カテゴリ</dt><dd>${cat}</dd>
        <dt>踏切</dt><dd>${takeoff}</dd>
        <dt>主回転軸</dt><dd>${axisLabel(t.primaryAxis)}</dd>
        <dt>捻り軸</dt><dd>${axisLabel(t.twistAxis)}</dd>
        <dt>所要時間</dt><dd>${t.duration.toFixed(2)} s</dd>
      </dl>
      <p class="desc">${escapeHtml(t.description)}</p>
      <div class="keypoints">
        <h3>キーポイント</h3>
        <div class="kp-list"></div>
      </div>
    `;

    const list = this.host.querySelector(".kp-list") as HTMLDivElement;
    this.kpRoot = list;
    this.kpButtons = [];
    this.kpTimes = [];
    for (const kp of t.keypoints) {
      const at = kp.t * t.duration;
      const btn = document.createElement("button");
      btn.className = "kp";
      btn.innerHTML = `<span class="t">${at.toFixed(2)}s</span><span>${escapeHtml(
        kp.label,
      )}</span>`;
      btn.addEventListener("click", () => {
        this.state.set("playing", false);
        this.state.set("time", at);
      });
      list.appendChild(btn);
      this.kpButtons.push(btn);
      this.kpTimes.push(at);
    }
  }

  private highlightKeypoint(now: number) {
    if (!this.kpRoot) return;
    let bestIdx = -1;
    let bestDt = 0.15;
    for (let i = 0; i < this.kpTimes.length; i++) {
      const dt = Math.abs(this.kpTimes[i] - now);
      if (dt < bestDt) {
        bestDt = dt;
        bestIdx = i;
      }
    }
    for (let i = 0; i < this.kpButtons.length; i++) {
      this.kpButtons[i].classList.toggle("active", i === bestIdx);
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
