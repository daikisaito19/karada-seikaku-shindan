import { QUESTIONS, AXES, type Axis, type OptionKey } from "./questions";

export type Family = "energy" | "stress" | "moisture" | "temperature";
export type AxisScores = Record<Axis, number>;

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
}

export const TYPES: TypeDef[] = [
  { id: "juden-beta", no: 1, name: "充電下手", family: "energy", primary: "QI" },
  { id: "denchi-gire", no: 2, name: "電池切れ", family: "energy", primary: "QI" },
  { id: "slow-start", no: 13, name: "スロースタート", family: "energy", primary: "QI" },
  { id: "meguri-busoku", no: 10, name: "めぐり不足", family: "energy", primary: "BL" },
  { id: "karada-jutai", no: 7, name: "カラダ渋滞", family: "stress", primary: "STA" },
  { id: "ira-ira", no: 8, name: "イライラ充満", family: "stress", primary: "ST" },
  { id: "atama-guruguru", no: 11, name: "頭ぐるぐる", family: "stress", primary: "ST" },
  { id: "tsune-accel", no: 14, name: "常時アクセル", family: "stress", primary: "ST" },
  { id: "shokugo-sleep", no: 3, name: "食後スリープ", family: "moisture", primary: "SP" },
  { id: "mukumi-stock", no: 4, name: "むくみストック", family: "moisture", primary: "DAM" },
  { id: "uruoi-busoku", no: 9, name: "うるおい不足", family: "moisture", primary: "JIN" },
  { id: "hiehie", no: 5, name: "冷え冷え", family: "temperature", primary: "YANG" },
  { id: "hotehote", no: 6, name: "ほてほて", family: "temperature", primary: "YIN" },
  { id: "yagata-switch", no: 12, name: "夜型スイッチ", family: "temperature", primary: "YIN" },
];

export const TYPE_NAME: Record<string, string> = {
  ...Object.fromEntries(TYPES.map((t) => [t.id, t.name])),
  "nami-nori": "波乗りコンディション",
  "kuse-tsuyoi": "クセ強ミックス",
};
export const ALL_IDS = [...TYPES.map((t) => t.id), "nami-nori", "kuse-tsuyoi"];

const empty = (): AxisScores => AXES.reduce((a, x) => ({ ...a, [x]: 0 }), {} as AxisScores);

const MAXA = (() => {
  const m = empty();
  for (const q of QUESTIONS) {
    for (const ax of AXES) {
      let best = 0;
      for (const o of q.options) {
        let v = o.main?.axis === ax ? o.main.v : 0;
        for (const s of o.sub ?? []) if (s.axis === ax) v += s.v * 0.5;
        best = Math.max(best, v);
      }
      m[ax] += best;
    }
  }
  return m;
})();

export function pctAxes(answers: OptionKey[]): AxisScores {
  const raw = empty();
  QUESTIONS.forEach((q, i) => {
    const o = q.options.find((x) => x.key === answers[i]);
    if (!o) return;
    if (o.main) raw[o.main.axis] += o.main.v;
    for (const s of o.sub ?? []) raw[s.axis] += s.v * 0.5;
  });
  const p = empty();
  for (const ax of AXES) p[ax] = MAXA[ax] > 0 ? Math.round((raw[ax] / MAXA[ax]) * 100) : 0;
  return p;
}

export function familyScores(p: AxisScores): Record<Family, number> {
  const f: Record<Family, number> = { energy: 0, stress: 0, moisture: 0, temperature: 0 };
  for (const ax of AXES) f[AXIS_FAMILY[ax]] = Math.max(f[AXIS_FAMILY[ax]], p[ax]);
  return f;
}

export function signalCounts(answers: OptionKey[]): Record<string, number> {
  const c: Record<string, number> = {};
  QUESTIONS.forEach((q, i) => {
    const o = q.options.find((x) => x.key === answers[i]);
    for (const s of o?.signals ?? []) c[s] = (c[s] ?? 0) + 1;
  });
  return c;
}

/** 各タイプが持つシグナル設問の総数 */
export const CAPACITY: Record<string, number> = (() => {
  const cap: Record<string, number> = {};
  for (const q of QUESTIONS) {
    const seen = new Set<string>();
    for (const o of q.options) for (const s of o.signals ?? []) seen.add(s);
    for (const s of seen) cap[s] = (cap[s] ?? 0) + 1;
  }
  return cap;
})();

export function variabilityCount(answers: OptionKey[]): number {
  let n = 0;
  QUESTIONS.forEach((q, i) => {
    if (q.options.find((x) => x.key === answers[i])?.variability) n++;
  });
  return n;
}

export const TH = {
  VARIABILITY_MIN: 3,
  KUSE_MIN: 70,
  /** 軸スコアとシグナル充足率の配分。どちらも0-100に正規化してから混ぜる */
  AXIS_W: 0.5,
  SIGNAL_W: 0.5,
};

export interface Result {
  typeId: string;
  percent: AxisScores;
  reason: string;
  ranking: { id: string; score: number; sig: string }[];
}

export function decide(answers: OptionKey[]): Result {
  const p = pctAxes(answers);
  const f = familyScores(p);
  const sortedF = (Object.entries(f) as [Family, number][]).sort((a, b) => b[1] - a[1]);
  const sc = signalCounts(answers);

  const ranking = TYPES.map((t) => {
    const fired = sc[t.id] ?? 0;
    const cap = CAPACITY[t.id] ?? 1;
    const score = p[t.primary] * TH.AXIS_W + (fired / cap) * 100 * TH.SIGNAL_W;
    return { id: t.id, score, sig: `${fired}/${cap}` };
  }).sort((a, b) => b.score - a.score);

  // 16 クセ強: 上位3系統がすべて閾値以上
  if (sortedF[2][1] >= TH.KUSE_MIN) {
    return {
      typeId: "kuse-tsuyoi",
      percent: p,
      reason: `上位3系統が${TH.KUSE_MIN}%以上 (${sortedF.slice(0, 3).map(([k, v]) => `${k}:${v}`).join(", ")})`,
      ranking,
    };
  }
  // 15 波乗り: 変動シグナルが閾値以上
  const vc = variabilityCount(answers);
  if (vc >= TH.VARIABILITY_MIN) {
    return { typeId: "nami-nori", percent: p, reason: `変動を示す回答が${vc}個`, ranking };
  }

  return {
    typeId: ranking[0].id,
    percent: p,
    reason: `${ranking[0].id} ${ranking[0].score.toFixed(1)}pt (シグナル${ranking[0].sig}) / 2位 ${ranking[1].id} ${ranking[1].score.toFixed(1)}pt`,
    ranking,
  };
}
