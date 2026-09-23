import { QUESTIONS, AXES } from "./questions";
import { TYPES } from "./engine";
const max: Record<string, number> = {};
const qcount: Record<string, number> = {};
for (const ax of AXES) { max[ax] = 0; qcount[ax] = 0; }
for (const q of QUESTIONS) for (const ax of AXES) {
  let best = 0;
  for (const o of q.options) {
    let v = o.main?.axis === ax ? o.main.v : 0;
    for (const s of o.sub ?? []) if (s.axis === ax) v += s.v * 0.5;
    best = Math.max(best, v);
  }
  max[ax] += best;
  if (best > 0) qcount[ax]++;
}
console.log("=== 軸の理論最大値と寄与設問数 ===");
console.table(AXES.map((ax) => ({
  軸: ax,
  理論最大値: max[ax],
  寄与設問数: qcount[ax],
  "1問あたりの%影響": max[ax] > 0 ? (100 / max[ax]).toFixed(1) + "pt/点" : "-",
  主軸とするタイプ: TYPES.filter((t) => t.primary === ax).map((t) => t.name).join(",") || "-",
})));
