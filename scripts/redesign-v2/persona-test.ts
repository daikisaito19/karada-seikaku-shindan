import { QUESTIONS, type OptionKey } from "./questions";
import { determineType, computePercentScores } from "./scoring";
import { PERSONA_DEFS, buildPersonaAnswers } from "./personas";
import { TYPE_DEFS } from "./typeDefs";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);

const NAME_MAP: Record<string, string> = {
  ...Object.fromEntries(TYPE_DEFS.map((t) => [t.id, t.name])),
  "nami-nori": "波乗りコンディション",
  "kuse-tsuyoi": "クセ強ミックス",
};

console.log("\n=== ①②③ 16タイプのペルソナ理想回答 → 実際の判定結果 ===");
const hitRows = PERSONA_DEFS.map((def) => {
  const answers = buildPersonaAnswers(def);
  const result = determineType(answers);
  const p = result.percent;
  return {
    intended: def.id,
    intendedName: NAME_MAP[def.id],
    actual: result.typeId,
    actualName: NAME_MAP[result.typeId],
    match: result.typeId === def.id ? "OK" : "NG",
    QI: p.QI,
    SP: p.SP,
    ST: p.ST,
    BL: p.BL,
    YANG: p.YANG,
    YIN: p.YIN,
    DAM: p.DAM,
    STA: p.STA,
  };
});
console.table(hitRows);

const okCount = hitRows.filter((r) => r.match === "OK").length;
console.log(`理想回答での一致: ${okCount} / ${hitRows.length}`);

// ---------- ④ 1/2/3/5問変更時の安定性 ----------
console.log("\n=== ④ 理想回答から1/2/3/5問変更したときの安定性 (各1000試行) ===");
const stabilityRows = PERSONA_DEFS.map((def) => {
  const base = buildPersonaAnswers(def);
  const baseType = determineType(base).typeId;
  const trial = (k: number, reps: number) => {
    let same = 0;
    for (let i = 0; i < reps; i++) {
      const perturbed = [...base];
      const idxs = new Set<number>();
      while (idxs.size < k) idxs.add(rand(QUESTIONS.length));
      for (const idx of idxs) perturbed[idx] = KEYS[rand(4)];
      if (determineType(perturbed).typeId === baseType) same++;
    }
    return ((same / reps) * 100).toFixed(0) + "%";
  };
  return {
    persona: def.id,
    baseType,
    matchesIntended: baseType === def.id ? "OK" : "NG",
    k1: trial(1, 1000),
    k2: trial(2, 1000),
    k3: trial(3, 1000),
    k5: trial(5, 1000),
  };
});
console.table(stabilityRows);

console.log("\n=== 完了 ===");
