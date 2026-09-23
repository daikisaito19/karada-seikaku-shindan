import { QUESTIONS, type OptionKey } from "./questions";
import { determineType, computePercentScores } from "./scoring";
import { SCORE_AXES } from "../../src/data/scoreAxes";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const randomAnswers = () => QUESTIONS.map(() => KEYS[rand(4)]);

const N = 20000;
const kuseSamples: ReturnType<typeof computePercentScores>[] = [];
const namiSamples: { p: ReturnType<typeof computePercentScores>; moodSwing: boolean; a: OptionKey[] }[] = [];

for (let i = 0; i < N; i++) {
  const a = randomAnswers();
  const { typeId } = determineType(a);
  const p = computePercentScores(a);
  if (typeId === "kuse-tsuyoi") kuseSamples.push(p);
  if (typeId === "nami-nori") {
    const moodSwing = a[25] === "B" || a[25] === "D"; // Q26 (index25)
    namiSamples.push({ p, moodSwing, a });
  }
}

console.log(`\n=== クセ強ミックス(N=${kuseSamples.length}) の軸プロファイル分析 ===`);
const maxPerPerson = kuseSamples.map((p) => Math.max(...SCORE_AXES.map((ax) => p[ax])));
const avgMax = maxPerPerson.reduce((a, b) => a + b, 0) / maxPerPerson.length;
console.log("最も高い軸の平均値(全員の「一番高い軸」の平均):", avgMax.toFixed(1) + "%");
const thresholds = [30, 40, 50, 60];
for (const t of thresholds) {
  const cnt = maxPerPerson.filter((m) => m >= t).length;
  console.log(`  最高軸が${t}%以上の人の割合: ${((cnt / maxPerPerson.length) * 100).toFixed(1)}%`);
}
// 各軸の平均値
console.log("\n各軸の平均値(クセ強ミックスに分類された人たちの):");
for (const ax of SCORE_AXES) {
  const avg = kuseSamples.reduce((s, p) => s + p[ax], 0) / kuseSamples.length;
  console.log(`  ${ax}: ${avg.toFixed(1)}%`);
}

console.log(`\n=== 波乗りコンディション(N=${namiSamples.length}) の内訳 ===`);
const moodSwingCount = namiSamples.filter((s) => s.moodSwing).length;
console.log(
  `「体調の波は？」で日差あり/急変/天候依存を選んだ人の割合: ${((moodSwingCount / namiSamples.length) * 100).toFixed(1)}%`
);
console.log(
  `「安定している」を選んだのに波乗りになった人の割合: ${(
    ((namiSamples.length - moodSwingCount) / namiSamples.length) *
    100
  ).toFixed(1)}%`
);

// 波乗りになった人が、どのタイプ同士で拮抗していたか(スコア差の小さい上位2タイプ)
console.log("\n波乗りコンディションでの拮抗タイプの組み合わせ(上位10パターン):");
const combos: Record<string, number> = {};
for (const s of namiSamples) {
  const result = determineType(s.a);
  const sorted = [...result.scores].filter((r) => r.gatePassed).sort((a, b) => b.score - a.score);
  if (sorted.length >= 2) {
    const key = [sorted[0].id, sorted[1].id].sort().join(" × ");
    combos[key] = (combos[key] ?? 0) + 1;
  }
}
Object.entries(combos)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([k, c]) => console.log(`  ${k}: ${c} (${((c / namiSamples.length) * 100).toFixed(1)}%)`));
