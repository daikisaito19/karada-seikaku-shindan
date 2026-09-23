import { QUESTIONS, type OptionKey } from "./questions";
import { determineType } from "./scoring";
import { SCORE_AXES } from "../../src/data/scoreAxes";
import { TYPE_DEFS } from "./typeDefs";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);

const NAME_MAP: Record<string, string> = {
  ...Object.fromEntries(TYPE_DEFS.map((t) => [t.id, t.name])),
  "nami-nori": "波乗り",
  "kuse-tsuyoi": "クセ強",
};

// 1回だけ大量にサンプルを作り、設問ごとに回答で層別して分布を比較する
const N = 60000;
const dataset: { answers: OptionKey[]; typeId: string }[] = [];
for (let i = 0; i < N; i++) {
  const answers = QUESTIONS.map(() => KEYS[rand(4)]);
  dataset.push({ answers, typeId: determineType(answers).typeId });
}

const baseline: Record<string, number> = {};
for (const d of dataset) baseline[d.typeId] = (baseline[d.typeId] ?? 0) + 1;
for (const k of Object.keys(baseline)) baseline[k] /= N;

console.log("=== 設問ごとの「どのタイプをどれだけ動かすか」 ===");
console.log("lift = P(タイプ | その選択肢) - P(タイプ)  … 正なら押し上げ、負なら押し下げ\n");

interface QRow {
  q: string;
  text: string;
  軸: string;
  最大lift: string;
  主に動かすタイプ: string;
}
const qRows: QRow[] = [];

for (let qi = 0; qi < QUESTIONS.length; qi++) {
  const q = QUESTIONS[qi];
  const axes = SCORE_AXES.filter((ax) => q.options.some((o) => (o.scores[ax] ?? 0) > 0));
  const effects: { label: string; lift: number }[] = [];

  for (const key of KEYS) {
    const subset = dataset.filter((d) => d.answers[qi] === key);
    if (!subset.length) continue;
    const dist: Record<string, number> = {};
    for (const d of subset) dist[d.typeId] = (dist[d.typeId] ?? 0) + 1;
    for (const t of Object.keys(baseline)) {
      const p = (dist[t] ?? 0) / subset.length;
      effects.push({ label: `${key}→${NAME_MAP[t]}`, lift: p - baseline[t] });
    }
  }

  effects.sort((a, b) => Math.abs(b.lift) - Math.abs(a.lift));
  const top = effects.slice(0, 3);
  qRows.push({
    q: `Q${q.id}`,
    text: q.text,
    軸: axes.length ? axes.join(",") : "(なし=シグナル専用)",
    最大lift: (Math.abs(top[0].lift) * 100).toFixed(1) + "pt",
    主に動かすタイプ: top
      .map((t) => `${t.label}${t.lift > 0 ? "+" : ""}${(t.lift * 100).toFixed(1)}`)
      .join(" / "),
  });
}

qRows.sort((a, b) => parseFloat(b.最大lift) - parseFloat(a.最大lift));
console.table(qRows);

// 各タイプについて「そのタイプを最も動かす設問」を逆引き
console.log("\n=== タイプごとの『決定打になっている設問』(上位3問) ===\n");
for (const t of Object.keys(baseline).sort()) {
  const perQ: { q: string; lift: number; key: string }[] = [];
  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    let best = 0;
    let bestKey = "";
    for (const key of KEYS) {
      const subset = dataset.filter((d) => d.answers[qi] === key);
      if (!subset.length) continue;
      const cnt = subset.filter((d) => d.typeId === t).length;
      const lift = cnt / subset.length - baseline[t];
      if (lift > best) {
        best = lift;
        bestKey = key;
      }
    }
    perQ.push({ q: `Q${QUESTIONS[qi].id}`, lift: best, key: bestKey });
  }
  perQ.sort((a, b) => b.lift - a.lift);
  const top3 = perQ.slice(0, 3).map((p) => `${p.q}=${p.key}(+${(p.lift * 100).toFixed(1)}pt)`);
  console.log(`${NAME_MAP[t].padEnd(8, "　")} 出現率${(baseline[t] * 100).toFixed(1)}%  決定打: ${top3.join(", ")}`);
}
