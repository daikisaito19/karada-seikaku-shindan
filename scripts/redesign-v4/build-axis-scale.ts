/**
 * src/data/axisScale.ts に載せる「表示用スケール」を生成する。
 *
 * ── なぜ必要か ─────────────────────────────────────────────
 * エネルギー・流れ・うるおいの3メーターは `100 - 不足度` という一方向の量で、
 * 「不足が無い＝右端」になる。調査（Phase 5-2 事前調査）で実測したところ、
 * 現実的な回答傾向では
 *
 *   エネルギーがHIGH側 99% / 流れがFLOW側 94% / うるおいがWET側 95%
 *   さらに42%の人がどれかのバーで振り切れ(=100)を見る
 *
 * という状態だった。中央の50が「平均的な人」を意味していないため、
 * ほぼ全員が「3本とも右寄り＝good」に見えるグラフを受け取ってしまう。
 *
 * そこで、生の値をそのまま出すのをやめ、
 * 「同じ診断を受けた人の分布の中で、自分がどのあたりか」に置き換える。
 * これは表示の変換だけで、判定には一切関与しない。
 *
 * ── 温度を含めない理由 ─────────────────────────────────────
 * 温度だけは `50 + (YIN - YANG)/2` という、対立する2軸の差をとる真の双方向軸で、
 * 50がもともと正しい中立点になっている。ここを分布で正規化すると、
 * YIN=0 かつ YANG=0（＝熱の申告が一切ない）13スロースタートが
 * 「HOT寄り」と表示されるなど、意味のない信号が生まれることを確認している。
 * よって温度は変換対象から外す。
 *
 * ── 母集団の定義 ───────────────────────────────────────────
 * 実ユーザーの回答は収集していない（収集する仕組みも作らない）。
 * 代わりに、決定論的な疑似乱数で「想定回答者」を生成する。
 *
 *   各設問について、確率 P_FIRST で先頭の選択肢（＝「あてはまらない」寄り）を選び、
 *   そうでなければ、その設問の全選択肢から一様に選ぶ。
 *
 * 一様ランダムではなく先頭寄りにするのは、実際の回答者が
 * 「該当なし」を選ぶ頻度が高く、一様乱数では分布が現実から外れるため。
 * P_FIRST=0.6 は 0.4 / 0.6 / 0.8 を比較したうえでの中央値。
 * （この値を動かしても16タイプが一意に分かれることは check-axis-scale で確認できる）
 *
 * 乱数は固定シードのLCGなので、何度回しても同じ表が出る。
 *
 * ── 出力 ───────────────────────────────────────────────────
 * 軸ごとに「生の値 v(0-100) → 母集団内の位置(0-100)」の対応表を101要素で出す。
 * 同じ値の人が多数いる場合（100に張り付くなど）は、その塊の中央の順位を割り当てる。
 *
 *   npx tsx scripts/redesign-v4/build-axis-scale.ts          表を出力
 *   npx tsx scripts/redesign-v4/build-axis-scale.ts --check   既存の表と一致するか検証
 */
import { QUESTIONS } from "../../src/data/questions";
import { judge, computeVisibleAxes, type Answers } from "../../src/data/scoring";
import { DISPLAY_SCALE, SCALED_AXES, type ScaledAxis } from "../../src/data/axisScale";

/** 先頭の選択肢を選ぶ確率 */
export const P_FIRST = 0.6;
/** 生成する想定回答者の数 */
export const POPULATION = 40000;
/** 乱数シード。これを変えると表が変わる */
export const SEED = 2024;

function buildPopulation(): Record<ScaledAxis, number[]> {
  let s = SEED;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const pop: Record<ScaledAxis, number[]> = { energy: [], flow: [], moisture: [] };
  for (let i = 0; i < POPULATION; i++) {
    const answers = QUESTIONS.map((q) =>
      rnd() < P_FIRST ? q.options[0].key : q.options[Math.floor(rnd() * q.options.length)].key
    ) as Answers;
    const v = computeVisibleAxes(judge(answers).percent);
    pop.energy.push(v.energy);
    pop.flow.push(v.flow);
    pop.moisture.push(v.moisture);
  }
  return pop;
}

/**
 * 生の値 0-100 それぞれについて、母集団内での位置を出す。
 * 同値が塊になっている場合は、その塊の先頭順位と末尾順位の中間を使う。
 * （100に張り付いた人全員が「100%の位置」になるのを避けるため）
 */
function buildTable(values: number[]): number[] {
  const n = values.length;
  const below = new Array(102).fill(0); // below[v] = v未満の人数
  const equal = new Array(101).fill(0);
  for (const v of values) equal[Math.max(0, Math.min(100, Math.round(v)))]++;
  for (let v = 1; v <= 101; v++) below[v] = below[v - 1] + (equal[v - 1] ?? 0);
  return Array.from({ length: 101 }, (_, v) =>
    Math.max(0, Math.min(100, Math.round(((below[v] + equal[v] / 2) / n) * 100)))
  );
}

const pop = buildPopulation();
const table = Object.fromEntries(
  SCALED_AXES.map((axis) => [axis, buildTable(pop[axis])])
) as Record<ScaledAxis, number[]>;

if (process.argv.includes("--check")) {
  let ng = 0;
  for (const axis of SCALED_AXES) {
    const got = table[axis];
    const has = DISPLAY_SCALE[axis];
    const same = got.length === has.length && got.every((v, i) => v === has[i]);
    console.log(`${axis.padEnd(10)} ${same ? "✅ 一致" : "❌ 不一致"}`);
    if (!same) {
      ng++;
      const diff = got.map((v, i) => (v === has[i] ? null : `v=${i}: 表=${has[i]} 再生成=${v}`)).filter(Boolean);
      console.log("  " + diff.slice(0, 10).join("\n  "));
    }
  }
  console.log(
    ng === 0
      ? `\n✅ src/data/axisScale.ts は P_FIRST=${P_FIRST} / POPULATION=${POPULATION} / SEED=${SEED} から再生成できます`
      : `\n❌ ${ng}軸が不一致`
  );
  process.exit(ng === 0 ? 0 : 1);
}

// 分位点（表の根拠として人間が読む用）
console.log(`// P_FIRST=${P_FIRST} POPULATION=${POPULATION} SEED=${SEED}`);
for (const axis of SCALED_AXES) {
  const sorted = [...pop[axis]].sort((a, b) => a - b);
  const q = (f: number) => sorted[Math.floor(f * (sorted.length - 1))];
  console.log(
    `// ${axis.padEnd(9)} p10=${q(0.1)} p25=${q(0.25)} p50=${q(0.5)} p75=${q(0.75)} p90=${q(0.9)}`
  );
}
console.log();
for (const axis of SCALED_AXES) {
  console.log(`  ${axis}: [`);
  for (let i = 0; i < 101; i += 10) {
    console.log("    " + table[axis].slice(i, i + 10).map((v) => String(v).padStart(3)).join(", ") + ",");
  }
  console.log("  ],");
}
