import { QUESTIONS } from "./questions";
import { SCORE_AXES, type ScoreAxis } from "../../src/data/scoreAxes";

/**
 * 設問同士が「構造的に同じものを測っていないか」を客観的に測る。
 * 各設問を「どの軸に最大どれだけ加点するか」のベクトルとみなし、
 * コサイン類似度が高いペア = 実質的に同じ軸を同じ比率で押している設問。
 */
function vecOf(q: (typeof QUESTIONS)[number]): number[] {
  return SCORE_AXES.map((ax: ScoreAxis) => Math.max(0, ...q.options.map((o) => o.scores[ax] ?? 0)));
}

function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return na && nb ? dot / (na * nb) : 0;
}

const vecs = QUESTIONS.map(vecOf);
const pairs: { a: string; b: string; sim: number; axes: string }[] = [];

for (let i = 0; i < QUESTIONS.length; i++) {
  for (let j = i + 1; j < QUESTIONS.length; j++) {
    const sim = cosine(vecs[i], vecs[j]);
    if (sim >= 0.7) {
      const shared = SCORE_AXES.filter((_, k) => vecs[i][k] > 0 && vecs[j][k] > 0);
      pairs.push({
        a: `Q${QUESTIONS[i].id} ${QUESTIONS[i].text}`,
        b: `Q${QUESTIONS[j].id} ${QUESTIONS[j].text}`,
        sim: Number(sim.toFixed(2)),
        axes: shared.join(","),
      });
    }
  }
}

pairs.sort((x, y) => y.sim - x.sim);
console.log("=== 軸ベクトルが似ている設問ペア (コサイン類似度 >= 0.7) ===\n");
console.table(pairs);

console.log("\n=== 各設問が加点する軸の数 ===\n");
const counts = QUESTIONS.map((q, i) => ({
  q: `Q${q.id}`,
  text: q.text,
  軸数: vecs[i].filter((v) => v > 0).length,
  軸: SCORE_AXES.filter((_, k) => vecs[i][k] > 0).join(","),
}));
counts.sort((a, b) => b.軸数 - a.軸数);
console.table(counts);
