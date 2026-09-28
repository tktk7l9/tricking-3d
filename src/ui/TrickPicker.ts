import type { AppState } from "../state/AppState";
import { TRICKS, type TrickCategory, type TrickMeta } from "../tricks/catalog";
import { CATEGORY_LABEL } from "../lib/labels";
import { matchesQuery, normalizeSearch } from "../lib/search";

export class TrickPicker {
  constructor(host: HTMLElement, state: AppState) {
    host.classList.add("sidebar");
    const heading = el("h2", "技一覧");
    heading.id = "tricks-heading";
    const search = el("input", "") as HTMLInputElement;
    search.type = "search";
    search.placeholder = "技を検索（ひらがな・英語も可）";
    search.setAttribute("aria-label", "技を検索");
    search.className = "search";
    host.appendChild(heading);
    host.appendChild(search);

    const empty = el("p", "該当する技がありません。別の言葉で探すか、検索欄を空にしてください。");
    empty.className = "empty";
    empty.setAttribute("role", "status");
    empty.hidden = true;
    host.appendChild(empty);

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
      btn.type = "button";
      btn.className = "trick-btn";
      btn.dataset.id = t.id;
      btn.dataset.search = normalizeSearch(`${t.nameJp} ${t.nameEn} ${t.id}`);
      btn.innerHTML = `<div class="jp">${t.nameJp}</div><div class="en">${t.nameEn}</div>`;
      btn.addEventListener("click", () => state.set("trickId", t.id));
      groups[t.category].appendChild(btn);
      buttons.push(btn);
    }

    state.subscribe(
      "trickId",
      (id) => {
        for (const b of buttons) {
          const active = b.dataset.id === id;
          b.classList.toggle("active", active);
          b.setAttribute("aria-pressed", String(active));
        }
      },
      true,
    );

    search.addEventListener("input", () => {
      let visible = 0;
      for (const b of buttons) {
        const match = matchesQuery(b.dataset.search ?? "", search.value);
        b.hidden = !match;
        if (match) visible++;
      }
      // Hide category headings whose tricks are all filtered out.
      for (const wrap of Object.values(groups)) {
        wrap.hidden = !wrap.querySelector(".trick-btn:not([hidden])");
      }
      empty.hidden = visible > 0;
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
