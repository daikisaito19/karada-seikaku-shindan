import { QUESTIONS, type OptionKey } from "./questions";
import { determineType, computePercentScores } from "./scoring";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);

/**
 * 「そのタイプの核となる軸を強くすればするほど、そのタイプになるはず」
 * という単調性が成立しているかを確認する。
 * 成立していない = 特徴を強く出すほどそのタイプから弾かれる、という致命的な構造欠陥。
 */
const N = 80000;
const buckets: Record<string, { total: number; hit: number }[]> = {};
const BUCKET_EDGES = [0, 20, 30, 40, 50, 60, 70, 80, 101];

function bucketIndex(v: number) {
  for (let i = 0; i < BUCKET_EDGES.length - 1; i++) {
    if (v >= BUCKET_EDGES[i] && v < BUCKET_EDGES[i + 1]) return i;
  }
  return BUCKET_EDGES.length - 2;
}

const TARGETS: { type: string; axis: string; label: string }[] = [
  { type: "juden-beta", axis: "QI", label: "充電下手 / QI(元気のなさ)" },
  { type: "denchi-gire", axis: "QI", label: "電池切れ / QI(元気のなさ)" },
  { type: "ira-ira", axis: "ST", label: "イライラ充満 / ST(ストレス)" },
  { type: "atama-guruguru", axis: "ST", label: "頭ぐるぐる / ST(ストレス)" },
  { type: "hiehie", axis: "YANG", label: "冷え冷え / YANG(冷え)" },
  { type: "hotehote", axis: "YIN", label: "ほてほて / YIN(ほてり)" },
  { type: "uruoi-busoku", axis: "BL", label: "うるおい不足 / BL(乾燥)" },
  { type: "mukumi-stock", axis: "DAM", label: "むくみストック / DAM(溜め込み)" },
];

for (const t of TARGETS) buckets[t.type] = BUCKET_EDGES.slice(0, -1).map(() => ({ total: 0, hit: 0 }));

for (let i = 0; i < N; i++) {
  const answers = QUESTIONS.map(() => KEYS[rand(4)]);
  const p = computePercentScores(answers);
  const { typeId } = determineType(answers);
  for (const t of TARGETS) {
    const bi = bucketIndex((p as any)[t.axis]);
    buckets[t.type][bi].total++;
    if (typeId === t.type) buckets[t.type][bi].hit++;
  }
}

console.log("=== 核となる軸の強さ別に見た「そのタイプになる確率」 ===");
console.log("(本来は軸が強いほど確率が上がるはず。途中で下がる=特徴を強く出すほど弾かれている)\n");

for (const t of TARGETS) {
  const row: Record<string, string> = {};
  buckets[t.type].forEach((b, i) => {
    const lo = BUCKET_EDGES[i];
    const hi = BUCKET_EDGES[i + 1] - 1;
    const key = `${lo}-${Math.min(hi, 100)}%`;
    row[key] = b.total < 50 ? "-" : ((b.hit / b.total) * 100).toFixed(1) + "%";
  });
  console.log(t.label);
  console.log("  " + Object.entries(row).map(([k, v]) => `${k}:${v}`).join("  "));
  console.log("");
}
