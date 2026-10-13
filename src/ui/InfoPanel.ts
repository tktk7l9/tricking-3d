import type { AppState } from "../state/AppState";
import { getTrick, type TrickMeta } from "../tricks/catalog";
import { clampSeekTime } from "../lib/seek";
import { axisLabel, categoryLabel, takeoffLabel } from "../lib/labels";
import { phraseHtml } from "../lib/phrases";
import { hashForTrick } from "../lib/hash";
import { prerequisitesOf, unlocksOf } from "../lib/progression";

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
    // Re-rendering removes whatever had focus in the panel (a link just
    // followed, or the name when the browser goes back); the new trick's name
    // takes it instead of the page losing it.
    const hadFocus = this.host.contains(document.activeElement);
    this.host.innerHTML = `
      <h2 tabindex="-1">${phraseHtml(t.nameJp)}</h2>
      <div class="meta">${escapeHtml(t.nameEn)}</div>
      <dl class="meta-grid">
        <dt>カテゴリ</dt><dd>${categoryLabel(t.category)}</dd>
        <dt>踏切</dt><dd>${takeoffLabel(t.takeoff)}</dd>
        <dt>着地</dt><dd>${takeoffLabel(t.landing)}</dd>
        <dt>主回転軸</dt><dd>${axisLabel(t.primaryAxis)}</dd>
        <dt>捻り軸</dt><dd>${axisLabel(t.twistAxis)}</dd>
        <dt>所要時間</dt><dd>${t.duration.toFixed(2)} s</dd>
      </dl>
      <p class="hint">左回り（反時計回り）に回る人を基準にしています。右回りの人は左右を読み替えてください。</p>
      <p class="desc">${escapeHtml(t.description)}</p>
      <div class="keypoints">
        <h3>キーポイント <span class="hint">（押すとその瞬間で止まります）</span></h3>
        <div class="kp-list"></div>
      </div>
      ${progressionHtml(t)}
    `;
    if (hadFocus) this.host.querySelector("h2")!.focus();

    const list = this.host.querySelector(".kp-list") as HTMLDivElement;
    this.kpRoot = list;
    this.kpButtons = [];
    this.kpTimes = [];
    for (const kp of t.keypoints) {
      const at = clampSeekTime(kp.t * t.duration, t.duration);
      const btn = document.createElement("button");
      btn.type = "button";
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
    // A trick switch does not always move the playhead (e.g. paused at 0), so
    // mark the current keypoint now instead of waiting for the next time change.
    this.highlightKeypoint(this.state.get("time"));
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
      const active = i === bestIdx;
      this.kpButtons[i].classList.toggle("active", active);
      if (active) this.kpButtons[i].setAttribute("aria-current", "step");
      else this.kpButtons[i].removeAttribute("aria-current");
    }
  }
}

/** Where the trick sits in the progression: the tricks to learn first and the
 * tricks it leads to, each a link that opens that trick (SHIG 59). */
function progressionHtml(t: TrickMeta): string {
  return `
    <section class="progression" aria-labelledby="progression-title">
      <h3 id="progression-title">技のつながり <span class="hint">（押すとその技に切り替わります）</span></h3>
      <h4>先に覚える技</h4>
      ${trickLinks(prerequisitesOf(t.id))}
      <h4>次に挑戦できる技</h4>
      ${trickLinks(unlocksOf(t.id))}
    </section>
  `;
}

function trickLinks(tricks: TrickMeta[]): string {
  if (tricks.length === 0) return `<p class="prog-none">収録している技の中にはありません</p>`;
  const items = tricks.map(
    (x) =>
      `<li><a class="prog-link" href="${hashForTrick(x.id)}"><span class="jp">${phraseHtml(
        x.nameJp,
      )}</span> <span class="en" lang="en">${escapeHtml(x.nameEn)}</span></a></li>`,
  );
  return `<ul class="prog-list">${items.join("")}</ul>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
