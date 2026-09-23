import { QUESTIONS } from "./questions";
import { SCORE_AXES, type ScoreAxis } from "./scoreAxes";

/**
 * 判定に必要なメタデータだけを置くファイル。
 * 表示用のコピー（キャッチコピー・説明文・色など）は resultTypes.ts が持ち、
 * ここには一切重複させない。id で両者が対応する。
 */

/** ユーザーに見せる4メーターに対応する4系統。1つの軸が2系統に属することはない。 */
export type Family = "energy" | "stress" | "moisture" | "temperature";

export const AXIS_FAMILY: Record<ScoreAxis, Family> = {
  QI: "energy",
  BL: "energy",
  ST: "stress",
  STA: "stress",
  SP: "moisture",
  DAM: "moisture",
  JIN: "moisture",
  YANG: "temperature",
  YIN: "temperature",
};

export interface TypeDef {
  /** resultTypes.ts の id と一致させる */
  id: string;
  family: Family;
  /** このタイプを代表する軸。スコアの軸side はこの軸の%だけを見る */
  primary: ScoreAxis;
}

/**
 * 軸スコア＋シグナルでランキングされる14タイプ。
 * 15波乗りコンディション / 16クセ強ミックス はここに含まれない。
 * この2つは「どれにも当てはまらなかった残り」ではなく、
 * それぞれ独自の成立条件（変動シグナル / 3系統同時高値）で判定される。
 */
export const SCORED_TYPES: TypeDef[] = [
  { id: "juden-beta", family: "energy", primary: "QI" },
  { id: "denchi-gire", family: "energy", primary: "QI" },
  { id: "slow-start", family: "energy", primary: "QI" },
  { id: "meguri-busoku", family: "energy", primary: "BL" },
  { id: "karada-jutai", family: "stress", primary: "STA" },
  { id: "ira-ira", family: "stress", primary: "ST" },
  { id: "atama-guruguru", family: "stress", primary: "ST" },
  { id: "tsune-accel", family: "stress", primary: "ST" },
  { id: "shokugo-sleep", family: "moisture", primary: "SP" },
  { id: "mukumi-stock", family: "moisture", primary: "DAM" },
  { id: "uruoi-busoku", family: "moisture", primary: "JIN" },
  { id: "hiehie", family: "temperature", primary: "YANG" },
  { id: "hotehote", family: "temperature", primary: "YIN" },
  { id: "yagata-switch", family: "temperature", primary: "YIN" },
];

/** 15・16は軸ランキングではなく固有条件で判定する複合タイプ */
export const NAMI_NORI_ID = "nami-nori";
export const KUSE_TSUYOI_ID = "kuse-tsuyoi";

export const THRESHOLDS = {
  /** 15波乗り: 「日によって違う」系の自己申告がこの数以上 */
  VARIABILITY_MIN: 3,
  /** 16クセ強: 4系統のうち上位3系統がすべてこの%以上 */
  KUSE_MIN: 70,
  /** 軸スコアとシグナル充足率の配分。どちらも0-100に正規化してから混ぜる */
  AXIS_W: 0.5,
  SIGNAL_W: 0.5,
} as const;

/**
 * 各タイプのシグナルが、30問中いくつの設問に仕込まれているか。
 * 1設問内に同じタイプのシグナルが複数の選択肢にあっても1とカウントする
 * （同時に選べないため）。シグナル充足率の分母になる。
 */
export const SIGNAL_CAPACITY: Record<string, number> = (() => {
  const cap: Record<string, number> = {};
  for (const q of QUESTIONS) {
    const seen = new Set<string>();
    for (const o of q.options) for (const s of o.signals ?? []) seen.add(s);
    for (const s of seen) cap[s] = (cap[s] ?? 0) + 1;
  }
  return cap;
})();

/**
 * 各軸の理論上の最大生スコア。
 * 1問につき、その軸に最も加点する選択肢の値（main + sub×0.5）を合計する。
 * 設問や配点を変えても自動で追従するので、正規化の基準として使える。
 */
export const MAX_AXIS_SCORES: Record<ScoreAxis, number> = (() => {
  const max = SCORE_AXES.reduce(
    (acc, ax) => ({ ...acc, [ax]: 0 }),
    {} as Record<ScoreAxis, number>
  );
  for (const q of QUESTIONS) {
    for (const ax of SCORE_AXES) {
      let best = 0;
      for (const o of q.options) {
        let v = o.main?.axis === ax ? o.main.v : 0;
        for (const s of o.sub ?? []) if (s.axis === ax) v += s.v * 0.5;
        best = Math.max(best, v);
      }
      max[ax] += best;
    }
  }
  return max;
})();
