import { QUESTIONS, AXES, type Axis, type OptionKey } from "./questions";
import { BLIND } from "./blind";
import { decide, pctAxes, TYPES, TYPE_NAME, ALL_IDS } from "./engine";

/**
 * BL軸の追加監査(読み取りのみ。設問・配点は一切変更しない)。
 *
 * 目的は「理論最大値が小さい」ことではなく、
 * 「実際の回答に対してBL軸が過剰に働いていないか」を確認すること。
 */

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);
const line = (s: string) => console.log(`\n${"=".repeat(4)} ${s} ${"=".repeat(4)}\n`);

const N = 30000;
const data: { a: OptionKey[]; p: Record<Axis, number>; t: string }[] = [];
for (let i = 0; i < N; i++) {
  const a = QUESTIONS.map(() => KEYS[rand(4)]);
  data.push({ a, p: pctAxes(a), t: decide(a).typeId });
}

const stat = (xs: number[]) => {
  const s = [...xs].sort((x, y) => x - y);
  const mean = s.reduce((t, v) => t + v, 0) / s.length;
  const sd = Math.sqrt(s.reduce((t, v) => t + (v - mean) ** 2, 0) / s.length);
  return {
    平均: mean.toFixed(1),
    中央値: s[Math.floor(s.length / 2)].toFixed(0),
    標準偏差: sd.toFixed(1),
    上位10p: s[Math.floor(s.length * 0.9)].toFixed(0),
    最大値: s[s.length - 1].toFixed(0),
  };
};

// ---------------------------------------------------------------- 1
line(`1. 9軸の実スコア分布 (ランダム回答 N=${N})`);
console.table(
  AXES.map((ax) => ({
    軸: ax,
    ...stat(data.map((d) => d.p[ax])),
    主軸とするタイプ: TYPES.filter((t) => t.primary === ax).map((t) => t.name).join(",") || "-",
  }))
);

// ---------------------------------------------------------------- 2
line("2. 各軸をprimaryとするタイプが判定される割合");
const typeCount: Record<string, number> = {};
for (const d of data) typeCount[d.t] = (typeCount[d.t] ?? 0) + 1;
console.table(
  AXES.map((ax) => {
    const owners = TYPES.filter((t) => t.primary === ax);
    const share = owners.reduce((s, t) => s + (typeCount[t.id] ?? 0), 0) / N;
    return {
      軸: ax,
      タイプ数: owners.length,
      合計出現率: (share * 100).toFixed(1) + "%",
      "1タイプあたり": owners.length ? ((share / owners.length) * 100).toFixed(1) + "%" : "-",
      内訳: owners.map((t) => `${t.name}:${(((typeCount[t.id] ?? 0) / N) * 100).toFixed(1)}%`).join(" "),
    };
  })
);

// ---------------------------------------------------------------- 3a
line("3a. 軸のパーセンタイル別に見た「その軸をprimaryとするタイプ」の出現率");
console.log("※ 軸ごとに分布が違うため、生の%ではなく『その軸の中での順位(パーセンタイル)』で揃えて比較する\n");

const BANDS: [string, number, number][] = [
  ["下位50%", 0, 0.5],
  ["50-75%", 0.5, 0.75],
  ["75-90%", 0.75, 0.9],
  ["上位10%", 0.9, 1.0],
];
const bandRows = AXES.map((ax) => {
  const sorted = [...data].sort((x, y) => x.p[ax] - y.p[ax]);
  const owners = new Set(TYPES.filter((t) => t.primary === ax).map((t) => t.id));
  const r: Record<string, string> = { 軸: ax, 主軸タイプ数: String(owners.size) };
  for (const [label, lo, hi] of BANDS) {
    const slice = sorted.slice(Math.floor(N * lo), Math.floor(N * hi));
    const hit = slice.filter((d) => owners.has(d.t)).length;
    r[label] = ((hit / slice.length) * 100).toFixed(1) + "%";
  }
  return r;
});
console.table(bandRows);

// ---------------------------------------------------------------- 3b
line("3b. 『BLが高いだけ』のケースと、他軸が同程度に高いケースの比較");
console.log("各軸について「その軸が上位10%、かつ他8軸はすべて中央値以下」のケースを抽出\n");

const medians: Record<Axis, number> = {} as Record<Axis, number>;
const p90: Record<Axis, number> = {} as Record<Axis, number>;
for (const ax of AXES) {
  const s = data.map((d) => d.p[ax]).sort((a, b) => a - b);
  medians[ax] = s[Math.floor(s.length / 2)];
  p90[ax] = s[Math.floor(s.length * 0.9)];
}
console.table(
  AXES.map((ax) => {
    const pure = data.filter(
      (d) => d.p[ax] >= p90[ax] && AXES.every((o) => o === ax || d.p[o] <= medians[o])
    );
    const owners = new Set(TYPES.filter((t) => t.primary === ax).map((t) => t.id));
    const hit = pure.filter((d) => owners.has(d.t)).length;
    const dist: Record<string, number> = {};
    for (const d of pure) dist[d.t] = (dist[d.t] ?? 0) + 1;
    const top = Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 2);
    return {
      軸: ax,
      該当件数: pure.length,
      "主軸タイプになる率": pure.length ? ((hit / pure.length) * 100).toFixed(1) + "%" : "-",
      実際の着地先: top.map(([id, c]) => `${TYPE_NAME[id]}${((c / pure.length) * 100).toFixed(0)}%`).join(" "),
    };
  })
);

// ---------------------------------------------------------------- 3c
line("3c. 1問あたりの『判定を変える力』の実測");
console.log("ランダムな回答から1問だけを、その軸を最大化する選択肢に変えたとき、型が変わる割合\n");
const SAMPLE = 2000;
console.table(
  AXES.map((ax) => {
    const qIdx: number[] = [];
    QUESTIONS.forEach((q, i) => {
      const best = Math.max(
        ...q.options.map((o) => (o.main?.axis === ax ? o.main.v : 0) + (o.sub ?? []).reduce((s, x) => s + (x.axis === ax ? x.v * 0.5 : 0), 0))
      );
      if (best > 0) qIdx.push(i);
    });
    let changed = 0;
    let total = 0;
    for (let i = 0; i < SAMPLE; i++) {
      const base = data[rand(N)];
      const qi = qIdx[rand(qIdx.length)];
      const q = QUESTIONS[qi];
      let bestKey = q.options[0].key;
      let bestV = -1;
      for (const o of q.options) {
        const v = (o.main?.axis === ax ? o.main.v : 0) + (o.sub ?? []).reduce((s, x) => s + (x.axis === ax ? x.v * 0.5 : 0), 0);
        if (v > bestV) {
          bestV = v;
          bestKey = o.key;
        }
      }
      if (base.a[qi] === bestKey) continue;
      const a2 = [...base.a];
      a2[qi] = bestKey;
      total++;
      if (decide(a2).typeId !== base.t) changed++;
    }
    return {
      軸: ax,
      寄与設問数: qIdx.length,
      "1問変更で型が変わる率": total ? ((changed / total) * 100).toFixed(1) + "%" : "-",
    };
  })
);

// ---------------------------------------------------------------- 4
line("4. ブラインド16人物像の9軸最終スコア");
console.table(
  BLIND.map((b) => {
    const p = pctAxes(b.answers);
    const def = TYPES.find((t) => t.id === b.id);
    const sorted = AXES.map((ax) => ({ ax, v: p[ax] })).sort((x, y) => y.v - x.v);
    const primary = def ? def.primary : "-";
    const primaryV = def ? p[def.primary] : 0;
    const second = sorted.find((s) => s.ax !== primary);
    return {
      タイプ: b.label,
      primary軸: primary,
      primary値: def ? primaryV : "-",
      最高軸: `${sorted[0].ax}:${sorted[0].v}`,
      "2位軸": second ? `${second.ax}:${second.v}` : "-",
      "primaryと2位の差": def && second ? primaryV - second.v : "-",
      判定: decide(b.answers).typeId === b.id ? "OK" : "NG",
    };
  })
);

line("4b. ブラインド16人物像の9軸フルスコア");
console.table(
  BLIND.map((b) => {
    const p = pctAxes(b.answers);
    const r: Record<string, string | number> = { タイプ: b.label };
    for (const ax of AXES) r[ax] = p[ax];
    return r;
  })
);

// ---------------------------------------------------------------- BL特化
line("BL特化: ブラインド16人物像でBLがどれだけ立っているか");
console.table(
  BLIND.map((b) => {
    const p = pctAxes(b.answers);
    const r = decide(b.answers);
    const meguri = r.ranking.find((x) => x.id === "meguri-busoku");
    const own = r.ranking.find((x) => x.id === b.id);
    return {
      タイプ: b.label,
      BL値: p.BL,
      "めぐり不足のスコア": meguri ? meguri.score.toFixed(1) : "-",
      "自分のスコア": own ? own.score.toFixed(1) : "(複合型)",
      差: own && meguri ? (own.score - meguri.score).toFixed(1) : "-",
    };
  })
);

line("参考: ランダム分布");
console.table(
  ALL_IDS.map((id) => ({ タイプ: TYPE_NAME[id], 出現率: (((typeCount[id] ?? 0) / N) * 100).toFixed(1) + "%" })).sort(
    (a, b) => parseFloat(b.出現率) - parseFloat(a.出現率)
  )
);
