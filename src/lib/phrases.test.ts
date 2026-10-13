import { describe, expect, it } from "vitest";
import { TRICKS } from "../tricks/catalog";
import { nameTokens, phraseHtml } from "./phrases";

describe("nameTokens", () => {
  it("splits a name into its words, numbers and brackets", () => {
    expect(nameTokens("セーラームーンラウンド")).toEqual(["セーラームーン", "ラウンド"]);
    expect(nameTokens("バックサイド900ハイパー")).toEqual(["バックサイド", "900", "ハイパー"]);
    expect(nameTokens("ロンダート（ラウンドオフ）")).toEqual(["ロンダート", "（", "ラウンドオフ", "）"]);
  });

  it("matches the longest word, so compounds such as バタフライキック stay whole", () => {
    expect(nameTokens("バタフライキックスイッチ")).toEqual(["バタフライキック", "スイッチ"]);
    expect(nameTokens("トルネードサイドキック")).toEqual(["トルネード", "サイドキック"]);
  });

  it("keeps text that is not a known word in one piece", () => {
    expect(nameTokens("ジャックナイフ")).toEqual(["ジャックナイフ"]);
    expect(nameTokens("ジャックナイフツイスト")).toEqual(["ジャックナイフ", "ツイスト"]);
    expect(nameTokens("")).toEqual([]);
  });
});

describe("phraseHtml", () => {
  it("lets a line break only between words and before an opening bracket", () => {
    expect(phraseHtml("セーラームーンラウンド")).toBe("セーラームーン<wbr>ラウンド");
    expect(phraseHtml("ロンダート（ラウンドオフ）")).toBe("ロンダート<wbr>（ラウンドオフ）");
    expect(phraseHtml("ポップキック（ポップ360）")).toBe("ポップ<wbr>キック<wbr>（ポップ<wbr>360）");
    expect(phraseHtml("スクート")).toBe("スクート");
  });

  it("escapes HTML", () => {
    expect(phraseHtml('<b class="x">&</b>')).toBe("&lt;b class=&quot;x&quot;&gt;&amp;&lt;/b&gt;");
  });

  // The HUD title on a 360 px wide phone is 140 px wide at 15 px: 9 full-width
  // characters a line. No piece between break points may be longer.
  it.each(TRICKS.map((t) => [t.nameJp] as const))("%s keeps its text and breaks into pieces of 9 characters or fewer", (name) => {
    expect(nameTokens(name).join("")).toBe(name);
    for (const piece of phraseHtml(name).split("<wbr>")) {
      expect(piece.length, piece).toBeLessThanOrEqual(9);
    }
  });
});
