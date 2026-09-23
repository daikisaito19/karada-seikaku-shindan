import { QUESTIONS, type OptionKey } from "./questions";
import { BLIND } from "./blind-answers";
import { TYPE_NAME } from "./engine";

/**
 * 02電池切れ・13スロースタート が、他タイプとどこで情報を共有しているかを洗い出す。
 *  (1) 構造的重複: 同じ設問の中に、両タイプのシグナルが同居しているか
 *  (2) 実際の漏れ: ブラインド回答で選んだ選択肢が、他タイプのシグナルを踏んでいるか
 *  (3) 排他性: そのタイプだけが持つシグナル設問は何問あるか
 */

const FOCUS = ["denchi-gire", "slow-start"];

// タイプ -> そのシグナルを含む設問ID
const sigQuestions: Record<string, Set<number>> = {};
for (const q of QUESTIONS) {
  for (const o of q.options) {
    for (const s of o.signals ?? []) {
      (sigQuestions[s] ??= new Set()).add(q.id);
    }
  }
}

console.log("=== (1) シグナル設問の共有状況 ===\n");
for (const focus of FOCUS) {
  console.log(`--- ${TYPE_NAME[focus]} (シグナル設問: ${[...sigQuestions[focus]].join(", ")}) ---`);
  const rows = Object.keys(sigQuestions)
    .filter((t) => t !== focus)
    .map((t) => {
      const shared = [...sigQuestions[focus]].filter((q) => sigQuestions[t].has(q));
      return { 相手: TYPE_NAME[t], 同居設問数: shared.length, 同居設問: shared.map((q) => `Q${q}`).join(",") };
    })
    .filter((r) => r.同居設問数 > 0)
    .sort((a, b) => b.同居設問数 - a.同居設問数);
  console.table(rows);

  // 排他的なシグナル設問(他のどのタイプのシグナルも含まない設問)
  const exclusive = [...sigQuestions[focus]].filter((qid) => {
    const q = QUESTIONS.find((x) => x.id === qid)!;
    const others = new Set<string>();
    for (const o of q.options) for (const s of o.signals ?? []) if (s !== focus) others.add(s);
    return others.size === 0;
  });
  console.log(`  → 完全に排他的な設問: ${exclusive.length}問 ${exclusive.map((q) => `Q${q}`).join(",") || "(なし)"}\n`);
}

console.log("\n=== (2) ブラインド回答で、他タイプのシグナルを何個踏んだか ===\n");
for (const b of BLIND) {
  if (!FOCUS.includes(b.id)) continue;
  console.log(`--- ${b.label} ---`);
  const leaks: string[] = [];
  let own = 0;
  QUESTIONS.forEach((q, i) => {
    const o = q.options.find((x) => x.key === b.answers[i]);
    for (const s of o?.signals ?? []) {
      if (s === b.id) own++;
      else leaks.push(`Q${q.id}=${b.answers[i]}「${o!.text}」→ ${TYPE_NAME[s]}`);
    }
  });
  console.log(`  自分のシグナル: ${own}個 / 他タイプに渡したシグナル: ${leaks.length}個`);
  leaks.forEach((l) => console.log(`    ${l}`));
  console.log("");
}

console.log("\n=== (3) 参考: 全タイプの「自分のシグナル数 vs 他タイプへの漏れ数」 ===\n");
const rows = BLIND.map((b) => {
  let own = 0;
  let leak = 0;
  QUESTIONS.forEach((q, i) => {
    const o = q.options.find((x) => x.key === b.answers[i]);
    for (const s of o?.signals ?? []) (s === b.id ? own++ : leak++);
  });
  return { タイプ: b.label, 自分: own, 他へ漏れ: leak, 比率: own > 0 ? (own / (own + leak)).toFixed(2) : "0.00" };
});
rows.sort((a, b) => parseFloat(a.比率) - parseFloat(b.比率));
console.table(rows);
