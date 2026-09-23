import { QUESTIONS } from "./questions";
import { computeMaxScores } from "./scoring";

const axisMax = computeMaxScores();
console.log("AXIS_MAX SP =", axisMax.SP, " AXIS_MAX DAM =", axisMax.DAM);

console.log("\n--- SPに寄与する設問 ---");
for (const q of QUESTIONS) {
  const best = Math.max(0, ...q.options.map((o) => o.scores.SP ?? 0));
  if (best > 0) console.log(`Q${q.id} (${q.text}): 最大SP+${best}  (${((best / axisMax.SP) * 100).toFixed(1)}% of max)`);
}

console.log("\n--- DAMに寄与する設問 ---");
for (const q of QUESTIONS) {
  const best = Math.max(0, ...q.options.map((o) => o.scores.DAM ?? 0));
  if (best > 0) console.log(`Q${q.id} (${q.text}): 最大DAM+${best}  (${((best / axisMax.DAM) * 100).toFixed(1)}% of max)`);
}
