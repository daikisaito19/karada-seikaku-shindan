import { QUESTIONS, type OptionKey } from "./questions";
import { computePercentScores } from "./scoring";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const N = 20000;
let cnt = 0;
let cntGivenQ2BC = 0;
let totalQ2BC = 0;
for (let i = 0; i < N; i++) {
  const a = QUESTIONS.map(() => KEYS[rand(4)]);
  const p = computePercentScores(a);
  if (p.SP >= 35 && p.DAM >= 30) cnt++;
  if (a[1] === "B" || a[1] === "C") {
    totalQ2BC++;
    if (p.SP >= 35 && p.DAM >= 30) cntGivenQ2BC++;
  }
}
console.log(`SP>=35 && DAM>=30 (Q2完全ランダム込み) の割合: ${((cnt / N) * 100).toFixed(1)}%`);
console.log(
  `Q2がB/Cだった人のうち、SP>=35 && DAM>=30も満たす割合: ${((cntGivenQ2BC / totalQ2BC) * 100).toFixed(1)}%`
);
