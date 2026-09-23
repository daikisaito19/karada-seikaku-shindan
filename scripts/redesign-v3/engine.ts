import { QUESTIONS, AXES, type Axis, type OptionKey } from "./questions";

export type Family = "energy" | "stress" | "moisture" | "temperature";
export type AxisScores = Record<Axis, number>;

/** 軸の系統への割り当て。どの軸も1つの系統にしか属さない。 */
export const AXIS_FAMILY: Record<Axis, Family> = {
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
  id: string;
  no: number;
  name: string;
  family: Family;
  primary: Axis;
  /** 案Aで、系統識別シグナルがどの選択肢に対応するか */
  discriminatorKey?: OptionKey;
}

export const TYPES: TypeDef[] = [
  { id: "juden-beta", no: 1, name: "充電下手", family: "energy", primary: "QI", discriminatorKey: "B" },
  { id: "denchi-gire", no: 2, name: "電池切れ", family: "energy", primary: "QI", discriminatorKey: "C" },
  { id: "slow-start", no: 13, name: "スロースタート", family: "energy", primary: "QI", discriminatorKey: "A" },
  { id: "meguri-busoku", no: 10, name: "めぐり不足", family: "energy", primary: "BL", discriminatorKey: "D" },
  { id: "karada-jutai", no: 7, name: "カラダ渋滞", family: "stress", primary: "STA", discriminatorKey: "A" },
  { id: "ira-ira", no: 8, name: "イライラ充満", family: "stress", primary: "ST", discriminatorKey: "B" },
  { id: "atama-guruguru", no: 11, name: "頭ぐるぐる", family: "stress", primary: "ST", discriminatorKey: "C" },
  { id: "tsune-accel", no: 14, name: "常時アクセル", family: "stress", primary: "ST", discriminatorKey: "D" },
  { id: "shokugo-sleep", no: 3, name: "食後スリープ", family: "moisture", primary: "SP", discriminatorKey: "A" },
  { id: "mukumi-stock", no: 4, name: "むくみストック", family: "moisture", primary: "DAM", discriminatorKey: "B" },
  { id: "uruoi-busoku", no: 9, name: "うるおい不足", family: "moisture", primary: "JIN", discriminatorKey: "C" },
  { id: "hiehie", no: 5, name: "冷え冷え", family: "temperature", primary: "YANG", discriminatorKey: "A" },
  { id: "hotehote", no: 6, name: "ほてほて", family: "temperature", primary: "YIN", discriminatorKey: "B" },
  { id: "yagata-switch", no: 12, name: "夜型スイッチ", family: "temperature", primary: "YIN", discriminatorKey: "C" },
];

export const TYPE_NAME: Record<string, string> = {
  ...Object.fromEntries(TYPES.map((t) => [t.id, t.name])),
  "nami-nori": "波乗りコンディション",
  "kuse-tsuyoi": "クセ強ミックス",
};
export const ALL_TYPE_IDS = [...TYPES.map((t) => t.id), "nami-nori", "kuse-tsuyoi"];

// ---------------------------------------------------------------- 軸スコア

/** スコアリング方式。④の比較用。 */
export type ScoringMode = "main-only" | "main-plus-sub" | "weighted";

function emptyAxes(): AxisScores {
  return AXES.reduce((a, ax) => ({ ...a, [ax]: 0 }), {} as AxisScores);
}

export function maxAxes(mode: ScoringMode): AxisScores {
  const max = emptyAxes();
  for (const q of QUESTIONS) {
    for (const ax of AXES) {
      let best = 0;
      for (const o of q.options) {
        let v = o.main?.axis === ax ? o.main.v : 0;
        if (mode !== "main-only" && o.sub) {
          for (const s of o.sub) {
            if (s.axis !== ax) continue;
            v += mode === "weighted" ? s.v * 0.5 : s.v;
          }
        }
        best = Math.max(best, v);
      }
      max[ax] += best;
    }
  }
  return max;
}

export function rawAxes(answers: OptionKey[], mode: ScoringMode): AxisScores {
  const raw = emptyAxes();
  QUESTIONS.forEach((q, i) => {
    const o = q.options.find((x) => x.key === answers[i]);
    if (!o) return;
    if (o.main) raw[o.main.axis] += o.main.v;
    if (mode !== "main-only" && o.sub) {
      for (const s of o.sub) raw[s.axis] += mode === "weighted" ? s.v * 0.5 : s.v;
    }
  });
  return raw;
}

export function pctAxes(answers: OptionKey[], mode: ScoringMode = "weighted"): AxisScores {
  const raw = rawAxes(answers, mode);
  const max = maxAxes(mode);
  const p = emptyAxes();
  for (const ax of AXES) p[ax] = max[ax] > 0 ? Math.round((raw[ax] / max[ax]) * 100) : 0;
  return p;
}

export function familyScores(p: AxisScores): Record<Family, number> {
  const f: Record<Family, number> = { energy: 0, stress: 0, moisture: 0, temperature: 0 };
  for (const ax of AXES) f[AXIS_FAMILY[ax]] = Math.max(f[AXIS_FAMILY[ax]], p[ax]);
  return f;
}

// ---------------------------------------------------------------- シグナル

/** 各タイプのシグナルが、何個発火したか */
export function signalCounts(answers: OptionKey[]): Record<string, number> {
  const c: Record<string, number> = {};
  QUESTIONS.forEach((q, i) => {
    const o = q.options.find((x) => x.key === answers[i]);
    if (!o?.signals) return;
    for (const s of o.signals) c[s] = (c[s] ?? 0) + 1;
  });
  return c;
}

/** そのタイプが持つシグナルの総数(発火しうる最大数) */
export function signalCapacity(): Record<string, number> {
  const cap: Record<string, number> = {};
  for (const q of QUESTIONS) {
    const seen = new Set<string>();
    for (const o of q.options) for (const s of o.signals ?? []) seen.add(s);
    for (const s of seen) cap[s] = (cap[s] ?? 0) + 1; // 1設問につき最大1回
  }
  return cap;
}

/** 「日によって変わる」回答の数 */
export function variabilityCount(answers: OptionKey[]): number {
  let n = 0;
  QUESTIONS.forEach((q, i) => {
    const o = q.options.find((x) => x.key === answers[i]);
    if (o?.variability) n++;
  });
  return n;
}

// ---------------------------------------------------------------- 閾値

export const TH = {
  /** 波乗り: 変動シグナルがこの数以上 */
  VARIABILITY_MIN: 3,
  /** クセ強: 上位3系統がこの値以上 */
  KUSE_MIN: 55,
  /** クセ強: 発火シグナルの種類がこの数以上のタイプが3つ以上 */
  KUSE_SIGNAL_MIN: 2,
};

// ---------------------------------------------------------------- 共通の複合判定

/**
 * 15/16 の判定。いずれも「積極的な条件」で成立させる。
 * 波乗り: 変動を示す回答が複数ある (スコアの近さは使わない)
 * クセ強: 3系統以上が同時に強い
 */
function compositeCheck(
  answers: OptionKey[],
  p: AxisScores
): { typeId: string; reason: string } | null {
  const f = familyScores(p);
  const sorted = (Object.entries(f) as [Family, number][]).sort((a, b) => b[1] - a[1]);

  if (sorted[2][1] >= TH.KUSE_MIN) {
    return {
      typeId: "kuse-tsuyoi",
      reason: `上位3系統がすべて${TH.KUSE_MIN}%以上 (${sorted
        .slice(0, 3)
        .map(([k, v]) => `${k}:${v}`)
        .join(", ")})`,
    };
  }

  const vc = variabilityCount(answers);
  if (vc >= TH.VARIABILITY_MIN) {
    return { typeId: "nami-nori", reason: `変動を示す回答が${vc}個` };
  }

  return null;
}

// ---------------------------------------------------------------- 案A

/** 案A: 系統を決め、その系統の識別シグナル設問1問でタイプを決める */
export function decideA(answers: OptionKey[], mode: ScoringMode = "weighted") {
  const p = pctAxes(answers, mode);
  const comp = compositeCheck(answers, p);
  if (comp) return { ...comp, percent: p, method: "A" };

  const f = familyScores(p);
  const top = (Object.entries(f) as [Family, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const dq = QUESTIONS.findIndex((q) => q.discriminatorFor === top);
  const key = answers[dq];
  const hit = TYPES.find((t) => t.family === top && t.discriminatorKey === key);
  if (hit) return { typeId: hit.id, reason: `系統=${top} / Q${QUESTIONS[dq].id}=${key}`, percent: p, method: "A" };

  // 識別シグナルが「とくにない」→ 系統内で主軸が最も高いタイプ
  const fallback = TYPES.filter((t) => t.family === top).sort((a, b) => p[b.primary] - p[a.primary])[0];
  return { typeId: fallback.id, reason: `系統=${top} / シグナル無し→主軸最大`, percent: p, method: "A" };
}

// ---------------------------------------------------------------- 案B

/** 案B: 系統を決め、その系統内で「発火したシグナル数」が最多のタイプを選ぶ */
export function decideB(answers: OptionKey[], mode: ScoringMode = "weighted") {
  const p = pctAxes(answers, mode);
  const comp = compositeCheck(answers, p);
  if (comp) return { ...comp, percent: p, method: "B" };

  const f = familyScores(p);
  const top = (Object.entries(f) as [Family, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const sc = signalCounts(answers);
  const cands = TYPES.filter((t) => t.family === top).sort((a, b) => {
    const d = (sc[b.id] ?? 0) - (sc[a.id] ?? 0);
    return d !== 0 ? d : p[b.primary] - p[a.primary];
  });
  const winner = cands[0];
  return {
    typeId: winner.id,
    reason: `系統=${top} / シグナル${sc[winner.id] ?? 0}個 (${cands
      .map((c) => `${c.id}:${sc[c.id] ?? 0}`)
      .join(", ")})`,
    percent: p,
    method: "B",
  };
}

// ---------------------------------------------------------------- 案C

/** 案C: 系統で絞らず、軸スコアとシグナル数の合算で16タイプから直接選ぶ */
export const C_WEIGHT = { axis: 1.0, signal: 12 };

export function decideC(answers: OptionKey[], mode: ScoringMode = "weighted") {
  const p = pctAxes(answers, mode);
  const comp = compositeCheck(answers, p);
  if (comp) return { ...comp, percent: p, method: "C" };

  const sc = signalCounts(answers);
  const scored = TYPES.map((t) => ({
    id: t.id,
    score: p[t.primary] * C_WEIGHT.axis + (sc[t.id] ?? 0) * C_WEIGHT.signal,
  })).sort((a, b) => b.score - a.score);
  return {
    typeId: scored[0].id,
    reason: `総合スコア ${scored[0].score.toFixed(1)} (2位 ${scored[1].id}:${scored[1].score.toFixed(1)})`,
    percent: p,
    method: "C",
  };
}

export const ENGINES = { A: decideA, B: decideB, C: decideC } as const;
export type EngineKey = keyof typeof ENGINES;
