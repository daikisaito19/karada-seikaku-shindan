import { QUESTIONS, type OptionKey } from "./questions";
import { SCORE_AXES, type ScoreAxis } from "./scoreAxes";
import { RESULT_TYPES, type ResultType } from "./resultTypes";
import {
  AXIS_FAMILY,
  KUSE_TSUYOI_ID,
  MAX_AXIS_SCORES,
  NAMI_NORI_ID,
  SCORED_TYPES,
  SIGNAL_CAPACITY,
  THRESHOLDS,
  type Family,
} from "./typeDefs";

export type Answers = OptionKey[]; // 長さ = QUESTIONS.length, 1問目から順番

export type AxisScores = Record<ScoreAxis, number>;

function emptyAxisScores(): AxisScores {
  return SCORE_AXES.reduce((acc, axis) => {
    acc[axis] = 0;
    return acc;
  }, {} as AxisScores);
}

/** 各軸ごとの理論上の最大生スコア（正規化の基準）。 */
export function computeMaxScores(): AxisScores {
  return { ...MAX_AXIS_SCORES };
}

export function computeRawScores(answers: Answers): AxisScores {
  const raw = emptyAxisScores();
  QUESTIONS.forEach((q, i) => {
    const option = q.options.find((o) => o.key === answers[i]);
    if (!option) return;
    if (option.main) raw[option.main.axis] += option.main.v;
    for (const s of option.sub ?? []) raw[s.axis] += s.v * 0.5;
  });
  return raw;
}

/** 0〜100の百分率に正規化した軸スコア。軸間の比較・閾値判定にはこちらを使う。 */
export function computePercentScores(answers: Answers): AxisScores {
  const max = MAX_AXIS_SCORES;
  const raw = computeRawScores(answers);
  const percent = emptyAxisScores();
  for (const axis of SCORE_AXES) {
    percent[axis] = max[axis] > 0 ? Math.round((raw[axis] / max[axis]) * 100) : 0;
  }
  return percent;
}

/**
 * 4系統のスコア。系統内で最も高い軸の値をその系統の値とする。
 * 16クセ強ミックスの判定に使う。
 */
export function familyScores(percent: AxisScores): Record<Family, number> {
  const f: Record<Family, number> = { energy: 0, stress: 0, moisture: 0, temperature: 0 };
  for (const axis of SCORE_AXES) {
    const fam = AXIS_FAMILY[axis];
    f[fam] = Math.max(f[fam], percent[axis]);
  }
  return f;
}

/** タイプ固有シグナルが何問で発火したか */
export function signalCounts(answers: Answers): Record<string, number> {
  const counts: Record<string, number> = {};
  QUESTIONS.forEach((q, i) => {
    const option = q.options.find((o) => o.key === answers[i]);
    for (const s of option?.signals ?? []) counts[s] = (counts[s] ?? 0) + 1;
  });
  return counts;
}

/** 「日によって違う」系の回答数。15波乗りコンディションの判定に使う（軸は一切見ない）。 */
export function variabilityCount(answers: Answers): number {
  let n = 0;
  QUESTIONS.forEach((q, i) => {
    if (q.options.find((o) => o.key === answers[i])?.variability) n++;
  });
  return n;
}

export interface TypeScore {
  id: string;
  /** 0-100。軸スコアとシグナル充足率を半分ずつ混ぜた値 */
  score: number;
  /** 発火したシグナル数 / そのタイプのシグナル設問数 */
  signal: string;
}

/**
 * 14タイプのスコアランキング。
 * 軸%とシグナル充足率をどちらも0-100に正規化してから混ぜているので、
 * 理論最大値の異なる軸同士でも比較できる。
 */
export function rankTypes(answers: Answers, percent: AxisScores): TypeScore[] {
  const counts = signalCounts(answers);
  return SCORED_TYPES.map((t) => {
    const fired = counts[t.id] ?? 0;
    const cap = SIGNAL_CAPACITY[t.id] ?? 1;
    const score =
      percent[t.primary] * THRESHOLDS.AXIS_W + (fired / cap) * 100 * THRESHOLDS.SIGNAL_W;
    return { id: t.id, score, signal: `${fired}/${cap}` };
  }).sort((a, b) => b.score - a.score);
}

export interface VisibleAxes {
  energy: number; // 🪫 LOW ←→ 🔋 HIGH
  flow: number; // 🚦 STUCK ←→ 🌪️ FLOW
  temperature: number; // 🧊 COOL ←→ 🔥 HOT
  moisture: number; // 🏜️ DRY ←→ 💧 WET
}

/**
 * 内部9軸を、ユーザーに見せる4軸メーターに変換する。
 * 気虚(QI)などの「不足」系スコアは値が高いほど不調寄りなので、表示軸では反転させている。
 *
 * うるおいは BL(材料不足) と JIN(うるおい不足) の平均を反転させる。
 * 旧8軸では JIN がなく YIN を使っていたため、
 * 「熱がこもっている人」が乾燥側に、「乾燥している人」が潤っている側に表示されていた。
 * YIN は温度メーター専任とし、うるおいメーターには使わない。
 */
export function computeVisibleAxes(percent: AxisScores): VisibleAxes {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  return {
    energy: clamp(100 - percent.QI),
    flow: clamp(100 - (percent.ST + percent.STA) / 2),
    temperature: clamp(50 + (percent.YIN - percent.YANG) / 2),
    moisture: clamp(100 - (percent.BL + percent.JIN) / 2),
  };
}

const byId = (id: string) => RESULT_TYPES.find((t) => t.id === id)!;

/**
 * タイプ判定。
 *
 * 1. 16クセ強ミックス — 上位3系統がすべて閾値以上（「全部強い」という積極的な条件）
 * 2. 15波乗りコンディション — 変動を示す自己申告が閾値個以上（軸は一切見ない）
 * 3. それ以外 — 14タイプのスコアランキングの1位
 *
 * どのタイプも「条件に漏れた結果」ではなく、自分の条件を満たして選ばれる。
 * 最後に無条件で返すフォールバックは存在しない。
 */
export function determineType(answers: Answers): ResultType {
  return byId(judge(answers).typeId);
}

export interface Judgement {
  typeId: string;
  percent: AxisScores;
  family: Record<Family, number>;
  ranking: TypeScore[];
  /** どの条件で決まったかの説明（デバッグ・検証用） */
  reason: string;
}

export function judge(answers: Answers): Judgement {
  const percent = computePercentScores(answers);
  const family = familyScores(percent);
  const ranking = rankTypes(answers, percent);

  const sortedFamilies = (Object.entries(family) as [Family, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  // 16 クセ強ミックス: 上位3系統がすべて閾値以上
  if (sortedFamilies[2][1] >= THRESHOLDS.KUSE_MIN) {
    return {
      typeId: KUSE_TSUYOI_ID,
      percent,
      family,
      ranking,
      reason: `上位3系統が${THRESHOLDS.KUSE_MIN}%以上 (${sortedFamilies
        .slice(0, 3)
        .map(([k, v]) => `${k}:${v}`)
        .join(", ")})`,
    };
  }

  // 15 波乗りコンディション: 変動シグナルが閾値以上
  const vc = variabilityCount(answers);
  if (vc >= THRESHOLDS.VARIABILITY_MIN) {
    return {
      typeId: NAMI_NORI_ID,
      percent,
      family,
      ranking,
      reason: `変動を示す回答が${vc}個`,
    };
  }

  return {
    typeId: ranking[0].id,
    percent,
    family,
    ranking,
    reason: `${ranking[0].id} ${ranking[0].score.toFixed(1)}pt (シグナル${
      ranking[0].signal
    }) / 2位 ${ranking[1].id} ${ranking[1].score.toFixed(1)}pt`,
  };
}

export interface DiagnosisResult {
  type: ResultType;
  percent: AxisScores;
  visible: VisibleAxes;
  ranking: TypeScore[];
  reason: string;
}

export function evaluateAnswers(answers: Answers): DiagnosisResult {
  const j = judge(answers);
  return {
    type: byId(j.typeId),
    percent: j.percent,
    visible: computeVisibleAxes(j.percent),
    ranking: j.ranking,
    reason: j.reason,
  };
}

/** 30問の回答を "ABCD..." のような文字列にエンコードし、結果ページを自己完結なURLで共有できるようにする */
export function encodeAnswers(answers: Answers): string {
  return answers.join("");
}

export function decodeAnswers(raw: string | undefined | null): Answers | null {
  if (!raw) return null;
  if (raw.length !== QUESTIONS.length) return null;
  const chars = raw.split("") as OptionKey[];
  if (!chars.every((c) => ["A", "B", "C", "D"].includes(c))) return null;
  return chars;
}
