# Tricking 3D Analyzer

トリッキング/パルクールの 20 技を Three.js で 3D 表示し、タイムラインスクラブ・回転軸表示・重心軌跡可視化・キーポイント注釈などで動きを細かく分析できる Web アプリ。

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

- **左サイドバー**: 20 技をカテゴリ別（キック/フリップ/ツイスト/トランジション）から選択。検索可。
- **下部タイムライン**:
  - `▶/⏸` 再生・停止
  - `◀ ▶|` 1/30 秒コマ送り
  - シークバーで任意フレームへ移動（自動で停止）
  - `0.1× / 0.25× / 0.5× / 1× / 1.5× / 2×` の再生速度
- **右上カメラ切替**: 正面 / 側面 / 真上 / 自由（自由のみマウスドラッグ可）。
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

## 設計メモ

- 技ごとのアニメーションは `src/tricks/animations/index.ts` にコードで合成（`THREE.AnimationClip`）。`src/tricks/authoring.ts` の `Builder` がキーフレーム編集のための小さな DSL。
- 技のメタデータ（名前・カテゴリ・回転軸・キーポイント）は `src/tricks/catalog.ts`。
- 解析オーバーレイは `src/analysis/`（軸矢印、重心ライン、ラベルスプライト）。
- UI は素の DOM + CSS で `src/ui/` に分離。
