# Tricking 3D Analyzer

**[▶ Open App](https://tricking-3d.saitotakuya0719.workers.dev)**

トリッキング/パルクールの 27 技を Three.js で 3D 表示し、タイムラインスクラブ・回転軸表示・重心軌跡可視化・キーポイント注釈などで動きを細かく分析できる Web アプリ。

参考: [pt-village.com/tricking](https://pt-village.com/tricking/)

## 起動

```bash
npm install
npm run dev          # http://localhost:5173 が自動で開きます
```

ビルド & プレビュー:

```bash
npm run build
npm run preview
```

## 操作

- **左サイドバー**: 27 技をカテゴリ別（キック/フリップ/ツイスト/トランジション）から選択。検索可（ひらがな・カタカナ・英語・全角半角を区別しない）。選んだ技は URL（例: `#side-flip`）に残るので、再読み込みや共有でも同じ技が開く。
- **スマホ幅**: 3D ビューの下にタイムラインと「技一覧 / 解説・キーポイント」のタブ。
- **下部タイムライン**:
  - `▶/⏸` 再生・停止
  - `|◀ ▶|` 1/30 秒コマ送り
  - キーボード: `Space` 再生・停止 / `←` `→` 1コマ戻る・進む
  - シークバーで任意フレームへ移動（自動で停止）
  - `0.1× / 0.25× / 0.5× / 1× / 1.5× / 2×` の再生速度
- **右上カメラ切替**: 正面 / 側面 / 真上 / 自由（どの視点でもドラッグすると自由視点に切り替わる）。
- **左下オーバーレイ**:
  - 軸表示（赤=主回転軸、シアン=捻り軸）
  - 重心軌跡（黄色いライン、hips の軌跡）
  - 注釈（キーポイントラベル、クリックで該当時刻へシーク）
- **右パネル**: 技名・カテゴリ・踏切足・軸情報・解説テキスト・キーポイント一覧（クリックでシーク）。

## キャラクターモデル（任意）

デフォルトでは Mixamo 互換ボーン階層を持つ手続き型ヒューマノイド（カプセルボディ）が表示されます。リアルなスキンメッシュに差し替えたい場合は次の手順:

1. [https://www.mixamo.com](https://www.mixamo.com) にログイン
2. **X-Bot** または **Y-Bot** を選択
3. アニメーションを付けずに **T-pose** のまま `Download` →
   - Format: `GLB`
   - Pose: `T-pose`
4. 取得した `.glb` を `public/models/character.glb` に配置

ボーン名（mixamorigHips, mixamorigSpine, …, mixamorigLeftFoot 等）は手続き型と同じなので、配置するだけでスキンメッシュに切り替わります。

## 技の選び方と左右の約束

- 元の 20 技は Loopkicks Tricktionary の 20 ファミリー（ポップ/チート/スイング、バク宙/ゲイナー/フル/コーク、前宙/ウェブスター/ジャニター、バタフライ/エアリアル/マスタースイング/ラップ/タック、ライズ/ダブルレッグ/スパイダー/ロータス/サイドフリップ）をそれぞれ代表技で示したもの。そこに 540・チート720・フラッシュキック・ゲイナーフラッシュ・バタフライツイスト・側転・スクートを足して 27 技。
- すべて **左回り（反時計回り・左ひねり）の人** を基準にモデル化している。右足がインサイド（回し蹴り）、左足がアウトサイド（フック）、チート踏切は右足、ひねりは左。右回りの人は左右を読み替える。
- 用語は Loopkicks Tricktionary（https://www.loopkickstricking.com/tricktionary/）に合わせ、着地はコンプリート／ハイパーの慣例（踏切足で着地＝コンプリート、反対足＝ハイパー）に従う。

## 設計メモ

- 技ごとのアニメーションはコードで合成（`THREE.AnimationClip`）。
  - 縦回転の基本技（バク宙・前宙・サイドフリップ・ゲイナー・フル・コーク・ウェブスター）は `src/tricks/animations/index.ts` の `Builder` DSL（`src/tricks/authoring.ts`）による手付けキー。
  - それ以外は `src/tricks/rig.ts` のセマンティックリグ（腰の heading/pitch/roll/twist、脚の方位・挙上・膝、腕など）で `kicks.ts` / `inside.ts` / `outside.ts` / `flips.ts` に記述。リグは単調3次補間で密にサンプリングし、ピン止めした足（手）を軸に腰を解き、空中は放物線、接地中は最下点が床に着くように腰の高さを決める。
  - `src/tricks/animations/plausibility.test.ts` が全技について「足が床を貫かない」「踏切足・着地足がカタログと一致する」ことを実機のリグで検証する。
- 技のメタデータ（名前・カテゴリ・回転軸・踏切足・着地足・キーポイント）は `src/tricks/catalog.ts`。
- 解析オーバーレイは `src/analysis/`（軸矢印、重心ライン、ラベルスプライト）。
- UI は素の DOM + CSS で `src/ui/` に分離。

## ホスティング

本番は **Cloudflare Workers (static assets)**: https://tricking-3d.saitotakuya0719.workers.dev

2026-08-11、Vercel 無料枠の超過でアカウントが停止（全プロジェクトが
`402 DEPLOYMENT_DISABLED`）したため移行した。`wrangler.jsonc` の `assets` だけで
配信し、セキュリティヘッダーは `public/_headers`（`vercel.json` の `headers` を
移植）。`npm run deploy` で build + wrangler deploy。vercel.json は残置。
