import { QUESTIONS, type OptionKey } from "./questions";
import { determineType, computePercentScores, computeMaxScores } from "./scoring";
import { BLIND_PERSONAS } from "./blind-personas";
import { PERSONA_DEFS, buildPersonaAnswers } from "./personas";
import { TYPE_DEFS } from "./typeDefs";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);

const NAME_MAP: Record<string, string> = {
  ...Object.fromEntries(TYPE_DEFS.map((t) => [t.id, t.name])),
  "nami-nori": "波乗りコンディション",
  "kuse-tsuyoi": "クセ強ミックス",
};

// 回答長の検証
for (const p of BLIND_PERSONAS) {
  if (p.answers.length !== QUESTIONS.length) {
    throw new Error(`${p.id}: 回答数が${p.answers.length}問 (期待値${QUESTIONS.length})`);
  }
}

console.log("=== A. ブラインド理想回答(ロジック非依存)での判定結果 ===\n");
const rows = BLIND_PERSONAS.map((p) => {
  const r = determineType(p.answers);
  const pct = r.percent;
  return {
    type: p.label,
    intended: p.id,
    actual: r.typeId,
    actualName: NAME_MAP[r.typeId],
    hit: r.typeId === p.id ? "OK" : "NG",
    QI: pct.QI,
    SP: pct.SP,
    ST: pct.ST,
    BL: pct.BL,
    YANG: pct.YANG,
    YIN: pct.YIN,
    DAM: pct.DAM,
    STA: pct.STA,
  };
});
console.table(rows);
const hits = rows.filter((r) => r.hit === "OK").length;
console.log(`\nブラインド理想回答での的中: ${hits} / ${rows.length}\n`);

console.log("=== B. 外したケースの内訳(なぜそのタイプにならなかったか) ===\n");
for (const p of BLIND_PERSONAS) {
  const r = determineType(p.answers);
  if (r.typeId === p.id) continue;
  const def = TYPE_DEFS.find((t) => t.id === p.id);
  const gateOk = def ? def.gate(r.percent, p.answers) : null;
  const passed = r.scores.filter((s) => s.gatePassed).sort((a, b) => b.score - a.score);
  console.log(`${p.label}`);
  console.log(`  → 実際の判定: ${NAME_MAP[r.typeId]} (${r.typeId})`);
  console.log(`  → 本来のタイプのgate通過: ${gateOk === null ? "(フォールバック型なのでgate無し)" : gateOk}`);
  console.log(
    `  → gateを通過した候補: ${
      passed.length ? passed.map((s) => `${s.id}(${s.score.toFixed(1)})`).join(", ") : "なし"
    }`
  );
  console.log("");
}

console.log("=== C. 調整済みペルソナ(personas.ts)との比較 ===\n");
const cmp = BLIND_PERSONAS.map((bp) => {
  const tuned = PERSONA_DEFS.find((d) => d.id === bp.id);
  const tunedResult = tuned ? determineType(buildPersonaAnswers(tuned)).typeId : "-";
  const blindResult = determineType(bp.answers).typeId;
  // 調整済みとブラインドで、何問回答が違うか
  let diff = 0;
  if (tuned) {
    const ta = buildPersonaAnswers(tuned);
    for (let i = 0; i < QUESTIONS.length; i++) if (ta[i] !== bp.answers[i]) diff++;
  }
  return {
    type: bp.label,
    調整済み: tunedResult === bp.id ? "OK" : `NG(${tunedResult})`,
    ブラインド: blindResult === bp.id ? "OK" : `NG(${blindResult})`,
    回答差分: `${diff}問`,
  };
});
console.table(cmp);

console.log("\n=== D. ブラインド回答の1/2/3問変更時の安定性(各1000試行) ===\n");
const stab = BLIND_PERSONAS.map((p) => {
  const baseType = determineType(p.answers).typeId;
  const trial = (k: number, reps: number) => {
    let same = 0;
    for (let i = 0; i < reps; i++) {
      const perturbed = [...p.answers];
      const idxs = new Set<number>();
      while (idxs.size < k) idxs.add(rand(QUESTIONS.length));
      for (const idx of idxs) perturbed[idx] = KEYS[rand(4)];
      if (determineType(perturbed).typeId === baseType) same++;
    }
    return ((same / reps) * 100).toFixed(0) + "%";
  };
  return {
    type: p.label,
    着地: NAME_MAP[baseType],
    意図通り: baseType === p.id ? "OK" : "NG",
    k1: trial(1, 1000),
    k2: trial(2, 1000),
    k3: trial(3, 1000),
  };
});
console.table(stab);

console.log("\n=== E. 参考: 各軸のAXIS_MAX ===");
console.log(computeMaxScores());
