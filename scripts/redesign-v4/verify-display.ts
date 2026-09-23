/**
 * 表示用スケール（src/data/axisScale.ts）の検証。
 *
 * verify-src.ts は computeVisibleAxes() の生の値を見ている。
 * 画面に出るのはそれを axisScale で変換した値なので、
 * 「実際にユーザーが見る4軸」はこちらで確認する。
 *
 *   npx tsx scripts/redesign-v4/verify-display.ts
 */
import { QUESTIONS } from "../../src/data/questions";
import { judge, computeVisibleAxes, type Answers } from "../../src/data/scoring";
import { DISPLAY_SCALE, SCALED_AXES, scaleVisibleAxes } from "../../src/data/axisScale";
import { RESULT_TYPES } from "../../src/data/resultTypes";
import { BLIND } from "./blind";

const NAME: Record<string, string> = Object.fromEntries(
  RESULT_TYPES.map((t) => [t.id, `${String(t.no).padStart(2, "0")} ${t.name}`])
);
let ng = 0;
const check = (label: string, ok: boolean, detail: string) => {
  console.log(`${ok ? "✅" : "❌"} ${label}: ${detail}`);
  if (!ok) ng++;
};

function positionLabel(v: number, l: string, r: string) {
  const d = Math.abs(v - 50);
  if (d <= 7) return "まんなか";
  const s = v < 50 ? l : r;
  if (d <= 20) return `やや${s}寄り`;
  if (d <= 35) return `${s}寄り`;
  return `かなり${s}寄り`;
}
const labels = (v: ReturnType<typeof computeVisibleAxes>) => [
  positionLabel(v.energy, "LOW", "HIGH"),
  positionLabel(v.flow, "STUCK", "FLOW"),
  positionLabel(v.temperature, "COOL", "HOT"),
  positionLabel(v.moisture, "DRY", "WET"),
];

console.log("==== 1. スケール表の健全性 ====\n");
for (const axis of SCALED_AXES) {
  const t = DISPLAY_SCALE[axis];
  check(`${axis} の要素数`, t.length === 101, `${t.length}要素 (0-100)`);
  check(
    `${axis} が単調非減少`,
    t.every((v, i) => i === 0 || v >= t[i - 1]),
    "生の値が大きいほど表示も右へ"
  );
  check(`${axis} が0-100に収まる`, t.every((v) => v >= 0 && v <= 100), "範囲OK");
}

console.log("\n==== 2. 温度は変換しない ====\n");
const tempSame = BLIND.every((b) => {
  const raw = computeVisibleAxes(judge(b.answers as Answers).percent);
  return scaleVisibleAxes(raw).temperature === raw.temperature;
});
check("温度が生の値のまま", tempSame, "ブラインド16件すべてで一致");

console.log("\n==== 3. 16タイプの表示 ====\n");
const rows = BLIND.map((b) => {
  const j = judge(b.answers as Answers);
  const raw = computeVisibleAxes(j.percent);
  const scaled = scaleVisibleAxes(raw);
  return { id: j.typeId, name: NAME[j.typeId], raw, scaled, before: labels(raw), after: labels(scaled) };
}).sort((a, b) => a.name.localeCompare(b.name));

console.table(
  rows.map((r) => ({
    タイプ: r.name,
    エネルギー: r.after[0],
    流れ: r.after[1],
    温度: r.after[2],
    うるおい: r.after[3],
  }))
);

const uniqBefore = new Set(rows.map((r) => r.before.join("|")));
const uniqAfter = new Set(rows.map((r) => r.after.join("|")));
check(
  "16タイプのラベルが全て別の並び",
  uniqAfter.size === 16,
  `現行 ${uniqBefore.size}/16 → 新 ${uniqAfter.size}/16`
);
if (uniqAfter.size < 16) {
  const m: Record<string, string[]> = {};
  for (const r of rows) (m[r.after.join("|")] ??= []).push(r.name);
  for (const [k, v] of Object.entries(m)) if (v.length > 1) console.log(`   重複: ${k} -> ${v.join(" / ")}`);
}

console.log("\n==== 4. 偏りの解消 ====\n");
let s = 31337;
const rnd = () => {
  s = (s * 1103515245 + 12345) % 2147483648;
  return s / 2147483648;
};
const N = 20000;
let hiE = 0,
  hiF = 0,
  hiM = 0,
  pinOld = 0,
  pinNew = 0;
for (let i = 0; i < N; i++) {
  const a = QUESTIONS.map((q) =>
    rnd() < 0.6 ? q.options[0].key : q.options[Math.floor(rnd() * q.options.length)].key
  ) as Answers;
  const raw = computeVisibleAxes(judge(a).percent);
  const sc = scaleVisibleAxes(raw);
  if (sc.energy > 57) hiE++;
  if (sc.flow > 57) hiF++;
  if (sc.moisture > 57) hiM++;
  if ([raw.energy, raw.flow, raw.moisture].some((v) => v === 0 || v === 100)) pinOld++;
  if ([sc.energy, sc.flow, sc.moisture].some((v) => v === 0 || v === 100)) pinNew++;
}
const pc = (n: number) => `${((n / N) * 100).toFixed(0)}%`;
check("エネルギーが右寄りに偏らない", hiE / N < 0.6, `${pc(hiE)} (現行99%)`);
check("流れが右寄りに偏らない", hiF / N < 0.6, `${pc(hiF)} (現行94%)`);
check("うるおいが右寄りに偏らない", hiM / N < 0.6, `${pc(hiM)} (現行95%)`);
check("端への張り付きが減る", pinNew < pinOld, `${pc(pinOld)} → ${pc(pinNew)}`);

console.log(ng === 0 ? "\n==== 総合: 全項目パス ====" : `\n==== 総合: ${ng}件 NG ====`);
process.exit(ng === 0 ? 0 : 1);
