# カラダ性格診断

東洋医学の考え方をベースにした、エンタメ寄りの体質セルフチェック。
全30問に答えると、16タイプのうちのどれかに判定される。

- 会員登録なし・個人情報の入力なし
- 回答はブラウザの中だけで処理され、サーバーに保存しない
- 結果は URL に埋め込んで共有できる

## 技術構成

| | |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| UI | React 19 / Tailwind CSS 4 |
| フォント | Zen Maru Gothic (`next/font/google`) |
| アクセス解析 | Vercel Web Analytics |
| ホスティング | Vercel 想定 |

> ⚠️ このリポジトリの Next.js は学習データにあるバージョンと挙動が違う場合がある。
> API や規約を確認するときは `node_modules/next/dist/docs/` を読むこと（`AGENTS.md` 参照）。

## 開発

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 本番ビルド
npm start       # ビルド済みを起動
npm run lint    # ESLint
npx tsc --noEmit
```

## 検証

診断ロジックは `npm run verify` で通しで検証できる。**4つのうち1つでも落ちれば全体が失敗する。**

```bash
npm run verify
```

| | 内容 |
|---|---|
| 1/4 `verify:src` | 判定ロジック21項目（ブラインド16タイプ、ランダム25,000件の分布、4軸の値、安定性、単調性、URL往復） |
| 2/4 `verify:parity` | `src/data/` の実装が `scripts/redesign-v4/` のプロトタイプと完全一致するか（50,016件） |
| 3/4 `verify:display` | 4軸メーターの表示スケール14項目（偏り、タイプ間の見分け） |
| 4/4 `verify:scale` | `src/data/axisScale.ts` が生成パラメータから再生成できるか |

個別に走らせる場合は `npm run verify:src` など。

## ディレクトリ

```
src/
  app/
    page.tsx              トップ
    diagnosis/            30問の出題（クライアント側で進行）
    result/[type]/        結果ページ（?a= があれば個人の4軸も出す）
    about/ privacy/ terms/
    not-found.tsx         404
    error.tsx             ページ内エラー（既定の英語表示を出さないため）
    global-error.tsx      ルートレイアウトが落ちたときの最後の受け皿
    robots.ts sitemap.ts  SEO
    opengraph-image.tsx   OGP画像（結果ページ側にもタイプ別のものがある）
  components/
    AxisMeter.tsx         4軸メーター（双方向。50が中央）
    TypeHighlight.tsx     「このタイプの決め手」
    ShareActions.tsx      X / LINE / URLコピー
    SiteAnalytics.tsx     アクセス解析の設置
    ResultTracking.tsx    結果表示・再診断の計測
  data/                   ★ 診断の中身（下記の注意を参照）
  lib/
    analytics.ts          計測の入口。送ってよいものを型で制限
    siteUrl.ts            公開URLの解決
scripts/redesign-v2..v4/  設計時のプロトタイプと検証スクリプト
docs/                     設計の経緯（v2〜v10）
```

## 触るときの注意

### `src/data/` は検証で固定されている

`questions.ts` / `scoring.ts` / `typeDefs.ts` / `resultTypes.ts` / `axisScale.ts` は、
`npm run verify` のプロトタイプ照合とブラインド検証に縛られている。
ここを変えると 1/4 と 2/4 が落ちる。**変えるなら検証side も同時に更新し、判定結果の差分を数えてから**。

### 4軸メーターは表示専用

画面に出る4軸は、内部9軸から**表示のためだけに**計算している（`computeVisibleAxes`）。
`judge()` はこれを呼んでいないので、**4軸の式を変えてもタイプ判定は1件も変わらない**。

```
エネルギー = 100 - max(QI, BL)
流れ       = 100 - max(ST, STA)
温度       = 50 + (YIN - YANG) / 2
水分       = 50 + (DAM - JIN) / 2
```

エネルギーと流れは「不足量」なので分布が右に偏る。そのぶんだけ `axisScale.ts` の
分位点テーブルで補正している。温度と水分は 50 が真の中央なので**正規化しない**。
`computeVisibleAxes` を変えたら、必ず `build-axis-scale.ts` でテーブルを作り直すこと
（作り直さないと全員が端に張り付く）。

### 結果URLの `?a=` は回答そのもの

`?a=` には30問の回答が A〜D の30文字として入っている。サーバーに保存せずに結果を
再現するための仕組みで、**このURLを共有すると回答内容も共有される**（プライバシーポリシーに明記済み）。
`?a=` が無い／不正な場合は、そのタイプの紹介ページとして成立する（4軸メーターだけ出ない）。

### アクセス解析に送ってよいものは型で決まっている

`src/lib/analytics.ts` の `trackEvent()` だけを使う。イベント名とプロパティが
allowlist になっていて、回答・9軸スコア・4軸スコア・localStorage の中身・
クエリ文字列付きURLは**渡そうとするとコンパイルが通らない**。Cookie も使っていない。

### 色のコントラスト

`--text-soft` / `--accent` / `--cta-from` / `--cta-to` は WCAG AA (4.5:1) を満たす値を選んである。
`globals.css` のコメントに実測値があるので、薄くする方向に変えるときは測り直すこと。
OGP画像（`opengraph-image.tsx`）は CSS変数を使えないので同じ色を直接書いている。片方だけ変えるとズレる。

16タイプの色（`resultTypes.ts` の `color`）は、淡い背景に乗せると 1.47〜4.13:1 で
基準に届いていない（14/16タイプ）。直すには16色の一括見直しとOGP画像の作り直しが必要なので未対応。

## 環境変数

**設定しなくても動く。** Vercel にデプロイすれば本番ドメインが自動で入る。

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | 独自ドメインを取ったときだけ設定（末尾スラッシュなし）。canonical / OGP / sitemap の絶対URLに使う |

未設定時は `VERCEL_PROJECT_PRODUCTION_URL` →
ローカルなら `http://localhost:3000` にフォールバックする（`src/lib/siteUrl.ts`）。
デプロイごとに変わる `VERCEL_URL` は、プレビューのOGPが本番に混ざるので使っていない。

見本は `.env.example`。

## 免責

医療行為・診断ではなく、エンタメ目的のセルフチェック。詳細は `/about` と `/terms` に記載。
