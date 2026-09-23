import { QUESTIONS, type OptionKey } from "./questions";
import { determineType, computeMaxScores } from "./scoring";
import { TYPE_DEFS } from "./typeDefs";
import { SCORE_AXES, type ScoreAxis } from "../../src/data/scoreAxes";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const randomAnswers = () => QUESTIONS.map(() => KEYS[rand(4)]);

const ALL_TYPE_IDS = [...TYPE_DEFS.map((t) => t.id), "nami-nori", "kuse-tsuyoi"];
const ALL_TYPE_NAMES: Record<string, string> = {
  ...Object.fromEntries(TYPE_DEFS.map((t) => [t.id, t.name])),
  "nami-nori": "波乗りコンディション",
  "kuse-tsuyoi": "クセ強ミックス",
};

// ---------- ① + ② + ③ 大規模ランダムシミュレーションでの出現率 ----------
const N1 = 60000;
const dataset: { answers: OptionKey[]; typeId: string }[] = [];
const counts: Record<string, number> = Object.fromEntries(ALL_TYPE_IDS.map((id) => [id, 0]));

for (let i = 0; i < N1; i++) {
  const answers = randomAnswers();
  const { typeId } = determineType(answers);
  counts[typeId]++;
  dataset.push({ answers, typeId });
}

console.log(`\n=== ①②③ 完全ランダム回答での出現分布 (N=${N1}) ===`);
const distRows = ALL_TYPE_IDS.map((id) => ({
  id,
  name: ALL_TYPE_NAMES[id],
  count: counts[id],
  pct: ((counts[id] / N1) * 100).toFixed(2) + "%",
}));
distRows.sort((a, b) => b.count - a.count);
console.table(distRows);
const pcts = distRows.map((r) => counts[r.id] / N1);
console.log(
  `最高出現率: ${(Math.max(...pcts) * 100).toFixed(2)}% / 最低出現率: ${(Math.min(...pcts) * 100).toFixed(2)}%`
);

// ---------- ④ 各設問の影響度 (Cramer's V) ----------
function cramersV(rows: string[], cols: string[]): number {
  const rowVals = Array.from(new Set(rows));
  const colVals = Array.from(new Set(cols));
  const r = rowVals.length;
  const c = colVals.length;
  const n = rows.length;
  const table: number[][] = Array.from({ length: r }, () => Array(c).fill(0));
  const rowTotal = Array(r).fill(0);
  const colTotal = Array(c).fill(0);
  for (let i = 0; i < n; i++) {
    const ri = rowVals.indexOf(rows[i]);
    const ci = colVals.indexOf(cols[i]);
    table[ri][ci]++;
    rowTotal[ri]++;
    colTotal[ci]++;
  }
  let chi2 = 0;
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      const expected = (rowTotal[i] * colTotal[j]) / n;
      if (expected > 0) chi2 += (table[i][j] - expected) ** 2 / expected;
    }
  }
  const k = Math.min(r - 1, c - 1);
  return k > 0 ? Math.sqrt(chi2 / (n * k)) : 0;
}

console.log("\n=== ④ 各設問の「結果タイプ」への影響度 (Cramer's V) ===");
const typeIdsArr = dataset.map((d) => d.typeId);
const influenceRows = QUESTIONS.map((q, qi) => {
  const answersForQ = dataset.map((d) => d.answers[qi]);
  const v = cramersV(answersForQ, typeIdsArr);
  return { q: `Q${q.id}`, text: q.text, cramersV: Number(v.toFixed(3)) };
});
influenceRows.sort((a, b) => b.cramersV - a.cramersV);
console.table(influenceRows);

// ---------- ⑤ 各軸の質問数・最大寄与率 ----------
console.log("\n=== ⑤ 各軸の質問数・理論最大値・1問の最大寄与率 ===");
const axisMax = computeMaxScores();
const dominanceRows = SCORE_AXES.map((axis) => {
  let bestQ = "";
  let bestShare = 0;
  let contributingQuestions = 0;
  for (const q of QUESTIONS) {
    const best = Math.max(0, ...q.options.map((o) => o.scores[axis] ?? 0));
    if (best > 0) contributingQuestions++;
    const share = axisMax[axis] > 0 ? best / axisMax[axis] : 0;
    if (share > bestShare) {
      bestShare = share;
      bestQ = `Q${q.id}`;
    }
  }
  return {
    axis,
    contributingQuestions,
    axisMax: axisMax[axis],
    mostDominantQuestion: bestQ,
    maxShareOfAxis: (bestShare * 100).toFixed(1) + "%",
  };
});
console.table(dominanceRows);

// ---------- ⑥ ペルソナ・シミュレーション：狙ったタイプに着地するか ----------
interface Persona {
  id: string;
  weights: Partial<Record<ScoreAxis, number>>;
  questionBias?: Record<number, OptionKey>;
  strength: number;
}

const PERSONAS: Persona[] = [
  { id: "juden-beta", weights: { QI: 1, SP: 1 }, strength: 0.7 },
  { id: "denchi-gire", weights: { QI: 1 }, questionBias: { 29: "B" }, strength: 0.75 },
  { id: "shokugo-sleep", weights: { SP: 1, DAM: 1 }, questionBias: { 2: "B" }, strength: 0.7 },
  { id: "mukumi-stock", weights: { DAM: 1 }, questionBias: { 27: "C" }, strength: 0.75 },
  { id: "hiehie", weights: { YANG: 1 }, strength: 0.75 },
  { id: "hotehote", weights: { YIN: 1 }, questionBias: { 6: "C" }, strength: 0.7 },
  { id: "karada-jutai", weights: { ST: 1, STA: 1 }, strength: 0.7 },
  { id: "ira-ira", weights: { ST: 1 }, questionBias: { 7: "C" }, strength: 0.75 },
  { id: "uruoi-busoku", weights: { BL: 1, YIN: 1 }, strength: 0.7 },
  { id: "meguri-busoku", weights: { BL: 1, QI: 1 }, questionBias: { 15: "C" }, strength: 0.7 },
  { id: "atama-guruguru", weights: { ST: 1, QI: 1 }, questionBias: { 24: "D" }, strength: 0.7 },
  { id: "yagata-switch", weights: { YIN: 1 }, questionBias: { 16: "B" }, strength: 0.75 },
  { id: "slow-start", weights: { YANG: 1, QI: 1 }, questionBias: { 29: "C" }, strength: 0.7 },
  { id: "tsune-accel", weights: { ST: 1 }, questionBias: { 22: "A" }, strength: 0.7 },
];

function biasedPick(q: (typeof QUESTIONS)[number], persona: Persona): OptionKey {
  if (persona.questionBias?.[q.id] && Math.random() < persona.strength) {
    return persona.questionBias[q.id];
  }
  const scores = q.options.map((o) =>
    Object.entries(persona.weights).reduce(
      (sum, [axis, w]) => sum + (o.scores[axis as ScoreAxis] ?? 0) * (w ?? 0),
      0
    )
  );
  const maxScore = Math.max(...scores);
  if (maxScore <= 0 || Math.random() >= persona.strength) return KEYS[rand(4)];
  const bestIdx = scores
    .map((s, i) => [s, i] as const)
    .filter(([s]) => s === maxScore)
    .map(([, i]) => i);
  return q.options[bestIdx[rand(bestIdx.length)]].key;
}

console.log("\n=== ⑥ ペルソナ・シミュレーション：狙ったタイプに実際に着地するか (N=4000/タイプ) ===");
const N2 = 4000;
const confusionRows = PERSONAS.map((persona) => {
  const counts: Record<string, number> = {};
  for (let i = 0; i < N2; i++) {
    const answers = QUESTIONS.map((q) => biasedPick(q, persona));
    const { typeId } = determineType(answers);
    counts[typeId] = (counts[typeId] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const selfCount = counts[persona.id] ?? 0;
  const top3 = sorted.slice(0, 3).map(([id, c]) => `${id}:${((c / N2) * 100).toFixed(0)}%`);
  return {
    intendedType: persona.id,
    hitRate: ((selfCount / N2) * 100).toFixed(1) + "%",
    top3Actual: top3.join(", "),
  };
});
console.table(confusionRows);

// ---------- ⑦ 安定性テスト ----------
console.log("\n=== ⑦ 安定性テスト：理想回答から1〜5問変えたときの型の揺れ ===");
function canonicalAnswers(persona: Persona): OptionKey[] {
  return QUESTIONS.map((q) => {
    if (persona.questionBias?.[q.id]) return persona.questionBias[q.id];
    const scores = q.options.map((o) =>
      Object.entries(persona.weights).reduce(
        (sum, [axis, w]) => sum + (o.scores[axis as ScoreAxis] ?? 0) * (w ?? 0),
        0
      )
    );
    const maxScore = Math.max(...scores);
    // 無関係な設問(スコア全員0)はA固定でなくランダムに選ぶ。実際のユーザーは
    // 「先頭の選択肢を選びがち」なわけではないので、それをテストの前提にしない。
    if (maxScore <= 0) return KEYS[rand(4)];
    const tied = scores
      .map((s, i) => [s, i] as const)
      .filter(([s]) => s === maxScore)
      .map(([, i]) => i);
    return q.options[tied[rand(tied.length)]].key;
  });
}

const stabilityRows = PERSONAS.map((persona) => {
  const base = canonicalAnswers(persona);
  const baseType = determineType(base).typeId;
  const trial = (k: number, reps: number) => {
    let same = 0;
    for (let i = 0; i < reps; i++) {
      const perturbed = [...base];
      const idxs = new Set<number>();
      while (idxs.size < k) idxs.add(rand(QUESTIONS.length));
      for (const idx of idxs) perturbed[idx] = KEYS[rand(4)];
      if (determineType(perturbed).typeId === baseType) same++;
    }
    return ((same / reps) * 100).toFixed(0) + "%";
  };
  return {
    persona: persona.id,
    baseType,
    matchesIntended: baseType === persona.id ? "OK" : "NG",
    k1: trial(1, 600),
    k3: trial(3, 600),
    k5: trial(5, 600),
  };
});
console.table(stabilityRows);

console.log("\n=== 完了 ===");
