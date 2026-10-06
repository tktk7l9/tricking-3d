export type TrickCategory = "kick" | "flip" | "twist" | "transition";
export type Axis = "x" | "y" | "z";
export type Leg = "both" | "left" | "right";

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
  /** foot that leaves the ground last */
  takeoff: Leg;
  /** foot that touches down first */
  landing: Leg;
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
 *
 * Handedness: every trick is modelled for a left-twisting tricker, i.e. all
 * spins are counter-clockwise seen from above. For such a tricker the inside
 * (round) kick is the right leg, the outside (hook) kick is the left leg, cheat
 * takeoffs push off the right foot, and twisting flips twist to the left.
 * Right-twisters mirror every "left"/"right" below.
 *
 * The 20 original entries are the 20 families of the Loopkicks Tricktionary
 * (pop / cheat / swing kicks, backflip / gainer / full / corkscrew, frontflip /
 * webster / janitor, butterfly / aerial / masterswing / wrap / tak, raiz /
 * doubleleg / spyder / lotus / sideflip), each shown by its base trick.
 */

export const TRICKS: TrickMeta[] = [
  {
    id: "cheat-kick",
    nameJp: "チートキック（トルネード）",
    nameEn: "Cheat Kick (Tornado / Cheat 360)",
    category: "kick",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "right",
    landing: "left",
    description:
      "チート系キックの基本となるトルネード。前足でピボットしながら後ろ足を回し込んで背を向け（チートステップ）、左膝を振り上げて右足で踏み切り、空中で右脚の回し蹴り（インサイドキック）を的に当てて左足から着地する。合計約360°の回転。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.16, label: "チートステップ（右足を回し込む）" },
      { t: 0.4, label: "右足踏切・左膝ドライブ" },
      { t: 0.62, label: "右脚回し蹴りインパクト" },
      { t: 0.8, label: "左足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "540-kick",
    nameJp: "540キック",
    nameEn: "540 Kick",
    category: "kick",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "right",
    landing: "right",
    description:
      "トルネードにさらに180°を足し、蹴った右脚で着地（ハイパー）するキック。踏切・キック・着地がすべて同じ脚で、反対の左脚は空中で引きつけたまま。トルネードの次に覚えるチート系の基本技。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.16, label: "チートステップ" },
      { t: 0.4, label: "右足踏切・左膝ドライブ" },
      { t: 0.6, label: "右脚回し蹴りインパクト" },
      { t: 0.7, label: "左脚を畳んだまま回転継続" },
      { t: 0.8, label: "右足（蹴り脚）から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "cheat-720",
    nameJp: "チート720",
    nameEn: "Cheat 720",
    category: "kick",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "right",
    landing: "right",
    description:
      "チートステップから背を向けた姿勢で右足踏切し、空中で約360°回って反対の左脚でフックキック（アウトサイドキック）を的に当てる。蹴り脚は踏切脚と逆になるのが540との違い。右足から着地し、左足を後ろに下ろす。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.16, label: "チートステップ" },
      { t: 0.4, label: "右足踏切・左脚スイング" },
      { t: 0.5, label: "空中で身体を締めて回転" },
      { t: 0.72, label: "左脚フックキックインパクト" },
      { t: 0.82, label: "右足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "pop-kick",
    nameJp: "ポップキック（ポップ360）",
    nameEn: "Pop Kick (Pop 360)",
    category: "kick",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "both",
    landing: "both",
    description:
      "正面を向いた状態からスタートし、両足が地面から離れて、空中でひねりを伴って行うキック。チートのような前足ステップを使わない。ポップ360は正面構えから両足で跳び、空中で約180°回って左脚のアウトサイドクレセントを的に当て、両足で着地（ターボ）する。",
    keypoints: [
      { t: 0.0, label: "正面構え" },
      { t: 0.2, label: "上体を右に巻いて沈み込み" },
      { t: 0.38, label: "両足ポップ（垂直跳）" },
      { t: 0.68, label: "左脚クレセントキックインパクト" },
      { t: 0.8, label: "両足で接地（ターボ）" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.6,
  },
  {
    id: "swing-kick",
    nameJp: "スイングキック（スイング360）",
    nameEn: "Swing Kick (Swing 360)",
    category: "kick",
    primaryAxis: "y",
    takeoff: "left",
    landing: "both",
    description:
      "片足（多くの場合は右足）をもう片方の足の前に蹴り抜く勢いを利用して繰り出すキック。スイング360は左足で立った状態から右脚を前に振り抜き、その勢いで左足踏切・約360°回転して左脚のアウトサイドキックを当て、両足で着地する。スキップフックを両足着地にしたもの。",
    keypoints: [
      { t: 0.0, label: "左足立ち・右脚は後ろ" },
      { t: 0.18, label: "右脚スイング開始" },
      { t: 0.38, label: "左足踏切" },
      { t: 0.7, label: "左脚アウトサイドキックインパクト" },
      { t: 0.8, label: "両足で接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.6,
  },
  {
    id: "back-flip",
    nameJp: "バク宙",
    nameEn: "Backflip (Back Tuck)",
    category: "flip",
    primaryAxis: "x",
    takeoff: "both",
    landing: "both",
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
    id: "flash-kick",
    nameJp: "フラッシュキック",
    nameEn: "Flash Kick",
    category: "flip",
    primaryAxis: "x",
    takeoff: "both",
    landing: "right",
    description:
      "バク宙の頂点で脚を開いて蹴り上げる技。右脚が先行して回転をリードし、そのまま右足から着地する。片足踏切のゲイナーフラッシュ、さらにコークスクリューへ進む前提技。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.18, label: "沈み込み・腕を後ろへ" },
      { t: 0.32, label: "両足踏切" },
      { t: 0.45, label: "右脚蹴り上げ（最高点）" },
      { t: 0.7, label: "開脚のまま回転" },
      { t: 0.8, label: "右足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.6,
  },
  {
    id: "gainer",
    nameJp: "ゲイナー（ゲイナータック）",
    nameEn: "Gainer (Gainer Tuck)",
    category: "flip",
    primaryAxis: "x",
    takeoff: "left",
    landing: "both",
    description:
      "片足で地面を離れて後方回転する技。左足で踏み切り、右脚を前上に振り上げた勢いで前進しながらバク宙する。ひねりを加えれば空中での捻り動作になる。トリッキングで単に「ゲイナー」と言う場合は開脚のゲイナーフラッシュを指すことが多い。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.28, label: "左足踏切・右脚振り上げ" },
      { t: 0.55, label: "後方回転（最高点）" },
      { t: 0.85, label: "開き出し" },
      { t: 1.0, label: "着地（前方移動）" },
    ],
    duration: 1.7,
  },
  {
    id: "gainer-flash",
    nameJp: "ゲイナーフラッシュ",
    nameEn: "Gainer Flash",
    category: "flip",
    primaryAxis: "x",
    takeoff: "left",
    landing: "right",
    description:
      "ステップから左足で踏み切り、右脚を振り上げて脚を開いたまま後方回転するゲイナー。右足から着地する。バックスイング系（コークスクリュー等）すべての土台になる技で、トリッキングで「ゲイナー」といえばこれを指すことが多い。",
    keypoints: [
      { t: 0.0, label: "ステップ" },
      { t: 0.2, label: "腕を後ろへ・左足に乗る" },
      { t: 0.36, label: "左足踏切・右脚振り上げ" },
      { t: 0.48, label: "右脚が頂点を越える" },
      { t: 0.7, label: "開脚のまま回転" },
      { t: 0.8, label: "右足から接地" },
      { t: 1.0, label: "着地" },
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
    landing: "both",
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
    landing: "left",
    description:
      "片足で地面を離れて回転する技。地面から離れる前から既にひねりを仕掛け、横倒しの軸でスクリューのように回る。ゲイナーフラッシュに360°の捻りを加えたもので、左足で踏み切り右脚を振り上げ、踏み切った左足で着地（コンプリート）する。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.22, label: "左足踏切・右脚スイング・捻り開始" },
      { t: 0.5, label: "横倒し軸でスクリュー" },
      { t: 0.78, label: "捻り完了" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "front-flip",
    nameJp: "前宙",
    nameEn: "Front Flip (Front Tuck)",
    category: "flip",
    primaryAxis: "x",
    takeoff: "both",
    landing: "both",
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
    landing: "both",
    description:
      "片足踏切の前宙。右足で踏み切り、左脚を後方へ振り上げた（スイングスルー）勢いで前方回転する。ゲイナーと違って決まった踏切足はなく、どちらの足からでも入れる。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.3, label: "右足踏切＋左脚を後方へ振り上げ" },
      { t: 0.55, label: "前方回転（最高点）" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "janitor",
    nameJp: "ジャニター",
    nameEn: "Janitor Flip",
    category: "flip",
    primaryAxis: "y",
    takeoff: "both",
    landing: "both",
    description:
      "両足踏切で前方に胸から飛び込み、水平姿勢のまま縦軸まわりに約180°回って来た方向を向いて両足で着地する。フラットスピン軸で行うフロントハーフ（バラニ）、あるいは両足踏切のスパイダーと説明される。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.16, label: "沈み込み" },
      { t: 0.3, label: "両足踏切・前方へ飛び込み" },
      { t: 0.42, label: "水平姿勢・脚を開いて振り回す" },
      { t: 0.55, label: "180°回転（最高点）" },
      { t: 0.72, label: "両足で接地（後ろ向き）" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "butterfly",
    nameJp: "バタフライキック",
    nameEn: "Butterfly Kick",
    category: "kick",
    primaryAxis: "y",
    takeoff: "left",
    landing: "right",
    description:
      "武術由来のキック。上体を右に巻いてから左へ振り、胸を床に向けて水平に倒しながら左足で踏み切る。右脚、左脚の順に後方へ振り上げ、縦軸まわりに身体が一回転して右足（ハイパー）から着地する。バタフライツイストの土台。",
    keypoints: [
      { t: 0.0, label: "構え（足を開く）" },
      { t: 0.18, label: "上体を右に巻く" },
      { t: 0.42, label: "左足踏切・胸を床へ" },
      { t: 0.52, label: "右脚振り上げ（最高点）" },
      { t: 0.62, label: "左脚振り上げ" },
      { t: 0.8, label: "右足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "butterfly-twist",
    nameJp: "バタフライツイスト",
    nameEn: "Butterfly Twist",
    category: "twist",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "left",
    landing: "left",
    description:
      "バタフライキックの踏切から、水平になった身体の長軸まわりに360°ひねる技。腕を締め脚を揃えて回り、左肩越しに床を見て踏み切った左足から着地（コンプリート）する。右足で着地すればハイパー。",
    keypoints: [
      { t: 0.0, label: "構え（足を開く）" },
      { t: 0.18, label: "上体を右に巻く" },
      { t: 0.42, label: "左足踏切・胸を床へ" },
      { t: 0.52, label: "腕と脚を締めてひねり開始" },
      { t: 0.62, label: "ひねり180°（最高点）" },
      { t: 0.7, label: "左肩越しに床をスポット" },
      { t: 0.8, label: "左足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "cartwheel",
    nameJp: "側転（カートウィール）",
    nameEn: "Cartwheel",
    category: "flip",
    primaryAxis: "z",
    takeoff: "left",
    landing: "right",
    description:
      "トリッキングの側転は体操と違って180°向きを変えず、横へ横へと進む。左足を踏み出して左手・右手の順に床につき、右脚から振り上げて開脚で逆立ちを通過し、右足・左足の順に着地する。エアリアルやバタフライキックの前提技。",
    keypoints: [
      { t: 0.0, label: "構え（腕を上げる）" },
      { t: 0.14, label: "左足を横に踏み出す" },
      { t: 0.24, label: "左手をつく・右脚振り上げ" },
      { t: 0.42, label: "右手をつく（逆立ち通過）" },
      { t: 0.58, label: "右足で接地" },
      { t: 0.78, label: "左足で接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "aerial",
    nameJp: "エアリアル",
    nameEn: "Aerial",
    category: "flip",
    primaryAxis: "z",
    takeoff: "left",
    landing: "right",
    description:
      "手をつかない側転。左足で踏み込んで横に身体を倒し、右脚を先に振り上げて開脚のまま逆さを通過し、右足（ハイパー）から着地する。体操のエアリアルと違い横へ進む。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.14, label: "左足を横に踏み出す" },
      { t: 0.3, label: "左足踏切・右脚振り上げ" },
      { t: 0.52, label: "逆さ・開脚（最高点）" },
      { t: 0.72, label: "右足から接地" },
      { t: 0.86, label: "左足で接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "scoot",
    nameJp: "スクート",
    nameEn: "Scoot",
    category: "transition",
    primaryAxis: "y",
    takeoff: "right",
    landing: "left",
    description:
      "最初に覚えるセットアップ技のひとつ。しゃがんで左手を床につき、左手に体重を乗せたまま右足で蹴って180°回り、左足から着地して右脚を後ろに残す。この右脚のバックスイングがゲイナーやコークへの入り口になる。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.16, label: "しゃがんで前傾" },
      { t: 0.42, label: "左手をつく・右足で蹴る" },
      { t: 0.54, label: "左手を軸に180°回転" },
      { t: 0.7, label: "左足から接地" },
      { t: 1.0, label: "着地（右脚を後ろに残す）" },
    ],
    duration: 1.6,
  },
  {
    id: "master-swing",
    nameJp: "マスタースイング（マスタースクート）",
    nameEn: "Masterswing (Masterscoot)",
    category: "transition",
    primaryAxis: "y",
    takeoff: "right",
    landing: "left",
    description:
      "マスタースイングは右足ハイパー着地から、浮いている左脚を止めずに後方へ振り抜いて次のインサイド系の技へつなぐトランジション。ここではその代表技マスタースクート（両手をつき、側転に近い高さまで倒れ込むスクート）を示す。右足で蹴って回り、左足から着地する。",
    keypoints: [
      { t: 0.0, label: "ハイパー着地（右足立ち）" },
      { t: 0.16, label: "左脚を後方へスイング" },
      { t: 0.42, label: "左手をつく・右足で蹴る" },
      { t: 0.54, label: "両手をついて倒立に近づく" },
      { t: 0.7, label: "左足から接地" },
      { t: 1.0, label: "着地（次技の構え）" },
    ],
    duration: 1.8,
  },
  {
    id: "wrap",
    nameJp: "ラップ（ラップフル）",
    nameEn: "Wrap Full",
    category: "twist",
    primaryAxis: "x",
    twistAxis: "y",
    takeoff: "right",
    landing: "left",
    description:
      "右足ハイパー着地から、浮いている左足を軸足の後ろに巻き付ける（ラップ）ように引き込み、右足一本で踏み切るフルツイスト。軸はやや斜めになり、踏み切った足と逆の左足で着地（コンプリート）する。タックフルの近縁。",
    keypoints: [
      { t: 0.0, label: "ハイパー着地（右足立ち）" },
      { t: 0.18, label: "左脚を軸足の後ろへラップ" },
      { t: 0.38, label: "右足踏切・ひねり開始" },
      { t: 0.5, label: "腕を締めて後方回転＋ひねり" },
      { t: 0.62, label: "ひねり180°（最高点）" },
      { t: 0.82, label: "左足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "tak",
    nameJp: "タック（タックフル）",
    nameEn: "Tak Full",
    category: "twist",
    primaryAxis: "x",
    twistAxis: "y",
    takeoff: "right",
    landing: "left",
    description:
      "チートステップ（トルネードと同じ入り）からラップフルを行う技。右足で踏み切り、左脚を巻き込みながら後方回転＋360°ひねる。チート入りのため回転軸は水平に近く、あまり逆さにならない。左足で着地する。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.16, label: "チートステップ" },
      { t: 0.4, label: "右足踏切・左脚を巻き込む" },
      { t: 0.5, label: "腕を締めて回転＋ひねり" },
      { t: 0.63, label: "ひねり180°（最高点）" },
      { t: 0.82, label: "左足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.9,
  },
  {
    id: "raiz",
    nameJp: "ライズ",
    nameEn: "Raiz",
    category: "flip",
    primaryAxis: "y",
    twistAxis: "z",
    takeoff: "right",
    landing: "left",
    description:
      "手をつかないガンビー、または上体を反らせて寝かせたトルネードと説明されるアウトサイド系の技。右足を進行方向へ踏み込み、左脚のかかとを後方へ蹴り上げながら上体を後ろ側へ倒し、斜めに傾いた軸のまわりを一回転して左足から着地する。タッチダウンライズなど多くのセットアップの元。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.16, label: "ステップで背を向ける" },
      { t: 0.4, label: "右足踏切・左かかとを後方へ" },
      { t: 0.52, label: "上体を寝かせて脚が頂点へ" },
      { t: 0.64, label: "斜め軸で回転（最高点）" },
      { t: 0.82, label: "左足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "double-leg",
    nameJp: "ダブルレッグ",
    nameEn: "Doubleleg",
    category: "flip",
    primaryAxis: "y",
    takeoff: "both",
    landing: "both",
    description:
      "カポエイラのアルマーダ・ドゥプラに由来する技。両足で踏み切り、上体を巻いてから後ろに倒しつつ、揃えた両脚を伸ばしたまま横に振り回して身体をV字にする。腰が胸より上がらない点でパイクのサイドフリップと区別される。両足で着地。ポップ360が前提技。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.2, label: "上体を右に巻いて沈み込み" },
      { t: 0.36, label: "両足踏切" },
      { t: 0.48, label: "両脚を揃えて振り上げ" },
      { t: 0.58, label: "V字（最高点）" },
      { t: 0.78, label: "両足で接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "spider",
    nameJp: "スパイダー",
    nameEn: "Spyder",
    category: "flip",
    primaryAxis: "y",
    takeoff: "right",
    landing: "left",
    description:
      "ライズと同じステップで入るが、頭上を越えて回る代わりにバタフライキックのように胸を床に向けた水平姿勢で平らに回る技（別名スノーバブル）。右足で踏み切り、左脚を先に振り上げ、左足から着地する。",
    keypoints: [
      { t: 0.0, label: "助走" },
      { t: 0.16, label: "ステップで背を向ける" },
      { t: 0.4, label: "右足踏切・胸を床へ" },
      { t: 0.52, label: "水平姿勢で両脚を振り上げ（最高点）" },
      { t: 0.72, label: "左脚を下ろす" },
      { t: 0.8, label: "左足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.8,
  },
  {
    id: "lotus",
    nameJp: "ロータス（ロータスキック）",
    nameEn: "Lotus Kick",
    category: "kick",
    primaryAxis: "y",
    twistAxis: "y",
    takeoff: "left",
    landing: "right",
    description:
      "武術の騰空擺蓮（跳び外回し蹴り）。踏み込んで右脚を先に振り上げ、左足で踏み切って縦軸まわりに一回転し、左脚のアウトサイドクレセントを両手で叩いて右足から着地する。踏切脚で蹴る点でチート720と異なる。トリッキングの用語集ではロータス系（ロータスダブルレッグ等）の名の元でもある。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.26, label: "踏み込み" },
      { t: 0.42, label: "左足踏切・右脚振り上げ" },
      { t: 0.62, label: "左脚クレセント開始" },
      { t: 0.7, label: "蹴り抜き・両手で叩く" },
      { t: 0.82, label: "右足から接地" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.7,
  },
  {
    id: "side-flip",
    nameJp: "サイドフリップ",
    nameEn: "Side Flip",
    category: "flip",
    primaryAxis: "z",
    takeoff: "both",
    landing: "both",
    description:
      "両足踏切で身体を横方向にロールさせ、頭を一度床に向けてから着地する横回転。抱え込んで回る。",
    keypoints: [
      { t: 0.0, label: "構え" },
      { t: 0.2, label: "両足踏切" },
      { t: 0.5, label: "横向き反転（最高点）" },
      { t: 0.8, label: "脚下ろし" },
      { t: 1.0, label: "着地" },
    ],
    duration: 1.6,
  },
];

export function getTrick(id: string): TrickMeta {
  const t = TRICKS.find((x) => x.id === id);
  if (!t) throw new Error(`unknown trick: ${id}`);
  return t;
}

export const DEFAULT_TRICK_ID = "back-flip";
