import type { ScoreAxis } from "./scoreAxes";

/**
 * 結果ページの「このタイプの決め手」ブロック用の表示データ。
 *
 * 4軸メーター（エネルギー / 流れ / 温度 / うるおい）は
 * 「他の人と比べて自分がどのあたりか」を示す共通のものさしで、
 * 16タイプの判定根拠をすべて表現する役割は持たない。
 * 実際、内部9軸のうち SP と DAM は4軸メーターに一度も現れず、
 * BL は4軸では「うるおい」に薄まって出るため、
 * 03 食後スリープ / 04 むくみストック / 10 めぐり不足 は
 * 4本のメーターだけでは名前の根拠が読み取れない。
 *
 * そこをこのブロックが補う。判定ロジックには一切関与しない表示専用データで、
 * 値は scoring.ts が返す percent をそのまま読むだけ。
 */

/**
 * 内部9軸のユーザー向け表示名。
 * 「エネルギー」「流れ」「温度」「うるおい」は4軸メーターが使っているので、
 * 混同しないよう別の言い回しにしてある。
 * 「血虚」「痰湿」などの専門用語は見出しに出さない（tcmNoteが小さく補足する役）。
 */
export const AXIS_DISPLAY_NAME: Record<ScoreAxis, string> = {
  QI: "元気のストック",
  BL: "カラダの材料",
  SP: "食後のコンディション",
  DAM: "溜め込みやすさ",
  ST: "ストレスの受けやすさ",
  STA: "滞りやすさ",
  JIN: "乾きやすさ",
  YANG: "冷えやすさ",
  YIN: "熱のこもりやすさ",
};

/**
 * 決め手の出し方。
 * - axis        : primary軸の強さをピップで見せる（軸がそのままタイプの根拠になっているタイプ）
 * - signal      : primary軸はあるが、判定はシグナル寄与が大きいタイプ。数値では説明しない
 * - variability : 15波乗り。軸を一切見ずに変動の申告数で決まる
 * - mix         : 16クセ強。複数系統が同時に高いことで決まる
 */
export type HighlightKind = "axis" | "signal" | "variability" | "mix";

export interface TypeHighlight {
  kind: HighlightKind;
  /** kind === "axis" のときだけ使う。ピップの上に出る短いラベル */
  axisLabel?: string;
  /** 1〜2文。既存のlead/features/cautions/chargesとは重複させない */
  note: string;
}

/**
 * 02 電池切れ / 12 夜型スイッチ / 13 スロースタート / 14 常時アクセル は
 * スコアに占める軸の寄与が小さい（13は9%）。
 * これらのタイプは「軸が強く出たから」決まったわけではないので、
 * 軸の強さを見せると、かえって結果と食い違って見える。
 */
export const TYPE_HIGHLIGHTS: Record<string, TypeHighlight> = {
  "juden-beta": {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.QI,
    note: "充電したぶんが、思ったより早く目減りしていく感じ。ここがいちばんはっきり出ています。",
  },
  "denchi-gire": {
    kind: "signal",
    note: "午後から夕方にかけて、その日の分を使い切っていく。そのタイミングを示す回答がそろいました。",
  },
  "shokugo-sleep": {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.SP,
    note: "食べたあとの重さや眠気。ここがこのタイプならではの手がかりになりました。",
  },
  "mukumi-stock": {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.DAM,
    note: "水分も疲れも、出ていくより溜まるほうが優勢になりやすい。ここが決め手になりました。",
  },
  hiehie: {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.YANG,
    note: "一度冷えると、温まるまでに時間がかかる。そのくり返しが強く出ています。",
  },
  hotehote: {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.YIN,
    note: "外に逃げきらない熱が、内側に残りやすい。そこがこのタイプの決め手です。",
  },
  "karada-jutai": {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.STA,
    note: "同じ姿勢が続くほど、動き出しが重くなる。そこがいちばん強く出ています。",
  },
  "ira-ira": {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.ST,
    note: "同じストレスでも、あなたの場合は体の張りとして先に出やすい。そこが決め手になりました。",
  },
  "uruoi-busoku": {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.JIN,
    note: "使ったぶんが戻るまでに、少し時間がかかる感じ。そこがこのタイプの決め手です。",
  },
  "meguri-busoku": {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.BL,
    note: "カラダの材料が不足しやすい傾向が、はっきり出ています。ほかの項目では見えにくい、このタイプの核心です。",
  },
  "atama-guruguru": {
    kind: "axis",
    axisLabel: AXIS_DISPLAY_NAME.ST,
    note: "同じストレスでも、あなたの場合は考えごとのループとして先に出やすい。そこが決め手になりました。",
  },
  "yagata-switch": {
    kind: "signal",
    note: "夜になるほどスイッチが入る。時間帯の使い方を示す回答がそろいました。",
  },
  "slow-start": {
    kind: "signal",
    note: "動き出すまでの重さに回答が集中しました。元気の量というより、立ち上がりの時間の話です。",
  },
  "tsune-accel": {
    kind: "signal",
    note: "止まっている時間が短い。オフに切り替える場面を示す回答がそろいました。",
  },
  "nami-nori": {
    kind: "variability",
    note: "「日によって違う」という回答が複数ありました。コンディションの振れ幅そのものが、このタイプの決め手です。",
  },
  "kuse-tsuyoi": {
    kind: "mix",
    note: "ひとつの傾向では説明しきれませんでした。複数の傾向が同じくらいの強さで重なっています。",
  },
};

/** 0-100の軸スコアを、点数に見えない5段階の傾向に変換する */
export interface AxisStrength {
  /** 1〜5。ピップの点灯数 */
  level: number;
  label: string;
}

export function axisStrength(percent: number): AxisStrength {
  if (percent >= 85) return { level: 5, label: "かなり強め" };
  if (percent >= 65) return { level: 4, label: "強め" };
  if (percent >= 45) return { level: 3, label: "しっかり出ています" };
  if (percent >= 25) return { level: 2, label: "少し出ています" };
  return { level: 1, label: "控えめ" };
}

export const HIGHLIGHT_LEVELS = 5;
