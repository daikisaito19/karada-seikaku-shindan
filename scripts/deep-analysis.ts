import { QUESTIONS, type OptionKey, type QuestionOption } from "../src/data/questions";
import { determineType, computeMaxScores } from "../src/data/scoring";
import { RESULT_TYPES } from "../src/data/resultTypes";
import { SCORE_AXES, type ScoreAxis } from "../src/data/scoreAxes";

// v1(8軸・フラット配点)時代の分析スクリプト。scripts/redesign-v4/ に置き換わっている。
// v4で選択肢のスコアが main / sub 構造になったため、その値を読むアダプタを経由させている。
// （ペルソナの重みはv1の設問前提なので、結果の解釈にはredesign-v4のスクリプトを使うこと）
function axisValue(o: QuestionOption, axis: ScoreAxis): number {
  let v = o.main?.axis === axis ? o.main.v : 0;
  for (const s of o.sub ?? []) if (s.axis === axis) v += s.v * 0.5;
  return v;
}

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);

function randomAnswers(): OptionKey[] {
  return QUESTIONS.map(() => KEYS[rand(4)]);
}

// ---------- 1. Uniform-random distribution + dataset for influence analysis ----------
const N1 = 30000;
const dataset: { answers: OptionKey[]; typeId: string }[] = [];
const uniformCounts: Record<string, number> = {};
for (const t of RESULT_TYPES) uniformCounts[t.id] = 0;

for (let i = 0; i < N1; i++) {
  const answers = randomAnswers();
  const type = determineType(answers);
  uniformCounts[type.id]++;
  dataset.push({ answers, typeId: type.id });
}

console.log("\n=== 1. 完全ランダム回答での出現分布 (N=" + N1 + ") ===");
const uniformRows = RESULT_TYPES.map((t) => ({
  no: t.no,
  id: t.id,
  name: t.name,
  count: uniformCounts[t.id],
  pct: ((uniformCounts[t.id] / N1) * 100).toFixed(1) + "%",
}));
uniformRows.sort((a, b) => b.count - a.count);
console.table(uniformRows);

// ---------- 2. Question influence (Cramer's V between each question's answer and final type) ----------
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

console.log("\n=== 2. 各設問の「結果タイプ」への影響度 (Cramer's V, 大きいほど影響大) ===");
const typeIds = dataset.map((d) => d.typeId);
const influenceRows = QUESTIONS.map((q, qi) => {
  const answersForQ = dataset.map((d) => d.answers[qi]);
  const v = cramersV(answersForQ, typeIds);
  return { q: `Q${q.id}`, text: q.text, cramersV: v.toFixed(3) };
});
influenceRows.sort((a, b) => Number(b.cramersV) - Number(a.cramersV));
console.table(influenceRows);

// ---------- 3. Per-axis "single question dominance" (theoretical max share) ----------
console.log("\n=== 3. 各軸で、1問が持つ最大の影響力 (その軸の理論上限に対する割合) ===");
const axisMax = computeMaxScores();
const dominanceRows = SCORE_AXES.map((axis) => {
  let bestQ = "";
  let bestShare = 0;
  for (const q of QUESTIONS) {
    const best = Math.max(0, ...q.options.map((o) => axisValue(o, axis)));
    const share = axisMax[axis] > 0 ? best / axisMax[axis] : 0;
    if (share > bestShare) {
      bestShare = share;
      bestQ = `Q${q.id}`;
    }
  }
  return {
    axis,
    axisMax: axisMax[axis],
    mostDominantQuestion: bestQ,
    maxShareOfAxis: (bestShare * 100).toFixed(1) + "%",
  };
});
console.table(dominanceRows);

// ---------- 4. Persona-biased simulation: does aiming at a type actually land on it? ----------
type AxisWeights = Partial<Record<ScoreAxis, number>>;
interface Persona {
  id: string;
  weights: AxisWeights;
  questionBias?: Record<number, OptionKey>;
  strength: number;
}

const PERSONAS: Persona[] = [
  { id: "juden-beta", weights: { QI: 1, SP: 1 }, strength: 0.65 },
  { id: "denchi-gire", weights: { QI: 1 }, strength: 0.75 },
  { id: "shokugo-sleep", weights: { SP: 1, DAM: 1 }, strength: 0.65 },
  { id: "mukumi-stock", weights: { DAM: 1 }, strength: 0.75 },
  { id: "hiehie", weights: { YANG: 1 }, strength: 0.75 },
  { id: "hotehote", weights: { YIN: 1 }, strength: 0.75 },
  { id: "karada-jutai", weights: { ST: 1, STA: 1 }, strength: 0.65 },
  { id: "ira-ira", weights: { ST: 1 }, strength: 0.75 },
  { id: "uruoi-busoku", weights: { BL: 1, YIN: 1 }, strength: 0.65 },
  { id: "meguri-busoku", weights: { BL: 1, QI: 1 }, strength: 0.65 },
  {
    id: "atama-guruguru",
    weights: { ST: 1, QI: 1 },
    questionBias: { 24: "D" },
    strength: 0.65,
  },
  {
    id: "yagata-switch",
    weights: { YIN: 1 },
    questionBias: { 16: "B" },
    strength: 0.7,
  },
  {
    id: "slow-start",
    weights: { YANG: 1, QI: 1 },
    questionBias: { 1: "C" },
    strength: 0.65,
  },
  {
    id: "tsune-accel",
    weights: { ST: 1 },
    questionBias: { 22: "A" },
    strength: 0.65,
  },
  { id: "nami-nori", weights: {}, strength: 0 },
  {
    id: "kuse-tsuyoi",
    weights: { QI: 1, YANG: 1, YIN: 1, DAM: 1 },
    strength: 0.4,
  },
];

function biasedPick(
  q: (typeof QUESTIONS)[number],
  persona: Persona
): OptionKey {
  if (persona.questionBias?.[q.id] && Math.random() < persona.strength) {
    return persona.questionBias[q.id];
  }
  const scores = q.options.map((o) =>
    Object.entries(persona.weights).reduce(
      (sum, [axis, w]) => sum + axisValue(o, axis as ScoreAxis) * (w ?? 0),
      0
    )
  );
  const maxScore = Math.max(...scores);
  if (maxScore <= 0 || Math.random() >= persona.strength) {
    return KEYS[rand(4)];
  }
  const bestIdx = scores
    .map((s, i) => [s, i] as const)
    .filter(([s]) => s === maxScore)
    .map(([, i]) => i);
  return q.options[bestIdx[rand(bestIdx.length)]].key;
}

console.log(
  "\n=== 4. ペルソナ・シミュレーション：狙ったタイプに実際に着地するか (N=3000/タイプ) ==="
);
const N2 = 3000;
const confusion: { intended: string; results: Record<string, number> }[] = [];
for (const persona of PERSONAS) {
  const counts: Record<string, number> = {};
  for (let i = 0; i < N2; i++) {
    const answers = QUESTIONS.map((q) => biasedPick(q, persona));
    const type = determineType(answers);
    counts[type.id] = (counts[type.id] ?? 0) + 1;
  }
  confusion.push({ intended: persona.id, results: counts });
}

const confusionRows = confusion.map(({ intended, results }) => {
  const sorted = Object.entries(results).sort((a, b) => b[1] - a[1]);
  const selfCount = results[intended] ?? 0;
  const top = sorted.slice(0, 3).map(
    ([id, c]) => `${id}:${((c / N2) * 100).toFixed(0)}%`
  );
  return {
    intendedType: intended,
    hitRate: ((selfCount / N2) * 100).toFixed(1) + "%",
    top3Actual: top.join(", "),
  };
});
console.table(confusionRows);

// ---------- 5. Stability test: small answer changes shouldn't flip the type wildly ----------
console.log(
  "\n=== 5. 安定性テスト：「その人らしい」回答から一部だけ変えたときの型の揺れ ==="
);
function canonicalAnswers(persona: Persona): OptionKey[] {
  return QUESTIONS.map((q) => {
    if (persona.questionBias?.[q.id]) return persona.questionBias[q.id];
    const scores = q.options.map((o) =>
      Object.entries(persona.weights).reduce(
        (sum, [axis, w]) => sum + axisValue(o, axis as ScoreAxis) * (w ?? 0),
        0
      )
    );
    const maxScore = Math.max(...scores);
    if (maxScore <= 0) return q.options[0].key;
    return q.options.find((_, i) => scores[i] === maxScore)!.key;
  });
}

const stabilityRows: {
  type: string;
  baseType: string;
  k1: string;
  k3: string;
  k5: string;
}[] = [];

for (const persona of PERSONAS) {
  if (persona.id === "nami-nori" || persona.id === "kuse-tsuyoi") continue;
  const base = canonicalAnswers(persona);
  const baseType = determineType(base).id;
  const trial = (k: number, reps: number) => {
    let same = 0;
    for (let i = 0; i < reps; i++) {
      const perturbed = [...base];
      const idxs = new Set<number>();
      while (idxs.size < k) idxs.add(rand(QUESTIONS.length));
      for (const idx of idxs) perturbed[idx] = KEYS[rand(4)];
      if (determineType(perturbed).id === baseType) same++;
    }
    return ((same / reps) * 100).toFixed(0) + "%";
  };
  stabilityRows.push({
    type: persona.id,
    baseType,
    k1: trial(1, 500),
    k3: trial(3, 500),
    k5: trial(5, 500),
  });
}
console.table(stabilityRows);

console.log("\n=== 完了 ===");
