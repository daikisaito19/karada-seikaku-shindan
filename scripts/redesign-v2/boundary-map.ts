import { QUESTIONS, type OptionKey } from "./questions";
import { determineType } from "./scoring";
import { PERSONA_DEFS, buildPersonaAnswers } from "./personas";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];

// 各ペルソナの理想回答から、1問だけを他の選択肢に変えたときに
// 実際にどのタイプへ「越境」するかを全設問×全選択肢で総当たりする。
console.log("\n=== 理想回答からの単問フリップで境界を越えるケース一覧 ===");

for (const def of PERSONA_DEFS) {
  const base = buildPersonaAnswers(def);
  const baseType = determineType(base).typeId;
  const flips: Record<string, string[]> = {};

  QUESTIONS.forEach((q, qi) => {
    for (const key of KEYS) {
      if (key === base[qi]) continue;
      const perturbed = [...base];
      perturbed[qi] = key;
      const newType = determineType(perturbed).typeId;
      if (newType !== baseType) {
        const label = `Q${q.id}=${key}`;
        flips[newType] = flips[newType] ?? [];
        flips[newType].push(label);
      }
    }
  });

  console.log(`\n--- ${def.id} (${baseType === def.id ? "一致" : "不一致!!"}) ---`);
  if (Object.keys(flips).length === 0) {
    console.log("  単問変更では他タイプへ越境しない(30問×3択=90通り全てで型が維持される)");
  } else {
    for (const [target, labels] of Object.entries(flips)) {
      console.log(`  → ${target}: ${labels.join(", ")}`);
    }
  }
}
