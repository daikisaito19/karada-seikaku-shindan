import { QUESTIONS, type OptionKey } from "./questions";
import { TYPES, CAPACITY, TYPE_NAME } from "./engine";

/**
 * シグナル設計の偏りを監査する。
 *  (1) 1設問の中で、同じタイプのシグナルが何択に入っているか (3/4 は偏りすぎ)
 *  (2) ランダム回答で、各タイプのシグナル充足率が期待値としていくつになるか
 *      → これが高いタイプほど「何も考えずに答えても、そのタイプになりやすい」
 */

console.log("=== (1) 1設問内で同じタイプのシグナルが何択を占めるか ===\n");
const dense: { 設問: string; タイプ: string; 該当択数: string; 選択肢: string }[] = [];
for (const q of QUESTIONS) {
  const byType: Record<string, OptionKey[]> = {};
  for (const o of q.options) for (const s of o.signals ?? []) (byType[s] ??= []).push(o.key);
  for (const [t, keys] of Object.entries(byType)) {
    if (keys.length >= 2) {
      dense.push({
        設問: `Q${q.id} ${q.text}`,
        タイプ: TYPE_NAME[t] ?? t,
        該当択数: `${keys.length}/4`,
        選択肢: keys.join(","),
      });
    }
  }
}
dense.sort((a, b) => parseInt(b.該当択数) - parseInt(a.該当択数));
console.table(dense);

console.log("\n=== (2) ランダム回答でのシグナル期待充足率 ===");
console.log("(各設問で、そのタイプのシグナルが1つでも発火する確率の合計 ÷ シグナル設問数)\n");

const rows = TYPES.map((t) => {
  let expected = 0;
  const detail: string[] = [];
  for (const q of QUESTIONS) {
    const hitKeys = q.options.filter((o) => o.signals?.includes(t.id)).length;
    if (hitKeys > 0) {
      expected += hitKeys / 4;
      detail.push(`Q${q.id}:${hitKeys}/4`);
    }
  }
  const cap = CAPACITY[t.id] ?? 1;
  return {
    タイプ: t.name,
    シグナル設問数: cap,
    期待発火数: expected.toFixed(2),
    期待充足率: ((expected / cap) * 100).toFixed(0) + "%",
    内訳: detail.join(" "),
  };
});
rows.sort((a, b) => parseFloat(b.期待充足率) - parseFloat(a.期待充足率));
console.table(rows);

// nami-nori は別枠(変動シグナルの個数で判定)なので参考表示
let vExp = 0;
const vDetail: string[] = [];
for (const q of QUESTIONS) {
  const n = q.options.filter((o) => o.variability).length;
  if (n > 0) {
    vExp += n / 4;
    vDetail.push(`Q${q.id}:${n}/4`);
  }
}
console.log(`\n参考 波乗り(変動シグナル): 期待発火数 ${vExp.toFixed(2)}個 / 判定閾値 3個以上  ${vDetail.join(" ")}`);
