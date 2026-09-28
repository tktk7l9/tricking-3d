import type { Axis, TrickCategory, TrickMeta } from "../tricks/catalog";

// Axis convention (see catalog.ts): x = lateral, y = vertical, z = forward.
const AXIS_LABEL: Record<Axis, string> = {
  x: "X 軸（左右・宙返り）",
  y: "Y 軸（縦・ひねり）",
  z: "Z 軸（前後・側転）",
};

export function axisLabel(a: Axis | undefined): string {
  return a ? AXIS_LABEL[a] : "なし";
}

const TAKEOFF_LABEL: Record<TrickMeta["takeoff"], string> = {
  both: "両足",
  left: "左足",
  right: "右足",
};

export function takeoffLabel(t: TrickMeta["takeoff"]): string {
  return TAKEOFF_LABEL[t];
}

export const CATEGORY_LABEL: Record<TrickCategory, string> = {
  kick: "キック",
  flip: "フリップ",
  twist: "ツイスト",
  transition: "トランジション",
};

export function categoryLabel(c: TrickCategory): string {
  return CATEGORY_LABEL[c];
}
