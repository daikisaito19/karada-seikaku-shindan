/** prototype engine と src/data/scoring が同一の判定を返すかを直接照合する */
import { QUESTIONS } from "./questions";
import { decide, pctAxes } from "./engine";
import { judge, computePercentScores, type Answers } from "../../src/data/scoring";
import { SCORE_AXES } from "../../src/data/scoreAxes";
import { BLIND } from "./blind";

const KEYS = ["A", "B", "C", "D"] as const;
const rand = (n: number) => Math.floor(Math.random() * n);
let typeMismatch = 0, axisMismatch = 0;
const cases: Answers[] = [...BLIND.map((b) => b.answers as unknown as Answers)];
for (let i = 0; i < 50000; i++) cases.push(QUESTIONS.map(() => KEYS[rand(4)]) as Answers);

for (const a of cases) {
  const proto = decide(a as never);
  const src = judge(a);
  if (proto.typeId !== src.typeId) { if (typeMismatch++ < 5) console.log(`型不一致 ${a.join("")}: proto=${proto.typeId} src=${src.typeId}`); }
  const pp = pctAxes(a as never), sp = computePercentScores(a);
  for (const ax of SCORE_AXES) if (pp[ax] !== sp[ax]) { if (axisMismatch++ < 5) console.log(`軸不一致 ${ax} ${a.join("")}: ${pp[ax]} vs ${sp[ax]}`); }
}
console.log(`照合件数: ${cases.length} (ブラインド16 + ランダム50,000)`);
console.log(`${typeMismatch === 0 ? "✅" : "❌"} タイプ判定の不一致: ${typeMismatch}件`);
console.log(`${axisMismatch === 0 ? "✅" : "❌"} 9軸スコアの不一致: ${axisMismatch}件`);
process.exitCode = typeMismatch + axisMismatch === 0 ? 0 : 1;
