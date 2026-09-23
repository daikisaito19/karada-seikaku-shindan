import { QUESTIONS, type OptionKey } from "./questions";
import { BLIND } from "./blind-answers";
import {
  ENGINES,
  TYPE_NAME,
  ALL_TYPE_IDS,
  TYPES,
  pctAxes,
  familyScores,
  signalCounts,
  signalCapacity,
  variabilityCount,
  type EngineKey,
  type ScoringMode,
} from "./engine";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const randomAnswers = () => QUESTIONS.map(() => KEYS[rand(4)]);
const DISC_IDX = QUESTIONS.map((q, i) => (q.discriminatorFor ? i : -1)).filter((i) => i >= 0);

// 回答長の検証
for (const b of BLIND) {
  if (b.answers.length !== 30) throw new Error(`${b.id}: ${b.answers.length}問`);
}

const line = (s: string) => console.log(`\n${"=".repeat(4)} ${s} ${"=".repeat(4)}`);

// =================================================================
line("② ブラインド的中率 (3方式 × 3スコアリング)");

const MODES: ScoringMode[] = ["main-only", "main-plus-sub", "weighted"];
const grid: Record<string, string> = {};
for (const eng of ["A", "B", "C"] as EngineKey[]) {
  for (const mode of MODES) {
    const hits = BLIND.filter((b) => ENGINES[eng](b.answers, mode).typeId === b.id).length;
    grid[`${eng}/${mode}`] = `${hits}/16`;
  }
}
console.table(
  MODES.map((mode) => ({
    スコアリング: mode,
    案A: grid[`A/${mode}`],
    案B: grid[`B/${mode}`],
    案C: grid[`C/${mode}`],
  }))
);

line("② 的中詳細 (weighted)");
const detail = BLIND.map((b) => {
  const r: Record<string, string> = { タイプ: b.label };
  for (const eng of ["A", "B", "C"] as EngineKey[]) {
    const out = ENGINES[eng](b.answers, "weighted");
    r[`案${eng}`] = out.typeId === b.id ? "OK" : `→${TYPE_NAME[out.typeId]}`;
  }
  return r;
});
console.table(detail);

line("② 外れたケースの理由 (案B / weighted)");
for (const b of BLIND) {
  const out = ENGINES.B(b.answers, "weighted");
  if (out.typeId === b.id) continue;
  const p = out.percent;
  const f = familyScores(p);
  const sc = signalCounts(b.answers);
  console.log(`${b.label} → ${TYPE_NAME[out.typeId]}`);
  console.log(`   理由: ${out.reason}`);
  console.log(`   系統: ${Object.entries(f).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  console.log(`   自分のシグナル: ${sc[b.id] ?? 0}個 / 変動シグナル: ${variabilityCount(b.answers)}個`);
}

// =================================================================
line("① NEW-A〜Dだけでタイプが決まってしまうか");

// (1) 識別4問を固定し、残り26問をランダムにしたとき、結果がどれだけ一致するか
const N1 = 4000;
for (const eng of ["A", "B", "C"] as EngineKey[]) {
  const rows = BLIND.slice(0, 14).map((b) => {
    const base = ENGINES[eng](b.answers, "weighted").typeId;
    let same = 0;
    for (let i = 0; i < N1 / 10; i++) {
      const a = randomAnswers();
      for (const idx of DISC_IDX) a[idx] = b.answers[idx]; // 識別4問だけ固定
      if (ENGINES[eng](a, "weighted").typeId === base) same++;
    }
    return { タイプ: b.label, 識別4問固定時の一致率: ((same / (N1 / 10)) * 100).toFixed(0) + "%" };
  });
  console.log(`\n--- 案${eng}: 識別4問だけ固定し、残り26問をランダム化 ---`);
  console.log(
    `平均一致率: ${(
      rows.reduce((s, r) => s + parseFloat(r.識別4問固定時の一致率), 0) / rows.length
    ).toFixed(1)}%  (100%に近いほど「4問で決まっている」)`
  );
  console.table(rows);
}

// (2) 逆: 残り26問を固定し、識別4問だけランダム化
line("① 逆: 26問を固定し、識別4問だけランダム化したときの一致率");
for (const eng of ["A", "B", "C"] as EngineKey[]) {
  let total = 0;
  for (const b of BLIND.slice(0, 14)) {
    const base = ENGINES[eng](b.answers, "weighted").typeId;
    let same = 0;
    const reps = 400;
    for (let i = 0; i < reps; i++) {
      const a = [...b.answers];
      for (const idx of DISC_IDX) a[idx] = KEYS[rand(4)];
      if (ENGINES[eng](a, "weighted").typeId === base) same++;
    }
    total += (same / reps) * 100;
  }
  console.log(`案${eng}: 平均 ${(total / 14).toFixed(1)}%  (低いほど「4問への依存が強い」)`);
}

// =================================================================
line("⑪ 1〜3問変更時の安定性 (各600試行, weighted)");
for (const eng of ["A", "B", "C"] as EngineKey[]) {
  const rows = BLIND.map((b) => {
    const base = ENGINES[eng](b.answers, "weighted").typeId;
    const trial = (k: number) => {
      let same = 0;
      const reps = 600;
      for (let i = 0; i < reps; i++) {
        const a = [...b.answers];
        const idxs = new Set<number>();
        while (idxs.size < k) idxs.add(rand(30));
        for (const idx of idxs) a[idx] = KEYS[rand(4)];
        if (ENGINES[eng](a, "weighted").typeId === base) same++;
      }
      return Math.round((same / reps) * 100);
    };
    return { タイプ: b.label, k1: trial(1), k2: trial(2), k3: trial(3) };
  });
  const avg = (k: "k1" | "k2" | "k3") =>
    (rows.reduce((s, r) => s + r[k], 0) / rows.length).toFixed(0);
  console.log(`\n--- 案${eng} --- 平均 k1:${avg("k1")}% k2:${avg("k2")}% k3:${avg("k3")}%`);
  console.table(rows);
}

// =================================================================
line("⑩ 単調性: 特徴を弱→強にしたとき、そのタイプへの到達率が上がるか");

/**
 * ブラインド回答のうち「A以外(=特徴を示している回答)」を特徴回答とみなし、
 * そのうち一定割合だけを残して他を中立(A)に戻すことで、強度を段階的に作る。
 */
function graded(b: (typeof BLIND)[number], keepRatio: number): OptionKey[] {
  const featureIdx = b.answers.map((a, i) => (a !== "A" ? i : -1)).filter((i) => i >= 0);
  const keep = Math.round(featureIdx.length * keepRatio);
  const shuffled = [...featureIdx].sort(() => Math.random() - 0.5);
  const kept = new Set(shuffled.slice(0, keep));
  return b.answers.map((a, i) => (featureIdx.includes(i) && !kept.has(i) ? "A" : a));
}

const LEVELS = [0.25, 0.5, 0.75, 1.0];
for (const eng of ["A", "B", "C"] as EngineKey[]) {
  const rows = BLIND.map((b) => {
    const r: Record<string, string> = { タイプ: b.label };
    let prev = -1;
    let monotone = true;
    for (const lv of LEVELS) {
      let hit = 0;
      const reps = 300;
      for (let i = 0; i < reps; i++) {
        if (ENGINES[eng](graded(b, lv), "weighted").typeId === b.id) hit++;
      }
      const pct = Math.round((hit / reps) * 100);
      r[`${lv * 100}%`] = pct + "%";
      if (pct < prev - 5) monotone = false; // 5pt以上の低下を非単調とみなす
      prev = pct;
    }
    r["単調"] = monotone ? "OK" : "▲逆転";
    return r;
  });
  const ng = rows.filter((r) => r["単調"] === "▲逆転").length;
  console.log(`\n--- 案${eng} --- 逆転しているタイプ: ${ng}/16`);
  console.table(rows);
}

// =================================================================
line("各タイプの決定打・1問依存度 (案B / N=40000ランダム)");
const N2 = 40000;
const dataset: { a: OptionKey[]; t: string }[] = [];
for (let i = 0; i < N2; i++) {
  const a = randomAnswers();
  dataset.push({ a, t: ENGINES.B(a, "weighted").typeId });
}
const base: Record<string, number> = {};
for (const d of dataset) base[d.t] = (base[d.t] ?? 0) + 1;
for (const k of Object.keys(base)) base[k] /= N2;

const detRows = ALL_TYPE_IDS.map((t) => {
  const per: { q: string; lift: number }[] = [];
  for (let qi = 0; qi < 30; qi++) {
    let best = 0;
    let key = "";
    for (const k of KEYS) {
      const sub = dataset.filter((d) => d.a[qi] === k);
      if (!sub.length) continue;
      const lift = sub.filter((d) => d.t === t).length / sub.length - (base[t] ?? 0);
      if (lift > best) {
        best = lift;
        key = k;
      }
    }
    per.push({ q: `Q${QUESTIONS[qi].id}=${key}`, lift: best });
  }
  per.sort((x, y) => y.lift - x.lift);
  return {
    タイプ: TYPE_NAME[t],
    出現率: ((base[t] ?? 0) * 100).toFixed(1) + "%",
    決定打1: `${per[0].q} +${(per[0].lift * 100).toFixed(1)}pt`,
    決定打2: `${per[1].q} +${(per[1].lift * 100).toFixed(1)}pt`,
    決定打3: `${per[2].q} +${(per[2].lift * 100).toFixed(1)}pt`,
  };
});
console.table(detRows);

line("参考: 各タイプのシグナル保有数");
const cap = signalCapacity();
console.table(
  TYPES.map((t) => ({ タイプ: t.name, 系統: t.family, 主軸: t.primary, シグナル設問数: cap[t.id] ?? 0 }))
    .concat([{ タイプ: "波乗り", 系統: "-" as never, 主軸: "-" as never, シグナル設問数: cap["nami-nori"] ?? 0 }])
);
