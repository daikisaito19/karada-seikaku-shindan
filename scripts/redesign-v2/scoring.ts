import { QUESTIONS } from "./questions";
import { SCORE_AXES, type ScoreAxis } from "../../src/data/scoreAxes";
import {
  TYPE_DEFS,
  NAMI_NORI_MARGIN,
  NAMI_NORI_CEILING_VARIABLE,
  NAMI_NORI_CEILING_STABLE,
  isMoodSwingSignal,
  type AxisPercents,
  type AnswerArray,
} from "./typeDefs";

function emptyAxisScores(): AxisPercents {
  return SCORE_AXES.reduce((acc, axis) => {
    acc[axis] = 0;
    return acc;
  }, {} as AxisPercents);
}

export function computeMaxScores(): AxisPercents {
  const max = emptyAxisScores();
  for (const q of QUESTIONS) {
    for (const axis of SCORE_AXES) {
      const best = Math.max(0, ...q.options.map((o) => o.scores[axis] ?? 0));
      max[axis] += best;
    }
  }
  return max;
}

const AXIS_MAX = computeMaxScores();

export function computeRawScores(answers: AnswerArray): AxisPercents {
  const raw = emptyAxisScores();
  QUESTIONS.forEach((q, i) => {
    const picked = answers[i];
    const option = q.options.find((o) => o.key === picked);
    if (!option) return;
    for (const axis of SCORE_AXES) {
      raw[axis] += option.scores[axis] ?? 0;
    }
  });
  return raw;
}

export function computePercentScores(answers: AnswerArray): AxisPercents {
  const raw = computeRawScores(answers);
  const percent = emptyAxisScores();
  for (const axis of SCORE_AXES) {
    percent[axis] = AXIS_MAX[axis] > 0 ? Math.round((raw[axis] / AXIS_MAX[axis]) * 100) : 0;
  }
  return percent;
}

function matchScore(typeId: string, p: AxisPercents, answers: AnswerArray): number {
  const def = TYPE_DEFS.find((t) => t.id === typeId)!;
  let score = 0;
  const defaultWeight = 1.0 / def.primary.length;
  for (const axis of def.primary) {
    score += p[axis] * (def.primaryWeights?.[axis] ?? defaultWeight);
  }
  if (def.secondary?.length) {
    const secondaryWeight = 0.4 / def.secondary.length;
    for (const axis of def.secondary) score += p[axis] * secondaryWeight;
  }
  if (def.modifier) score += def.modifier(p);
  if (def.questionBonuses) {
    for (const qb of def.questionBonuses) {
      const picked = answers[qb.questionId - 1];
      if (qb.keys.includes(picked)) score += qb.bonus;
    }
  }
  return score;
}

export interface DetermineResult {
  typeId: string;
  percent: AxisPercents;
  scores: { id: string; score: number; gatePassed: boolean }[];
}

export function determineType(answers: AnswerArray): DetermineResult {
  const p = computePercentScores(answers);
  const scores = TYPE_DEFS.map((def) => ({
    id: def.id,
    score: matchScore(def.id, p, answers),
    gatePassed: def.gate(p, answers),
  }));

  const candidates = scores.filter((s) => s.gatePassed).sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return { typeId: "kuse-tsuyoi", percent: p, scores };
  }

  const top = candidates[0];
  const second = candidates[1];
  // 僅差 かつ トップ自体もそこまで強くない場合だけ「波乗り」に回す。
  // トップが明確に強ければ、2位が多少肉薄していても波乗りには逃がさない。
  // 上限は「体調の波は？」への自己申告(Q26)で調整する。
  const ceiling = isMoodSwingSignal(answers) ? NAMI_NORI_CEILING_VARIABLE : NAMI_NORI_CEILING_STABLE;
  if (second && top.score - second.score < NAMI_NORI_MARGIN && top.score < ceiling) {
    return { typeId: "nami-nori", percent: p, scores };
  }

  return { typeId: top.id, percent: p, scores };
}
