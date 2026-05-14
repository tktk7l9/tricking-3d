import type { AppState } from "../state/AppState";
import { TRICKS, type TrickCategory, type TrickMeta } from "../tricks/catalog";

const CATEGORY_LABEL: Record<TrickCategory, string> = {
  kick: "キック",
  flip: "フリップ",
  twist: "ツイスト",
  transition: "トランジション",
};

export class TrickPicker {
  constructor(host: HTMLElement, state: AppState) {
    host.classList.add("sidebar");
    const heading = el("h2", "Tricks");
    const search = el("input", "") as HTMLInputElement;
    search.type = "search";
    search.placeholder = "技を検索 (日/英)";
    search.className = "search";
    host.appendChild(heading);
    host.appendChild(search);

    const groups: Record<TrickCategory, HTMLDivElement> = {
      kick: el("div", ""),
      flip: el("div", ""),
      twist: el("div", ""),
      transition: el("div", ""),
    } as Record<TrickCategory, HTMLDivElement>;
    const buttons: HTMLButtonElement[] = [];

    for (const cat of Object.keys(groups) as TrickCategory[]) {
      const wrap = groups[cat];
      wrap.className = "group";
      wrap.appendChild(el("h3", CATEGORY_LABEL[cat]));
      host.appendChild(wrap);
    }

    for (const t of TRICKS) {
      const btn = document.createElement("button");
      btn.className = "trick-btn";
      btn.dataset.id = t.id;
      btn.dataset.search =
        `${t.nameJp} ${t.nameEn} ${t.id}`.toLowerCase();
      btn.innerHTML = `<div class="jp">${t.nameJp}</div><div class="en">${t.nameEn}</div>`;
      btn.addEventListener("click", () => state.set("trickId", t.id));
      groups[t.category].appendChild(btn);
      buttons.push(btn);
    }

    state.subscribe(
      "trickId",
      (id) => {
        for (const b of buttons) {
          b.classList.toggle("active", b.dataset.id === id);
        }
      },
      true,
    );

    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      for (const b of buttons) {
        const match = !q || (b.dataset.search ?? "").includes(q);
        b.style.display = match ? "" : "none";
      }
    });
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
}

// Keep TrickMeta exported for any consumer
export type { TrickMeta };
