import { QUESTIONS, type OptionKey } from "./questions";
import { determineType, computePercentScores, computeMaxScores } from "./scoring";
import { TYPE_DEFS } from "./typeDefs";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const randomAnswers = () => QUESTIONS.map(() => KEYS[rand(4)]);

const shokugoDef = TYPE_DEFS.find((t) => t.id === "shokugo-sleep")!;

// ---------- 1. Q2を固定し、残り29問をランダムにしたときの分布 ----------
function distWithQ2Fixed(fixed: OptionKey | null, n: number) {
  const counts: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const a = randomAnswers();
    if (fixed) a[1] = fixed; // Q2 = index 1
    const { typeId } = determineType(a);
    counts[typeId] = (counts[typeId] ?? 0) + 1;
  }
  return counts;
}

const N = 10000;
console.log(`\n=== 1a. Q2="B"(かなり眠くなる)固定 + 残り29問ランダム (N=${N}) ===`);
const distB = distWithQ2Fixed("B", N);
console.table(
  Object.entries(distB)
    .sort((a, b) => b[1] - a[1])
    .map(([id, c]) => ({ id, pct: ((c / N) * 100).toFixed(1) + "%" }))
);

console.log(`\n=== 1b. Q2="C"(お腹が重い)固定 + 残り29問ランダム (N=${N}) ===`);
const distC = distWithQ2Fixed("C", N);
console.table(
  Object.entries(distC)
    .sort((a, b) => b[1] - a[1])
    .map(([id, c]) => ({ id, pct: ((c / N) * 100).toFixed(1) + "%" }))
);

console.log(`\n=== 1c. Q2="A"(普通に動ける)固定 + 残り29問ランダム (N=${N}) : 食後スリープが出ないことの確認 ===`);
const distA = distWithQ2Fixed("A", N);
console.log("shokugo-sleep count:", distA["shokugo-sleep"] ?? 0, "/", N);

console.log(`\n=== 1d. 完全ランダム(Q2も含む) (N=${N}) : 参考値 ===`);
const distFree = distWithQ2Fixed(null, N);
console.log(
  "shokugo-sleep count:",
  distFree["shokugo-sleep"] ?? 0,
  "/",
  N,
  `(${(((distFree["shokugo-sleep"] ?? 0) / N) * 100).toFixed(1)}%)`
);

// ---------- 2. Q2以外の29問だけで、食後スリープの条件(SP>=35 & DAM>=30)を満たせるか ----------
console.log("\n=== 2. Q2を「A」(SP/DAM寄与ゼロ)に固定した状態で、残り29問をSP/DAM最大化方向に振った場合 ===");
function biasedForSPDAM(): OptionKey[] {
  return QUESTIONS.map((q, i) => {
    if (i === 1) return "A" as OptionKey; // Q2固定
    const scores = q.options.map((o) => (o.scores.SP ?? 0) + (o.scores.DAM ?? 0));
    const max = Math.max(...scores);
    if (max <= 0) return KEYS[rand(4)];
    const tied = q.options.filter((o) => (o.scores.SP ?? 0) + (o.scores.DAM ?? 0) === max);
    return tied[rand(tied.length)].key;
  });
}
const a2 = biasedForSPDAM();
const p2 = computePercentScores(a2);
console.log("SP% =", p2.SP, " DAM% =", p2.DAM, " gate通過?", shokugoDef.gate(p2, a2));
console.log("→ Q2以外の29問をすべてSP/DAM最大方向にしても、Q2がB/Cでない限りgateはFalseのまま(必須条件のため)");

// ---------- 3. Q2="B"だけで(他は無関係な選択肢)、gateを満たせてしまうか ----------
console.log('\n=== 3. Q2="B"のみ、他29問はSP/DAMに一切寄与しない選択肢で揃えた場合 ===');
function q2OnlyMinimal(): OptionKey[] {
  return QUESTIONS.map((q, i) => {
    if (i === 1) return "B" as OptionKey; // Q2="かなり眠くなる" (SP3,QI2,DAM2)
    // SP,DAMへの寄与が0になる選択肢を探す(なければA)
    const zero = q.options.find((o) => (o.scores.SP ?? 0) === 0 && (o.scores.DAM ?? 0) === 0);
    return (zero ?? q.options[0]).key;
  });
}
const a3 = q2OnlyMinimal();
const p3 = computePercentScores(a3);
console.log("SP% =", p3.SP, " DAM% =", p3.DAM, " gate通過?", shokugoDef.gate(p3, a3));

const axisMax = computeMaxScores();
console.log("\n参考: AXIS_MAX SP =", axisMax.SP, " / Q2=Bの寄与SP+3 →", ((3 / axisMax.SP) * 100).toFixed(1) + "%");
console.log("参考: AXIS_MAX DAM =", axisMax.DAM, " / Q2=Bの寄与DAM+2 →", ((2 / axisMax.DAM) * 100).toFixed(1) + "%");

// ---------- 4. Q2="B"でも、他の回答が矛盾する(SP/DAMを下げる方向)場合にどうなるか ----------
// このデータでは他の設問はSPを下げる仕組みがない(加点のみ)ため、Q2=B以外は「加点しない」ことしかできない。
// → 実質的にQ2=Bを選ぶと、他がどうであれSP,DAM のベースラインは(3,2)からしか動かない。
console.log('\n=== 4. Q2=Bは「かなり眠くなる」1問でSP+3,DAM+2を持つ。他の設問でSP/DAMを"下げる"選択肢は存在するか ===');
let hasNegative = false;
for (const q of QUESTIONS) {
  for (const o of q.options) {
    if ((o.scores.SP ?? 0) < 0 || (o.scores.DAM ?? 0) < 0) hasNegative = true;
  }
}
console.log("SP/DAMを減点する選択肢の有無:", hasNegative);
