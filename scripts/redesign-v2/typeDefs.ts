import type { ScoreAxis } from "../../src/data/scoreAxes";
import type { OptionKey } from "./questions";

export type AxisPercents = Record<ScoreAxis, number>;
export type AnswerArray = OptionKey[]; // index 0 = Q1

export interface QuestionBonus {
  questionId: number;
  keys: OptionKey[];
  bonus: number;
}

export interface TypeDef {
  id: string;
  no: number;
  name: string;
  primary: ScoreAxis[];
  primaryWeights?: Partial<Record<ScoreAxis, number>>;
  secondary?: ScoreAxis[];
  /**
   * 「候補になれるか」の最低ライン。軸だけでなく回答(answers)も見られる。
   * 主軸を共有する似たタイプ同士は、スコアの奪い合いにせず、ここで
   * 「片方が真なら他方は偽になる」条件（SPとQIの大小関係、特定設問の有無など）を
   * 使って、そもそも同時に候補にならないよう設計する。
   */
  gate: (p: AxisPercents, answers: AnswerArray) => boolean;
  /** ゲートを通った候補同士の微調整用（任意） */
  modifier?: (p: AxisPercents) => number;
  questionBonuses?: QuestionBonus[];
}

const ans = (a: AnswerArray, q: number) => a[q - 1];

// 14タイプ分の定義。15(波乗り)/16(クセ強ミックス)はアルゴリズム側のフォールバックとして扱う。
export const TYPE_DEFS: TypeDef[] = [
  {
    id: "juden-beta",
    no: 1,
    name: "充電下手",
    primary: ["QI"],
    secondary: ["SP"],
    // 02との切り分け: SPがQIに対して大きく劣らない(=回復力もセットで低い)ことを必須にする
    gate: (p) => p.QI >= 48 && p.SP >= 40 && p.SP >= p.QI - 12,
    modifier: (p) => (p.SP - p.QI) * 0.15,
  },
  {
    id: "denchi-gire",
    no: 2,
    name: "電池切れ",
    primary: ["QI"],
    // 01との切り分け: SPがQIより明確に低い(=純粋な枯渇)ことを必須にする。QIのラインも01より高い
    gate: (p) => p.QI >= 60 && p.SP < p.QI - 12,
    modifier: (p) => (p.QI - p.SP) * 0.15,
  },
  {
    id: "shokugo-sleep",
    no: 3,
    name: "食後スリープ",
    primary: ["SP", "DAM"],
    secondary: ["QI"],
    // 04との切り分け: 「食後」の行動シグナルを必須にする
    gate: (p, a) => p.SP >= 35 && p.DAM >= 30 && ["B", "C"].includes(ans(a, 2)),
  },
  {
    id: "mukumi-stock",
    no: 4,
    name: "むくみストック",
    primary: ["DAM"],
    // 03との切り分け: 食事タイミングでなく「むくみそのものの実感」を必須にする(慢性型)
    gate: (p, a) => p.DAM >= 55 && ans(a, 27) !== "A",
    modifier: (p) => (p.DAM - p.SP) * 0.15,
  },
  {
    id: "hiehie",
    no: 5,
    name: "冷え冷え",
    primary: ["YANG"],
    // 13との切り分け: 「慣れると普通に動ける」の行動シグナルが無いことを必須にする
    gate: (p, a) => p.YANG >= 45 && ans(a, 29) !== "C",
    modifier: (p) => -p.YIN * 0.15,
  },
  {
    id: "hotehote",
    no: 6,
    name: "ほてほて",
    primary: ["YIN"],
    // 12との切り分け: 「夜のほうが元気」の行動シグナルが無いことを必須にする
    gate: (p, a) => p.YIN >= 45 && ans(a, 16) !== "B",
    modifier: (p) => -p.YANG * 0.15,
    questionBonuses: [{ questionId: 6, keys: ["C"], bonus: 8 }],
  },
  {
    id: "karada-jutai",
    no: 7,
    name: "カラダ渋滞",
    primary: ["ST", "STA"],
    primaryWeights: { ST: 0.4, STA: 0.6 },
    // 08/11/14との切り分け: STA(身体のコリ)という別軸の高さを必須にする
    gate: (p) => p.ST >= 35 && p.STA >= 32,
  },
  {
    id: "ira-ira",
    no: 8,
    name: "イライラ充満",
    primary: ["ST"],
    // 07/11/14いずれの行動シグナルも無い「純粋に高ST」のデフォルト型。STAが低いことだけ必須にする
    gate: (p) => p.ST >= 55 && p.STA < 32,
    modifier: (p) => -p.STA * 0.15,
  },
  {
    id: "uruoi-busoku",
    no: 9,
    name: "うるおい不足",
    primary: ["BL", "YIN"],
    // 10/12との切り分け: QIでなくYIN寄り、かつ「夜のほうが元気」(=夜型)のシグナルが無いこと
    gate: (p, a) => p.BL >= 35 && p.YIN >= 35 && p.YIN >= p.QI && ans(a, 16) !== "B",
    modifier: (p) => (p.YIN - p.QI) * 0.15,
    questionBonuses: [{ questionId: 28, keys: ["D"], bonus: 6 }],
  },
  {
    id: "meguri-busoku",
    no: 10,
    name: "めぐり不足",
    primary: ["BL", "QI"],
    // 09との切り分け: もう片方の要素がYINでなくQI寄り(だるさ・立ちくらみ寄り)
    gate: (p) => p.BL >= 35 && p.QI >= 35 && p.QI >= p.YIN,
    modifier: (p) => (p.QI - p.YIN) * 0.15,
    questionBonuses: [{ questionId: 15, keys: ["B", "C", "D"], bonus: 6 }],
  },
  {
    id: "atama-guruguru",
    no: 11,
    name: "頭ぐるぐる",
    primary: ["ST"],
    // 08/14との切り分け: 「考え始めると止まらない」の行動シグナルを必須にする
    gate: (p, a) => p.ST >= 38 && ans(a, 24) === "D",
    questionBonuses: [{ questionId: 24, keys: ["D"], bonus: 8 }], // イライラ充満との重なり時の決め手
  },
  {
    id: "yagata-switch",
    no: 12,
    name: "夜型スイッチ",
    primary: ["YIN"],
    // 06との切り分け: 「夜のほうが元気」の行動シグナルを必須にする
    gate: (p, a) => p.YIN >= 38 && ans(a, 16) === "B",
  },
  {
    id: "slow-start",
    no: 13,
    name: "スロースタート",
    primary: ["YANG", "QI"],
    // 02との切り分け: 「最初は本調子でないが慣れると普通に動ける」の行動シグナルを必須にする。
    // この設問(Q29=C)は他のどのタイプのゲートにも使われていないので、強めのボーナスを与えて良い。
    gate: (p, a) => p.YANG >= 32 && p.QI >= 28 && ans(a, 29) === "C",
    questionBonuses: [{ questionId: 29, keys: ["C"], bonus: 20 }],
  },
  {
    id: "tsune-accel",
    no: 14,
    name: "常時アクセル",
    primary: ["ST"],
    // 08/11との切り分け: 「詰まるほど燃える／頑張りすぎ」の行動シグナルを必須にする
    gate: (p, a) => p.ST >= 38 && (ans(a, 22) === "A" || ans(a, 23) === "A"),
    questionBonuses: [
      { questionId: 22, keys: ["A"], bonus: 6 },
      { questionId: 23, keys: ["A"], bonus: 6 },
    ],
  },
];

export const NAMI_NORI_MARGIN = 6;
// 「体調の波は？」(Q26)で日々の変動を自己申告した人だけ、波乗りコンディションに
// 逃がすスコア上限を引き上げる。逆に「安定している」と答えた人は、僅差でもなるべく
// どちらかのタイプに決め切る（上限を下げる）。
export const NAMI_NORI_CEILING_VARIABLE = 65;
export const NAMI_NORI_CEILING_STABLE = 48;
export function isMoodSwingSignal(answers: AnswerArray): boolean {
  const a = ans(answers, 26);
  return a === "B" || a === "D";
}
