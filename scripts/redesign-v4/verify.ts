import { QUESTIONS, type OptionKey } from "./questions";
import { BLIND } from "./blind";
import { decide, TYPE_NAME, ALL_IDS, signalCounts, familyScores, variabilityCount, CAPACITY } from "./engine";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const line = (s: string) => console.log(`\n${"=".repeat(4)} ${s} ${"=".repeat(4)}\n`);

for (const b of BLIND) if (b.answers.length !== 30) throw new Error(`${b.id}: ${b.answers.length}問`);

// ---------------------------------------------------------- 重点6タイプ
line("③ 重点6タイプ (02 / 13 / 01 / 05 / 12 / 10)");
const FOCUS = ["denchi-gire", "slow-start", "juden-beta", "hiehie", "yagata-switch", "meguri-busoku"];
const focusRows = FOCUS.map((id) => {
  const b = BLIND.find((x) => x.id === id)!;
  const r = decide(b.answers);
  const sc = signalCounts(b.answers);
  return {
    タイプ: b.label,
    結果: r.typeId === id ? "OK" : `→ ${TYPE_NAME[r.typeId]}`,
    自分のシグナル: `${sc[id] ?? 0}/${CAPACITY[id] ?? 0}`,
    上位3: r.ranking.slice(0, 3).map((x) => `${TYPE_NAME[x.id]}${x.score.toFixed(0)}`).join(" > "),
  };
});
console.table(focusRows);

// ---------------------------------------------------------- 全16タイプ
line("③ 全16タイプ");
const allRows = BLIND.map((b) => {
  const r = decide(b.answers);
  const sc = signalCounts(b.answers);
  return {
    タイプ: b.label,
    結果: r.typeId === b.id ? "OK" : `→ ${TYPE_NAME[r.typeId]}`,
    シグナル: `${sc[b.id] ?? 0}/${CAPACITY[b.id] ?? 0}`,
    変動: variabilityCount(b.answers),
  };
});
console.table(allRows);
const hits = allRows.filter((r) => r.結果 === "OK").length;
console.log(`ブラインド的中: ${hits}/16`);

line("外したケースの詳細");
for (const b of BLIND) {
  const r = decide(b.answers);
  if (r.typeId === b.id) continue;
  console.log(`${b.label} → ${TYPE_NAME[r.typeId]}`);
  console.log(`  理由: ${r.reason}`);
  console.log(`  系統: ${Object.entries(familyScores(r.percent)).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  console.log(`  上位5: ${r.ranking.slice(0, 5).map((x) => `${TYPE_NAME[x.id]} ${x.score.toFixed(1)}(${x.sig})`).join(" / ")}\n`);
}

// ---------------------------------------------------------- 副作用
line("④ 副作用: 隣接タイプのスコア内訳");
for (const id of ["hiehie", "yagata-switch", "juden-beta", "meguri-busoku"]) {
  const b = BLIND.find((x) => x.id === id)!;
  const r = decide(b.answers);
  const sc = signalCounts(b.answers);
  const rivals = id === "hiehie" || id === "yagata-switch" ? ["slow-start"] : ["denchi-gire"];
  console.log(`${b.label}: 判定=${TYPE_NAME[r.typeId]}`);
  console.log(`  自分 ${(r.ranking.find((x) => x.id === id)?.score ?? 0).toFixed(1)}pt (シグナル${sc[id] ?? 0}/${CAPACITY[id]})`);
  for (const rv of rivals) {
    const e = r.ranking.find((x) => x.id === rv)!;
    console.log(`  ${TYPE_NAME[rv]} ${e.score.toFixed(1)}pt (シグナル${e.sig}) ← 差 ${((r.ranking.find((x) => x.id === id)?.score ?? 0) - e.score).toFixed(1)}pt`);
  }
  console.log("");
}

// ---------------------------------------------------------- ランダム分布
line("⑤ ランダム分布 (N=25000) ※異常検知目的");
const N = 25000;
const dist: Record<string, number> = {};
for (let i = 0; i < N; i++) {
  const t = decide(QUESTIONS.map(() => KEYS[rand(4)])).typeId;
  dist[t] = (dist[t] ?? 0) + 1;
}
console.table(
  ALL_IDS.map((id) => ({ タイプ: TYPE_NAME[id], 出現率: (((dist[id] ?? 0) / N) * 100).toFixed(1) + "%" })).sort(
    (a, b) => parseFloat(b.出現率) - parseFloat(a.出現率)
  )
);

// ---------------------------------------------------------- 安定性
line("⑥ 安定性 k1/k2/k3 (各600試行)");
const stab = BLIND.map((b) => {
  const base = decide(b.answers).typeId;
  const t = (k: number) => {
    let same = 0;
    for (let i = 0; i < 600; i++) {
      const a = [...b.answers];
      const s = new Set<number>();
      while (s.size < k) s.add(rand(30));
      for (const j of s) a[j] = KEYS[rand(4)];
      if (decide(a).typeId === base) same++;
    }
    return Math.round((same / 600) * 100);
  };
  return { タイプ: b.label, 着地: TYPE_NAME[base], k1: t(1), k2: t(2), k3: t(3) };
});
console.table(stab);
console.log(
  `平均 k1:${(stab.reduce((s, r) => s + r.k1, 0) / 16).toFixed(0)}% ` +
    `k2:${(stab.reduce((s, r) => s + r.k2, 0) / 16).toFixed(0)}% ` +
    `k3:${(stab.reduce((s, r) => s + r.k3, 0) / 16).toFixed(0)}%`
);

// ---------------------------------------------------------- 単調性
line("単調性 (特徴を25/50/75/100%残したときの到達率)");
function graded(base: OptionKey[], keep: number): OptionKey[] {
  const idx = base.map((a, i) => (a !== "A" ? i : -1)).filter((i) => i >= 0);
  const k = new Set([...idx].sort(() => Math.random() - 0.5).slice(0, Math.round(idx.length * keep)));
  return base.map((a, i) => (idx.includes(i) && !k.has(i) ? "A" : a));
}
const mono = BLIND.map((b) => {
  const r: Record<string, string> = { タイプ: b.label };
  let prev = -1;
  let ok = true;
  for (const lv of [0.25, 0.5, 0.75, 1.0]) {
    let hit = 0;
    for (let i = 0; i < 300; i++) if (decide(graded(b.answers, lv)).typeId === b.id) hit++;
    const v = Math.round((hit / 300) * 100);
    r[`${lv * 100}%`] = v + "%";
    if (v < prev - 5) ok = false;
    prev = v;
  }
  r["単調"] = ok ? "OK" : "▲逆転";
  return r;
});
console.table(mono);
console.log(`逆転: ${mono.filter((m) => m["単調"] === "▲逆転").length}/16`);
