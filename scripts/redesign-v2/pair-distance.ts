import { QUESTIONS, type OptionKey } from "./questions";
import { determineType } from "./scoring";
import { PERSONA_DEFS, buildPersonaAnswers } from "./personas";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];

const PAIRS: [string, string][] = [
  ["juden-beta", "denchi-gire"],
  ["denchi-gire", "slow-start"],
  ["shokugo-sleep", "mukumi-stock"],
  ["hiehie", "hotehote"],
  ["karada-jutai", "ira-ira"],
  ["uruoi-busoku", "meguri-busoku"],
  ["atama-guruguru", "tsune-accel"],
  ["hotehote", "yagata-switch"],
];

function getPersona(id: string) {
  return PERSONA_DEFS.find((d) => d.id === id)!;
}

// fromId の理想回答から出発し、1問 → 2問 → 3問の変更で toId に到達できる
// 最小の組み合わせを探索する(全探索。30問なので3問合わせでも十分高速)。
function findMinFlip(fromId: string, toId: string, maxK: number) {
  const base = buildPersonaAnswers(getPersona(fromId));
  const n = QUESTIONS.length;

  for (let k = 1; k <= maxK; k++) {
    // k個の設問インデックスの組み合わせを全探索
    const idxCombo = (start: number, chosen: number[]): string[] | null => {
      if (chosen.length === k) {
        // 各選択された設問についてA-Dの組み合わせを全探索
        const options = chosen.map(() => KEYS);
        const total = Math.pow(4, k);
        for (let combo = 0; combo < total; combo++) {
          const perturbed = [...base];
          const desc: string[] = [];
          let c = combo;
          let skip = false;
          for (const idx of chosen) {
            const key = KEYS[c % 4];
            c = Math.floor(c / 4);
            if (key === base[idx]) {
              skip = true;
              break;
            }
            perturbed[idx] = key;
            desc.push(`Q${QUESTIONS[idx].id}=${key}`);
          }
          if (skip) continue;
          if (determineType(perturbed).typeId === toId) {
            return desc;
          }
        }
        return null;
      }
      for (let i = start; i < n; i++) {
        const result = idxCombo(i + 1, [...chosen, i]);
        if (result) return result;
      }
      return null;
    };
    const found = idxCombo(0, []);
    if (found) return { k, changes: found };
  }
  return null;
}

console.log("=== 主要ペアの最小フリップ距離(理想回答→隣接タイプに変わる最小の変更数) ===\n");
for (const [a, b] of PAIRS) {
  const ab = findMinFlip(a, b, 3);
  console.log(`${a} → ${b}: ${ab ? `${ab.k}問 (${ab.changes.join(", ")})` : "3問以内では到達不可"}`);
  const ba = findMinFlip(b, a, 3);
  console.log(`${b} → ${a}: ${ba ? `${ba.k}問 (${ba.changes.join(", ")})` : "3問以内では到達不可"}`);
  console.log("");
}
