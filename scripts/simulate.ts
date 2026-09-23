import { QUESTIONS } from "../src/data/questions";
import { determineType } from "../src/data/scoring";
import { RESULT_TYPES } from "../src/data/resultTypes";
import type { OptionKey } from "../src/data/questions";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const N = 20000;
const counts: Record<string, number> = {};
for (const t of RESULT_TYPES) counts[t.id] = 0;

function randomAnswers(): OptionKey[] {
  return QUESTIONS.map(() => KEYS[Math.floor(Math.random() * 4)]);
}

for (let i = 0; i < N; i++) {
  const type = determineType(randomAnswers());
  counts[type.id]++;
}

const rows = RESULT_TYPES.map((t) => ({
  no: t.no,
  id: t.id,
  name: t.name,
  count: counts[t.id],
  pct: ((counts[t.id] / N) * 100).toFixed(1) + "%",
}));
rows.sort((a, b) => b.count - a.count);
console.table(rows);
