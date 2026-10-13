/* Line breaks inside Japanese trick names.
 *
 * Japanese text may wrap between any two kana, so on a narrow screen a name
 * such as セーラームーンラウンド splits mid-word (セーラームーンラ / ウンド).
 * The names are compounds of a few tricking words, so the elements that show
 * them keep every word whole (CSS `word-break: keep-all`) and this marks the
 * only places a line may break: between two words, and before an opening
 * bracket. Text that is not a known word stays in one piece.
 */

/** Words the trick names are built from, longest first so compounds match whole. */
const WORDS = [
  "カートウィール",
  "コークスクリュー",
  "バタフライキック",
  "セーラームーン",
  "エックスアウト",
  "サイドフリップ",
  "サイドスワイプ",
  "サイドキック",
  "タッチダウン",
  "ダブルレッグ",
  "バックサイド",
  "ラウンドオフ",
  "ウェブスター",
  "エアリアル",
  "トルネード",
  "スパイダー",
  "ロンダート",
  "フラッシュ",
  "バタフライ",
  "アラビアン",
  "ジャニター",
  "ゲイナー",
  "マスター",
  "スイング",
  "スイッチ",
  "ツイスト",
  "ハイパー",
  "スワイプ",
  "フロント",
  "フリップ",
  "ラウンド",
  "スクート",
  "ルーザー",
  "ロータス",
  "ガンビー",
  "バック",
  "パイク",
  "ライズ",
  "ラップ",
  "タック",
  "チート",
  "キック",
  "ポップ",
  "ハーフ",
  "バク宙",
  "フル",
  "片手",
  "側転",
  "前宙",
].sort((a, b) => b.length - a.length);

const OPEN = "（";
const CLOSE = "）";

/** Split a name into known words, numbers, brackets and runs of other text. */
export function nameTokens(name: string): string[] {
  const out: string[] = [];
  let other = "";
  const flush = () => {
    if (other) out.push(other);
    other = "";
  };
  let i = 0;
  while (i < name.length) {
    const piece =
      name[i] === OPEN || name[i] === CLOSE
        ? name[i]
        : (/^[0-9]+/.exec(name.slice(i))?.[0] ?? WORDS.find((w) => name.startsWith(w, i)));
    if (piece) {
      flush();
      out.push(piece);
      i += piece.length;
    } else {
      other += name[i];
      i += 1;
    }
  }
  flush();
  return out;
}

/** The name as HTML, with <wbr> wherever a line may break. */
export function phraseHtml(name: string): string {
  const tokens = nameTokens(name);
  return tokens
    .map((token, i) => {
      const breakBefore = i > 0 && token !== CLOSE && tokens[i - 1] !== OPEN;
      return (breakBefore ? "<wbr>" : "") + escapeHtml(token);
    })
    .join("");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
