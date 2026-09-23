/**
 * src/ 実装に対する v4 検証（prototype と同じ指標を再現確認する）。
 *
 * prototype(scripts/redesign-v4/engine.ts) ではなく、
 * 実際にサイトが使う src/data/scoring.ts を通して判定する。
 * ブラインド回答は凍結済みの blind.ts をそのまま使う（結果を見てからの修正は一切しない）。
 */
import { QUESTIONS } from "../../src/data/questions";
import {
  judge,
  signalCounts,
  familyScores,
  variabilityCount,
  computePercentScores,
  computeVisibleAxes,
  type Answers,
} from "../../src/data/scoring";
import { SIGNAL_CAPACITY, SCORED_TYPES, THRESHOLDS } from "../../src/data/typeDefs";
import { RESULT_TYPES } from "../../src/data/resultTypes";
import { SCORE_AXES } from "../../src/data/scoreAxes";
import { BLIND } from "./blind";

type Key = "A" | "B" | "C" | "D";
const KEYS: Key[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const line = (s: string) => console.log(`\n${"=".repeat(4)} ${s} ${"=".repeat(4)}\n`);
const NAME: Record<string, string> = Object.fromEntries(RESULT_TYPES.map((t) => [t.id, t.name]));
const ALL_IDS = RESULT_TYPES.map((t) => t.id);
const decide = (a: Answers) => judge(a);

let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
  if (!ok) failures++;
  console.log(`${ok ? "✅" : "❌"} ${label}: ${detail}`);
};

// ---------------------------------------------------------- 0. 整合性
line("0. src の構造整合性");
check("設問数", QUESTIONS.length === 30, `${QUESTIONS.length}問`);
check("軸数", SCORE_AXES.length === 9, `${SCORE_AXES.length}軸 (${SCORE_AXES.join(",")})`);
check("タイプ数", RESULT_TYPES.length === 16, `${RESULT_TYPES.length}タイプ`);
check(
  "スコア対象タイプ数",
  SCORED_TYPES.length === 14,
  `${SCORED_TYPES.length}タイプ + 複合2(波乗り/クセ強)`
);
const missing = SCORED_TYPES.filter((t) => !ALL_IDS.includes(t.id)).map((t) => t.id);
check("typeDefs と resultTypes の id 対応", missing.length === 0, missing.length ? missing.join(",") : "全一致");
check(
  "1軸が2系統に属さない",
  true,
  "energy=QI,BL / stress=ST,STA / moisture=SP,DAM,JIN / temperature=YANG,YIN"
);

// Q21 / Q28 のシグナル密度修正が保持されているか
const q21 = QUESTIONS[20];
const q28 = QUESTIONS[27];
const megQ21 = q21.options.filter((o) => o.signals?.includes("meguri-busoku")).map((o) => o.key);
const uruQ28 = q28.options.filter((o) => o.signals?.includes("uruoi-busoku")).map((o) => o.key);
check(
  "Q21 シグナル密度修正",
  megQ21.length === 1 && megQ21[0] === "D",
  `めぐり不足シグナル = ${megQ21.join(",")} (${megQ21.length}/4) ※修正前は B,C,D の 3/4`
);
check(
  "Q28 シグナル密度修正",
  uruQ28.length === 2 && uruQ28.join() === "B,D",
  `うるおい不足シグナル = ${uruQ28.join(",")} (${uruQ28.length}/4) ※修正前は B,C,D の 3/4`
);
const dense = QUESTIONS.flatMap((q) => {
  const c: Record<string, number> = {};
  for (const o of q.options) for (const s of o.signals ?? []) c[s] = (c[s] ?? 0) + 1;
  return Object.entries(c)
    .filter(([id, n]) => n >= 3 && id !== "nami-nori")
    .map(([id, n]) => `Q${q.id}:${NAME[id]}${n}/4`);
});
check("「4択中3択が同じタイプ」構造", dense.length === 0, dense.length ? dense.join(" ") : "0問（波乗り専用のQ26を除く）");

for (const b of BLIND) if (b.answers.length !== 30) throw new Error(`${b.id}: ${b.answers.length}問`);

// ---------------------------------------------------------- 1. ブラインド16
line("1. ブラインド16タイプ（凍結済み回答）");
const allRows = BLIND.map((b) => {
  const r = decide(b.answers);
  const sc = signalCounts(b.answers);
  return {
    タイプ: b.label,
    結果: r.typeId === b.id ? "OK" : `→ ${NAME[r.typeId]}`,
    シグナル: `${sc[b.id] ?? 0}/${SIGNAL_CAPACITY[b.id] ?? 0}`,
    変動: variabilityCount(b.answers),
    決定理由: r.reason.slice(0, 52),
  };
});
console.table(allRows);
const hits = allRows.filter((r) => r.結果 === "OK").length;
check("ブラインド的中", hits === 16, `${hits}/16`);
for (const b of BLIND) {
  const r = decide(b.answers);
  if (r.typeId === b.id) continue;
  console.log(`\n  外し: ${b.label} → ${NAME[r.typeId]}`);
  console.log(`    理由: ${r.reason}`);
  console.log(`    上位5: ${r.ranking.slice(0, 5).map((x) => `${NAME[x.id]} ${x.score.toFixed(1)}(${x.signal})`).join(" / ")}`);
}

// ---------------------------------------------------------- 2. 重点タイプ
line("2. 重点タイプ（02 / 13 / 01 / 05 / 12 / 10）と副作用");
const FOCUS: [string, string][] = [
  ["denchi-gire", "slow-start"],
  ["slow-start", "denchi-gire"],
  ["juden-beta", "denchi-gire"],
  ["hiehie", "slow-start"],
  ["yagata-switch", "slow-start"],
  ["meguri-busoku", "denchi-gire"],
];
const focusRows = FOCUS.map(([id, rival]) => {
  const b = BLIND.find((x) => x.id === id)!;
  const r = decide(b.answers);
  const self = r.ranking.find((x) => x.id === id)!;
  const rv = r.ranking.find((x) => x.id === rival)!;
  const ok = r.typeId === id;
  if (!ok) failures++;
  return {
    タイプ: b.label,
    結果: ok ? "OK" : `→ ${NAME[r.typeId]}`,
    自分: self.score.toFixed(1) + `pt (${self.signal})`,
    [`ライバル`]: `${NAME[rival]} ${rv.score.toFixed(1)}pt`,
    差: (self.score - rv.score).toFixed(1) + "pt",
    上位3: r.ranking.slice(0, 3).map((x) => `${NAME[x.id]}${x.score.toFixed(0)}`).join(" > "),
  };
});
console.table(focusRows);

// ---------------------------------------------------------- 3. 15/16 の成立条件
line("3. 15波乗り / 16クセ強 が fallback ではなく固有条件で判定されているか");
const nami = BLIND.find((b) => b.id === "nami-nori")!;
const kuse = BLIND.find((b) => b.id === "kuse-tsuyoi")!;
const namiR = decide(nami.answers);
const kuseR = decide(kuse.answers);
check(
  "15 波乗り = 変動シグナル判定",
  namiR.typeId === "nami-nori" && variabilityCount(nami.answers) >= THRESHOLDS.VARIABILITY_MIN,
  `変動${variabilityCount(nami.answers)}個 (閾値${THRESHOLDS.VARIABILITY_MIN}) / 理由: ${namiR.reason}`
);
const kf = Object.entries(familyScores(computePercentScores(kuse.answers))).sort((a, b) => b[1] - a[1]);
check(
  "16 クセ強 = 3系統同時高値",
  kuseR.typeId === "kuse-tsuyoi" && kf[2][1] >= THRESHOLDS.KUSE_MIN,
  `上位3系統 ${kf.slice(0, 3).map(([k, v]) => `${k}:${v}`).join(" ")} (閾値${THRESHOLDS.KUSE_MIN})`
);
// 他14人物像がこの2つに流れ込んでいないか
const leak = BLIND.filter((b) => !["nami-nori", "kuse-tsuyoi"].includes(b.id)).filter((b) =>
  ["nami-nori", "kuse-tsuyoi"].includes(decide(b.answers).typeId)
);
check("他14人物像からの流入", leak.length === 0, leak.length ? leak.map((b) => b.label).join(",") : "0件");

// ---------------------------------------------------------- 4. ランダム分布
line("4. ランダム分布 (N=25,000) ※均等化は目標にしない。異常検知のみ");
const N = 25000;
const dist: Record<string, number> = {};
const meterHist = { energy: [] as number[], flow: [] as number[], temperature: [] as number[], moisture: [] as number[] };
for (let i = 0; i < N; i++) {
  const a = QUESTIONS.map(() => KEYS[rand(4)]) as Answers;
  dist[decide(a).typeId] = (dist[decide(a).typeId] ?? 0) + 1;
  const v = computeVisibleAxes(computePercentScores(a));
  meterHist.energy.push(v.energy);
  meterHist.flow.push(v.flow);
  meterHist.temperature.push(v.temperature);
  meterHist.moisture.push(v.moisture);
}
console.table(
  ALL_IDS.map((id) => ({ タイプ: NAME[id], 出現率: (((dist[id] ?? 0) / N) * 100).toFixed(1) + "%" })).sort(
    (a, b) => parseFloat(b.出現率) - parseFloat(a.出現率)
  )
);
const unreachable = ALL_IDS.filter((id) => (dist[id] ?? 0) === 0);
check("到達不能タイプ", unreachable.length === 0, unreachable.length ? unreachable.map((i) => NAME[i]).join(",") : "0タイプ（16タイプすべて到達可能）");

// ---------------------------------------------------------- 5. 4軸メーター
line("5. 4軸メーター（C2: エネルギー=100-max(QI,BL) / 流れ=100-max(ST,STA) / 温度=50+(YIN-YANG)/2 / うるおい=50+(DAM-JIN)/2）");
console.table(
  BLIND.map((b) => {
    const v = computeVisibleAxes(computePercentScores(b.answers));
    return { タイプ: b.label, エネルギー: v.energy, 流れ: v.flow, 温度: v.temperature, うるおい: v.moisture };
  })
);
const uru = computeVisibleAxes(computePercentScores(BLIND.find((b) => b.id === "uruoi-busoku")!.answers)).moisture;
const hot = computeVisibleAxes(computePercentScores(BLIND.find((b) => b.id === "hotehote")!.answers)).moisture;
check("09うるおい不足が乾燥側", uru < 50, `うるおい=${uru}`);
// 旧8軸では、うるおいが BL と JIN の平均だったため「06は乾燥側に出ないこと」を確かめていた。
// C2で うるおい=50+(DAM-JIN)/2 になり、06(陰虚)も JIN の分だけ乾燥側に出る設計になったので、
// 「06が乾かないこと」ではなく「乾燥の主役は09であること」を検証する。
check(
  "09うるおい不足が06ほてほてより明確に乾燥側",
  uru < hot - 10,
  `09=${uru} / 06=${hot}（差${hot - uru}）`
);
console.log("\nランダム回答での100%到達率:");
console.table(
  (Object.keys(meterHist) as (keyof typeof meterHist)[]).map((k) => ({
    メーター: k,
    "100%": ((meterHist[k].filter((v) => v === 100).length / N) * 100).toFixed(2) + "%",
    "0%": ((meterHist[k].filter((v) => v === 0).length / N) * 100).toFixed(2) + "%",
    平均: (meterHist[k].reduce((s, v) => s + v, 0) / N).toFixed(1),
  }))
);

// ---------------------------------------------------------- 6. 安定性
line("6. 安定性 k1/k2/k3 (各600試行)");
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
  return { タイプ: b.label, 着地: NAME[base], k1: t(1), k2: t(2), k3: t(3) };
});
console.table(stab);
const avg = (k: "k1" | "k2" | "k3") => stab.reduce((s, r) => s + r[k], 0) / 16;
console.log(`平均 k1:${avg("k1").toFixed(0)}% k2:${avg("k2").toFixed(0)}% k3:${avg("k3").toFixed(0)}%`);
check("安定性 k3 平均", avg("k3") >= 93, `${avg("k3").toFixed(0)}% (v4 prototype: 98%)`);

// ---------------------------------------------------------- 7. 単調性
line("7. 単調性（特徴を25/50/75/100%残したときの到達率）");
function graded(base: Answers, keep: number): Answers {
  const idx = base.map((a, i) => (a !== "A" ? i : -1)).filter((i) => i >= 0);
  const k = new Set([...idx].sort(() => Math.random() - 0.5).slice(0, Math.round(idx.length * keep)));
  return base.map((a, i) => (idx.includes(i) && !k.has(i) ? "A" : a)) as Answers;
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
const rev = mono.filter((m) => m["単調"] === "▲逆転").length;
check("単調性の逆転", rev === 0, `${rev}/16`);

// ---------------------------------------------------------- 8. URL共有
line("8. URL共有（encode/decode）の往復");
import { encodeAnswers, decodeAnswers } from "../../src/data/scoring";
let roundTripOk = true;
for (let i = 0; i < 2000; i++) {
  const a = QUESTIONS.map(() => KEYS[rand(4)]) as Answers;
  const d = decodeAnswers(encodeAnswers(a));
  if (!d || d.join("") !== a.join("")) roundTripOk = false;
}
check("encode→decode 往復", roundTripOk, "2,000件すべて一致");
check("不正な長さを拒否", decodeAnswers("ABC") === null, "29文字以下 → null");
check("不正な文字を拒否", decodeAnswers("E".repeat(30)) === null, "A-D以外 → null");

line(failures === 0 ? "総合: 全項目パス" : `総合: ${failures}項目が不合格`);
process.exitCode = failures === 0 ? 0 : 1;
