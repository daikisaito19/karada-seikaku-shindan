import { QUESTIONS, type OptionKey } from "./questions";
import { determineType, computePercentScores } from "./scoring";
import { TYPE_DEFS } from "./typeDefs";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const randomAnswers = () => QUESTIONS.map(() => KEYS[rand(4)]);

// gateの軸条件だけを見て「あと少しで通った」かを判定するための簡易チェック。
// 各TypeDefのgate関数はブラックボックスなので、代表的な軸しきい値との差を近似評価する。
const AXIS_THRESHOLDS: Record<string, { axis: string; min: number }[]> = {
  "juden-beta": [{ axis: "QI", min: 48 }, { axis: "SP", min: 40 }],
  "denchi-gire": [{ axis: "QI", min: 60 }],
  "shokugo-sleep": [{ axis: "SP", min: 35 }, { axis: "DAM", min: 30 }],
  "mukumi-stock": [{ axis: "DAM", min: 55 }],
  hiehie: [{ axis: "YANG", min: 45 }],
  hotehote: [{ axis: "YIN", min: 45 }],
  "karada-jutai": [{ axis: "ST", min: 35 }, { axis: "STA", min: 32 }],
  "ira-ira": [{ axis: "ST", min: 55 }],
  "uruoi-busoku": [{ axis: "BL", min: 35 }, { axis: "YIN", min: 35 }],
  "meguri-busoku": [{ axis: "BL", min: 35 }, { axis: "QI", min: 35 }],
  "atama-guruguru": [{ axis: "ST", min: 38 }],
  "yagata-switch": [{ axis: "YIN", min: 38 }],
  "slow-start": [{ axis: "YANG", min: 32 }, { axis: "QI", min: 28 }],
  "tsune-accel": [{ axis: "ST", min: 38 }],
};

const N = 20000;
let kuseCount = 0;
let nearMissWithin5 = 0;
let nearMissWithin10 = 0;
const nearMissDetail: string[] = [];

for (let i = 0; i < N; i++) {
  const a = randomAnswers();
  const { typeId } = determineType(a);
  if (typeId !== "kuse-tsuyoi") continue;
  kuseCount++;
  const p = computePercentScores(a);

  // 各タイプについて「軸条件はどれだけ惜しかったか」を評価(行動シグナルは無視した楽観評価)
  let minGap = Infinity;
  let closestType = "";
  for (const [id, conds] of Object.entries(AXIS_THRESHOLDS)) {
    const gaps = conds.map((c) => c.min - (p as any)[c.axis]);
    const worstGap = Math.max(...gaps); // 一番届いていない軸の差
    if (worstGap < minGap) {
      minGap = worstGap;
      closestType = id;
    }
  }
  if (minGap <= 5) {
    nearMissWithin5++;
    if (nearMissDetail.length < 8) {
      nearMissDetail.push(`closest=${closestType}, gap=${minGap.toFixed(0)}pt, profile=${JSON.stringify(p)}`);
    }
  }
  if (minGap <= 10) nearMissWithin10++;
}

console.log(`クセ強ミックス総数: ${kuseCount}`);
console.log(
  `うち、いずれかのタイプの軸条件まで5pt以内だった(=行動シグナルさえ満たせば入っていたかもしれない)人: ${nearMissWithin5} (${(
    (nearMissWithin5 / kuseCount) *
    100
  ).toFixed(1)}%)`
);
console.log(
  `うち、10pt以内: ${nearMissWithin10} (${((nearMissWithin10 / kuseCount) * 100).toFixed(1)}%)`
);
console.log("\n近接サンプル例:");
nearMissDetail.forEach((d) => console.log(" ", d));
