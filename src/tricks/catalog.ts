export type TrickCategory = "kick" | "flip" | "twist" | "transition";
export type Axis = "x" | "y" | "z";

export type Keypoint = {
  /** normalized time 0..1 */
  t: number;
  label: string;
};

export type TrickMeta = {
  id: string;
  nameJp: string;
  nameEn: string;
  category: TrickCategory;
  /** primary rotation axis in world space (relative to character facing +Z) */
  primaryAxis: Axis;
  /** twist axis (the body's long axis when twisting), if applicable */
  twistAxis?: Axis;
  takeoff: "both" | "left" | "right";
  description: string;
  keypoints: Keypoint[];
  /** total clip duration in seconds */
  duration: number;
};

/* Conventions:
 *   x = lateral (side-to-side, side flip rotates around this)
 *   y = vertical (twist / cheat-style turns rotate around this)
 *   z = forward/back (front-flip / back-flip rotate around this — body axis through nose-back)
 *   In our character coordinate frame, +Z is the character's forward.
 *   So a back-flip rotates around X (pitch). A side-flip rotates around Z (roll). A cheat 360 rotates around Y (yaw).
 */

export const TRICKS: TrickMeta[] = [
  {
    id: "cheat-kick",
    nameJp: "チートキック",
    nameEn: "Cheat Kick",
    category: "kick",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "left",
    description:
      "直立した状態から軸を垂直に保ったまま、身体を先行してひねりながらジャンプに入って行うキック。前足のチート（ステップ）で身体を回し、後ろ足で蹴り抜く。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.2, label: "チート（前足ステップ）" },
      { t: 0.45, label: "踏切・身体先行ひねり" },
      { t: 0.7, label: "蹴り脚インパクト" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.6,
  },
  {
    id: "double-leg",
    nameJp: "ダブルレッグ",
    nameEn: "Double Leg",
    category: "kick",
    primaryAxis: "y",
    takeoff: "both",
    description:
      "両足で踏切り、空中で両膝を畳んで前方へ突き出す“両足蹴り”。タック気味のフォームで前進力を活かす。",
    keypoints: [
      { t: 0.0, label: "助走/構え" },
      { t: 0.3, label: "両足踏切" },
      { t: 0.6, label: "両膝突出（インパクト）" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.4,
  },
  {
    id: "pop-kick",
    nameJp: "ポップキック",
    nameEn: "Pop Kick (Pop 360)",
    category: "kick",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "both",
    description:
      "正面を向いた状態からスタートし、両足が地面から離れて、空中でひねりを伴って行うキック。チートのような前足ステップを使わない。",
    keypoints: [
      { t: 0.0, label: "正面構え" },
      { t: 0.3, label: "両足ポップ（垂直跳）" },
      { t: 0.55, label: "空中でひねり" },
      { t: 0.75, label: "蹴り脚インパクト" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.5,
  },
  {
    id: "spider",
    nameJp: "スパイダー",
    nameEn: "Spider Kick",
    category: "kick",
    primaryAxis: "z",
    takeoff: "both",
    description:
      "空中で身体を横向きに倒し、両手を地面に向けながら脚を頭上に振り上げて蹴る、サイドフリップ系のキック。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.3, label: "両足踏切・横倒し開始" },
      { t: 0.55, label: "脚振り上げ・キック" },
      { t: 0.8, label: "脚下ろし" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.6,
  },
  {
    id: "swing-kick",
    nameJp: "スイングキック",
    nameEn: "Swing Kick",
    category: "kick",
    primaryAxis: "y",
    takeoff: "right",
    description:
      "片足（多くは右足）をもう片方の足の前に蹴り抜く勢いを利用して繰り出すキック。足を振り抜いた反動で身体を回す。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.25, label: "右足スイング開始" },
      { t: 0.55, label: "踏切・空中インパクト" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.4,
  },
  {
    id: "lotus",
    nameJp: "ロータス",
    nameEn: "Lotus Kick",
    category: "kick",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "right",
    description:
      "前方に大きく一歩踏み込み、後ろ足を内側から外側へ円を描くように蹴り上げる回し蹴り。身体は垂直軸まわりに回転する。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.3, label: "踏み込み" },
      { t: 0.55, label: "蹴り脚アーク開始" },
      { t: 0.75, label: "蹴り抜き（最高点）" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "back-flip",
    nameJp: "バク宙",
    nameEn: "Backflip",
    category: "flip",
    primaryAxis: "x",
    takeoff: "both",
    description:
      "軸の有無に限らず、両足から地面を離れて回転する技。ここでは後方への一回転（ピッチ −360°）を扱う。膝を抱え込んで回転半径を小さくする。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.18, label: "沈み込み" },
      { t: 0.32, label: "踏切・腕振り上げ" },
      { t: 0.55, label: "タック（最高点・最も丸まる）" },
      { t: 0.78, label: "開き出し" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.6,
  },
  {
    id: "side-flip",
    nameJp: "サイドフリップ",
    nameEn: "Side Flip",
    category: "flip",
    primaryAxis: "z",
    takeoff: "both",
    description:
      "両足踏切で身体を横方向にロールさせ、頭を一度床に向けてから着地する横回転。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.2, label: "両足踏切" },
      { t: 0.5, label: "横向き反転（最高点）" },
      { t: 0.8, label: "脚下ろし" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.6,
  },
  {
    id: "gainer",
    nameJp: "ゲイナー",
    nameEn: "Gainer",
    category: "flip",
    primaryAxis: "x",
    takeoff: "left",
    description:
      "片足で地面を離れて後方回転する技。前進しながら後方へバク宙する独特の軌道が特徴。ひねりを加えれば空中での捻り動作になる。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.25, label: "片足踏切（前進＋上方）" },
      { t: 0.55, label: "後方回転（最高点）" },
      { t: 0.8, label: "開き出し" },
      { t: 1.0, label: "着地（前方移動）" },
    ],
    duration: 1.7,
  },
  {
    id: "full",
    nameJp: "フル",
    nameEn: "Full Twist",
    category: "twist",
    primaryAxis: "x",
    twistAxis: "y",
    takeoff: "both",
    description:
      "両足から地面を離れてひねりを伴って回転する技。バク宙＋360°ツイスト。回転と捻りの軸が直交する点が分析ポイント。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.22, label: "踏切・捻り開始" },
      { t: 0.5, label: "捻り＋ピッチ最高点" },
      { t: 0.78, label: "捻り完了・開き出し" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "corkscrew",
    nameJp: "コークスクリュー",
    nameEn: "Corkscrew",
    category: "twist",
    primaryAxis: "x",
    twistAxis: "y",
    takeoff: "left",
    description:
      "片足で地面を離れて回転する技。地面から離れる前から既にひねりを仕掛け、横倒しの軸でスクリューのように回る。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.2, label: "踏切時点ですでに捻り開始" },
      { t: 0.5, label: "横倒し軸でスクリュー" },
      { t: 0.78, label: "捻り完了" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "front-flip",
    nameJp: "前宙",
    nameEn: "Front Flip",
    category: "flip",
    primaryAxis: "x",
    takeoff: "both",
    description: "両足踏切で前方へピッチ＋360°回転する基本宙返り。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.2, label: "踏切" },
      { t: 0.5, label: "タック（最高点）" },
      { t: 0.8, label: "開き出し" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.6,
  },
  {
    id: "webster",
    nameJp: "ウェブスター",
    nameEn: "Webster",
    category: "flip",
    primaryAxis: "x",
    takeoff: "right",
    description:
      "片足踏切の前宙。蹴り上げた脚の勢いを使って前方回転する。ゲイナーの前回転版。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.25, label: "片足踏切＋反対脚スイング" },
      { t: 0.55, label: "前方回転（最高点）" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "janitor",
    nameJp: "ジャニター",
    nameEn: "Janitor",
    category: "flip",
    primaryAxis: "x",
    twistAxis: "y",
    takeoff: "right",
    description:
      "ウェブスター方向の前方回転に、半回転〜1回転の捻りを加えた技。蹴り上げ脚と捻りの同期が肝。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.25, label: "片足踏切" },
      { t: 0.5, label: "前方回転＋捻り" },
      { t: 0.78, label: "捻り完了" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "butterfly",
    nameJp: "バタフライ",
    nameEn: "Butterfly Kick",
    category: "kick",
    primaryAxis: "z",
    twistAxis: "y",
    takeoff: "left",
    description:
      "身体を水平近くまで倒しながら、両脚を順番に蹴り上げる横回転キック。垂直軸まわりに身体が一回転する。",
    keypoints: [
      { t: 0.0, label: "構え（横向き）" },
      { t: 0.25, label: "左足踏切＋身体倒し" },
      { t: 0.5, label: "右足キック（最高点）" },
      { t: 0.75, label: "左足キック・着地準備" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "aerial",
    nameJp: "エアリアル",
    nameEn: "Aerial Cartwheel",
    category: "flip",
    primaryAxis: "z",
    takeoff: "right",
    description:
      "手をつかない側転。片足踏切で身体を横に倒し、両脚を弧を描いて運んで反対の足で着地する。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.3, label: "片足踏切" },
      { t: 0.55, label: "横倒し最高点" },
      { t: 0.8, label: "脚下ろし" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "master-swing",
    nameJp: "マスタースイング",
    nameEn: "Master Swing (Master Scoot)",
    category: "transition",
    primaryAxis: "y",
    takeoff: "right",
    description:
      "後ろ足を前足の外側から大きく振り出して身体を半回転させるスイッチ系トランジション。次の技につなぐ前段として使われる。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.3, label: "後ろ足スイング開始" },
      { t: 0.6, label: "身体反転（180°）" },
      { t: 1.0, label: "着地・次技構え" },
    ],
    duration: 1.4,
  },
  {
    id: "wrap",
    nameJp: "ラップ",
    nameEn: "Wrap (540 Wrap)",
    category: "twist",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "left",
    description:
      "踏切後に空中で胸の前に脚を巻き付けるようにして 540°（1.5回転）以上のひねりを稼ぐ。コンボ中継ぎでよく使われる。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.25, label: "踏切＋ひねり開始" },
      { t: 0.55, label: "ラップ（脚を畳む）" },
      { t: 0.8, label: "ひねり完了" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "tuck",
    nameJp: "タック",
    nameEn: "Tuck",
    category: "flip",
    primaryAxis: "x",
    takeoff: "both",
    description:
      "両膝を強く抱え込む“抱え込み宙返り”の総称。ここでは前方タックを扱う。回転半径を最小化することで角速度を高める。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.2, label: "踏切" },
      { t: 0.5, label: "両膝抱え込み（最大）" },
      { t: 0.8, label: "解放" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.5,
  },
  {
    id: "raiz",
    nameJp: "ライズ",
    nameEn: "Raiz",
    category: "flip",
    primaryAxis: "z",
    twistAxis: "y",
    takeoff: "left",
    description:
      "サイドフリップに半捻りを加えた技。横回転と垂直軸捻りが同時に進む点が特徴。バタフライツイスト系の入口とされる。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.25, label: "片足踏切＋横倒し" },
      { t: 0.5, label: "横回転＋半捻り" },
      { t: 0.78, label: "捻り完了・開き出し" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
];

export function getTrick(id: string): TrickMeta {
  const t = TRICKS.find((x) => x.id === id);
  if (!t) throw new Error(`unknown trick: ${id}`);
  return t;
}

export const DEFAULT_TRICK_ID = "back-flip";
