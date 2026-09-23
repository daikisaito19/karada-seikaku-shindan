import { QUESTIONS, type OptionKey } from "./questions";
import { BLIND } from "./blind-answers";
import {
  pctAxes,
  familyScores,
  signalCounts,
  variabilityCount,
  TYPES,
  TYPE_NAME,
  type AxisScores,
} from "./engine";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const randomAnswers = () => QUESTIONS.map(() => KEYS[rand(4)]);

const line = (s: string) => console.log(`\n${"=".repeat(4)} ${s} ${"=".repeat(4)}`);

// =================================================================
// 案C' : 「リズム系」を独立させた5系統版
//   temperature から 12夜型スイッチ を外し、energy から 13スロースタート を外して
//   「リズム系(rhythm)」を新設する。リズム系は軸を持たず、シグナル数だけで判定する。
// =================================================================
const RHYTHM_TYPES = ["slow-start", "yagata-switch"];

function decideCPrime(
  answers: OptionKey[],
  th: { kuse: number; variability: number; signalW: number; rhythmMin: number }
) {
  const p: AxisScores = pctAxes(answers, "weighted");
  const f = familyScores(p);
  const sorted = Object.entries(f).sort((a, b) => b[1] - a[1]);
  const sc = signalCounts(answers);

  // 16 クセ強: 上位3系統がすべて閾値以上
  if (sorted[2][1] >= th.kuse) return { typeId: "kuse-tsuyoi", percent: p };
  // 15 波乗り: 変動シグナルが閾値以上
  if (variabilityCount(answers) >= th.variability) return { typeId: "nami-nori", percent: p };

  // リズム系: 軸を持たないので、シグナル数が閾値以上なら先に拾う
  const rhythm = RHYTHM_TYPES.map((id) => ({ id, n: sc[id] ?? 0 })).sort((a, b) => b.n - a.n);
  if (rhythm[0].n >= th.rhythmMin && rhythm[0].n > rhythm[1].n) {
    return { typeId: rhythm[0].id, percent: p };
  }

  // 残り12タイプ: 主軸% + シグナル数×重み
  const scored = TYPES.filter((t) => !RHYTHM_TYPES.includes(t.id))
    .map((t) => ({ id: t.id, score: p[t.primary] + (sc[t.id] ?? 0) * th.signalW }))
    .sort((a, b) => b.score - a.score);
  return { typeId: scored[0].id, percent: p };
}

// =================================================================
line("クセ強ミックスの閾値スイープ (ランダム回答 N=20000)");
const N = 20000;
const randomSet = Array.from({ length: N }, () => randomAnswers());

for (const kuse of [55, 60, 65, 70, 75, 80]) {
  const th = { kuse, variability: 3, signalW: 12, rhythmMin: 2 };
  const counts: Record<string, number> = {};
  for (const a of randomSet) {
    const t = decideCPrime(a, th).typeId;
    counts[t] = (counts[t] ?? 0) + 1;
  }
  const hits = BLIND.filter((b) => decideCPrime(b.answers, th).typeId === b.id).length;
  console.log(
    `クセ強閾値 ${kuse}%: クセ強出現率 ${(((counts["kuse-tsuyoi"] ?? 0) / N) * 100).toFixed(1)}%` +
      ` / 波乗り ${(((counts["nami-nori"] ?? 0) / N) * 100).toFixed(1)}%` +
      ` / ブラインド的中 ${hits}/16`
  );
}

// =================================================================
line("波乗りの変動シグナル閾値スイープ");
for (const v of [2, 3, 4]) {
  const th = { kuse: 70, variability: v, signalW: 12, rhythmMin: 2 };
  const counts: Record<string, number> = {};
  for (const a of randomSet) {
    const t = decideCPrime(a, th).typeId;
    counts[t] = (counts[t] ?? 0) + 1;
  }
  const hits = BLIND.filter((b) => decideCPrime(b.answers, th).typeId === b.id).length;
  console.log(
    `変動シグナル ${v}個以上: 波乗り出現率 ${(((counts["nami-nori"] ?? 0) / N) * 100).toFixed(1)}%` +
      ` / ブラインド的中 ${hits}/16`
  );
}

// =================================================================
line("案C' (5系統/リズム系独立) の最終確認");
const TH = { kuse: 70, variability: 3, signalW: 12, rhythmMin: 2 };

console.log("\n--- ブラインド的中 ---");
const rows = BLIND.map((b) => {
  const out = decideCPrime(b.answers, TH);
  return {
    タイプ: b.label,
    結果: out.typeId === b.id ? "OK" : `→${TYPE_NAME[out.typeId]}`,
  };
});
console.table(rows);
console.log(`的中: ${rows.filter((r) => r.結果 === "OK").length}/16`);

console.log("\n--- ランダム回答での出現分布 ---");
const dist: Record<string, number> = {};
for (const a of randomSet) {
  const t = decideCPrime(a, TH).typeId;
  dist[t] = (dist[t] ?? 0) + 1;
}
console.table(
  Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .map(([id, c]) => ({ タイプ: TYPE_NAME[id], 出現率: ((c / N) * 100).toFixed(1) + "%" }))
);

console.log("\n--- 安定性 (k=1,2,3 / 各600試行) ---");
const stab = BLIND.map((b) => {
  const base = decideCPrime(b.answers, TH).typeId;
  const trial = (k: number) => {
    let same = 0;
    const reps = 600;
    for (let i = 0; i < reps; i++) {
      const a = [...b.answers];
      const idxs = new Set<number>();
      while (idxs.size < k) idxs.add(rand(30));
      for (const idx of idxs) a[idx] = KEYS[rand(4)];
      if (decideCPrime(a, TH).typeId === base) same++;
    }
    return Math.round((same / reps) * 100);
  };
  return { タイプ: b.label, k1: trial(1), k2: trial(2), k3: trial(3) };
});
console.table(stab);
console.log(
  `平均 k1:${(stab.reduce((s, r) => s + r.k1, 0) / 16).toFixed(0)}% ` +
    `k2:${(stab.reduce((s, r) => s + r.k2, 0) / 16).toFixed(0)}% ` +
    `k3:${(stab.reduce((s, r) => s + r.k3, 0) / 16).toFixed(0)}%`
);

console.log("\n--- 単調性 ---");
function graded(b: (typeof BLIND)[number], keepRatio: number): OptionKey[] {
  const featureIdx = b.answers.map((a, i) => (a !== "A" ? i : -1)).filter((i) => i >= 0);
  const keep = Math.round(featureIdx.length * keepRatio);
  const shuffled = [...featureIdx].sort(() => Math.random() - 0.5);
  const kept = new Set(shuffled.slice(0, keep));
  return b.answers.map((a, i) => (featureIdx.includes(i) && !kept.has(i) ? "A" : a));
}
const mono = BLIND.map((b) => {
  const r: Record<string, string> = { タイプ: b.label };
  let prev = -1;
  let ok = true;
  for (const lv of [0.25, 0.5, 0.75, 1.0]) {
    let hit = 0;
    for (let i = 0; i < 300; i++) if (decideCPrime(graded(b, lv), TH).typeId === b.id) hit++;
    const pct = Math.round((hit / 300) * 100);
    r[`${lv * 100}%`] = pct + "%";
    if (pct < prev - 5) ok = false;
    prev = pct;
  }
  r["単調"] = ok ? "OK" : "▲逆転";
  return r;
});
console.table(mono);
console.log(`逆転: ${mono.filter((m) => m["単調"] === "▲逆転").length}/16`);

console.log("\n--- 識別4問への依存度 ---");
const DISC_IDX = QUESTIONS.map((q, i) => (q.discriminatorFor ? i : -1)).filter((i) => i >= 0);
let dep = 0;
for (const b of BLIND.slice(0, 14)) {
  const base = decideCPrime(b.answers, TH).typeId;
  let same = 0;
  for (let i = 0; i < 400; i++) {
    const a = [...b.answers];
    for (const idx of DISC_IDX) a[idx] = KEYS[rand(4)];
    if (decideCPrime(a, TH).typeId === base) same++;
  }
  dep += (same / 400) * 100;
}
console.log(`識別4問をランダム化しても型が変わらない率: ${(dep / 14).toFixed(1)}% (高いほど4問依存が弱い)`);
