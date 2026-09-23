# OGP画像用フォント

`src/app/**/opengraph-image.tsx` の `ImageResponse` で使う日本語フォント。

- 元フォント: [Zen Maru Gothic](https://fonts.google.com/specimen/Zen+Maru+Gothic)（SIL Open Font License 1.1 / `ZenMaruGothic-OFL.txt`）
- サイトの本文フォント（`next/font/google` の Zen Maru Gothic）と同じ書体

## なぜサブセットなのか

`ImageResponse` はバンドル全体で 500KB という上限があり、
日本語フォントは1ウェイトで約3.5MBある。そのままでは載らない。

OGP画像に出る文字は有限（固定文言＋16タイプの name / catchCopy / no）なので、
その文字だけに絞って約52KB × 2ウェイト = 約104KB に収めている。

`ImageResponse` は ttf / otf / woff のみ対応（woff2 は非対応）。

## 収録文字

`ogp-charset.txt` にある218文字。絵文字は twemoji が画像として描画するため含まない。

## 作り直す手順

タイプ名・catchCopy・固定文言を変えたら、このフォントも作り直すこと。

```bash
python3 -m pip install --user fonttools brotli

# 1. 必要な文字を書き出す
npx tsx -e '
import {RESULT_TYPES} from "./src/data/resultTypes";
const fixed = "カラダ性格診断あなたのには、性格がある。30問でわかる「クセ」YOUR BODY TYPE無料診断0123456789 /|・、。（）ーABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const fromTypes = RESULT_TYPES.map(t => `${t.name}${t.catchCopy}${String(t.no).padStart(2,"0")}`).join("");
console.log([...new Set((fixed + fromTypes).split(""))].filter(c => c.codePointAt(0)! < 0x1F000).sort().join(""));
' > assets/ogp-charset.txt

# 2. 元フォントを取得
curl -sL -o /tmp/zen-bold.ttf  https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/ZenMaruGothic-Bold.ttf
curl -sL -o /tmp/zen-black.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/ZenMaruGothic-Black.ttf

# 3. サブセット化
pyftsubset /tmp/zen-bold.ttf  --text-file=assets/ogp-charset.txt --output-file=assets/ZenMaruGothic-Bold.subset.ttf  --layout-features='' --no-hinting --desubroutinize --drop-tables+=DSIG
pyftsubset /tmp/zen-black.ttf --text-file=assets/ogp-charset.txt --output-file=assets/ZenMaruGothic-Black.subset.ttf --layout-features='' --no-hinting --desubroutinize --drop-tables+=DSIG
```
