/**
 * 設問を2問修正したときに、ブラインド的中が改善するかを検証する。
 *
 * 診断した衝突:
 *  (1) 13スロースタート の3つのシグナル(Q1=C布団から出るまで長い / Q29=A朝動き出すまで /
 *      Q30=B午後にしたい)は、すべて「朝が弱い」という共有体感であり、
 *      05冷え冷え・12夜型スイッチ も同じ回答をする。→ 13に排他的な決定打が無い。
 *      13の本当に固有な特徴は「朝が遅いこと」ではなく「午後には完全に戻ること」。
 *  (2) 02電池切れ のシグナルは2個しかなく、01充電下手 の一般的な疲労シグナル
 *      (Q1=D / Q10=B / Q17=C)に数で負ける。02に排他的な決定打が必要。
 *
 * 修正:
 *  - Q3 を「午後から夕方にかけての変化」に差し替え (13/01/12 を正の条件で分離)
 *  - Q17 に 02 の排他シグナル「少し動くと息切れする」を追加
 */
import { QUESTIONS as BASE, AXES, type Axis, type OptionKey, type Question } from "./questions";
import { BLIND } from "./blind-answers";
import { AXIS_FAMILY, TYPES, TYPE_NAME, type Family } from "./engine";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const rand = (n: number) => Math.floor(Math.random() * n);

// ---------------- 修正版の設問セット ----------------
const PATCHED: Question[] = BASE.map((q) => {
  if (q.id === 3) {
    return {
      id: 3,
      text: "午後から夕方にかけて、調子は",
      options: [
        { key: "A", text: "朝とあまり変わらない" },
        { key: "B", text: "朝よりはっきり調子が上がる", main: { axis: "QI", v: 2 }, signals: ["slow-start"] },
        { key: "C", text: "だんだん落ちてくる", main: { axis: "QI", v: 2 }, signals: ["juden-beta"] },
        { key: "D", text: "夜に向けてさらに上がっていく", signals: ["yagata-switch"] },
      ],
    } as Question;
  }
  if (q.id === 17) {
    return {
      id: 17,
      text: "休みの日は",
      options: [
        { key: "A", text: "出かけたい" },
        { key: "B", text: "少し動いただけで息が切れる", main: { axis: "QI", v: 2 }, signals: ["denchi-gire"] },
        { key: "C", text: "寝て終わる", main: { axis: "QI", v: 3 }, signals: ["juden-beta"] },
        { key: "D", text: "やりたいことを一気に片づける", signals: ["tsune-accel"] },
      ],
    } as Question;
  }
  return q;
});

// 修正に伴い、ブラインド回答のうち Q3/Q17 は「人物像から見た自然な回答」に読み替える。
// (回答そのものの調整ではなく、設問文が変わったことへの再回答。根拠を明記する)
const REANSWER: Record<string, { q3?: OptionKey; q17?: OptionKey; why: string }> = {
  "juden-beta": { q3: "C", q17: "C", why: "夕方に切れる / 休日は寝て終わる" },
  "denchi-gire": { q3: "A", q17: "B", why: "一日中低いまま / 少し動くと息切れ" },
  "slow-start": { q3: "B", q17: "A", why: "午後には戻る / 休日は出かけられる" },
  "meguri-busoku": { q3: "C", q17: "A", why: "夕方に落ちる / 出かけたい" },
  "karada-jutai": { q3: "A", q17: "A", why: "時間帯では変わらない" },
  "ira-ira": { q3: "A", q17: "A", why: "時間帯では変わらない" },
  "atama-guruguru": { q3: "A", q17: "A", why: "時間帯では変わらない" },
  "tsune-accel": { q3: "A", q17: "D", why: "一日中動ける / 一気に片づける" },
  "shokugo-sleep": { q3: "C", q17: "A", why: "昼食後に落ちる" },
  "mukumi-stock": { q3: "C", q17: "A", why: "夕方に重くなる" },
  "uruoi-busoku": { q3: "A", q17: "A", why: "時間帯では変わらない" },
  hiehie: { q3: "B", q17: "A", why: "冷えた体が日中に温まる(=13と同じ回答をあえて残す)" },
  hotehote: { q3: "A", q17: "A", why: "時間帯では変わらない" },
  "yagata-switch": { q3: "D", q17: "D", why: "夜に向けて上がる" },
  "nami-nori": { q3: "A", q17: "A", why: "日によって違うので一定の傾向なし" },
  "kuse-tsuyoi": { q3: "C", q17: "C", why: "全部強い" },
};

function patchedAnswers(id: string, base: OptionKey[]): OptionKey[] {
  const a = [...base];
  const r = REANSWER[id];
  if (r?.q3) a[2] = r.q3;
  if (r?.q17) a[16] = r.q17;
  return a;
}

// ---------------- 最小限の判定エンジン (案C相当) ----------------
type AxisScores = Record<Axis, number>;
const empty = (): AxisScores => AXES.reduce((a, x) => ({ ...a, [x]: 0 }), {} as AxisScores);

const MAXA = (() => {
  const m = empty();
  for (const q of PATCHED) {
    for (const ax of AXES) {
      let best = 0;
      for (const o of q.options) {
        let v = o.main?.axis === ax ? o.main.v : 0;
        for (const s of o.sub ?? []) if (s.axis === ax) v += s.v * 0.5;
        best = Math.max(best, v);
      }
      m[ax] += best;
    }
  }
  return m;
})();

function pct(answers: OptionKey[]): AxisScores {
  const raw = empty();
  PATCHED.forEach((q, i) => {
    const o = q.options.find((x) => x.key === answers[i]);
    if (!o) return;
    if (o.main) raw[o.main.axis] += o.main.v;
    for (const s of o.sub ?? []) raw[s.axis] += s.v * 0.5;
  });
  const p = empty();
  for (const ax of AXES) p[ax] = MAXA[ax] > 0 ? Math.round((raw[ax] / MAXA[ax]) * 100) : 0;
  return p;
}

function signals(answers: OptionKey[]): Record<string, number> {
  const c: Record<string, number> = {};
  PATCHED.forEach((q, i) => {
    const o = q.options.find((x) => x.key === answers[i]);
    for (const s of o?.signals ?? []) c[s] = (c[s] ?? 0) + 1;
  });
  return c;
}

function variability(answers: OptionKey[]): number {
  let n = 0;
  PATCHED.forEach((q, i) => {
    if (q.options.find((x) => x.key === answers[i])?.variability) n++;
  });
  return n;
}

const TH = { kuse: 70, variability: 3, signalW: 12 };

function decide(answers: OptionKey[]) {
  const p = pct(answers);
  const f: Record<Family, number> = { energy: 0, stress: 0, moisture: 0, temperature: 0 };
  for (const ax of AXES) f[AXIS_FAMILY[ax]] = Math.max(f[AXIS_FAMILY[ax]], p[ax]);
  const sorted = Object.entries(f).sort((a, b) => b[1] - a[1]);
  if (sorted[2][1] >= TH.kuse) return "kuse-tsuyoi";
  if (variability(answers) >= TH.variability) return "nami-nori";
  const sc = signals(answers);
  return TYPES.map((t) => ({ id: t.id, s: p[t.primary] + (sc[t.id] ?? 0) * TH.signalW })).sort(
    (a, b) => b.s - a.s
  )[0].id;
}

// ---------------- 検証 ----------------
console.log("=== 設問2問を修正した場合のブラインド的中 (案C) ===\n");
const rows = BLIND.map((b) => {
  const a = patchedAnswers(b.id, b.answers);
  const got = decide(a);
  return {
    タイプ: b.label,
    結果: got === b.id ? "OK" : `→${TYPE_NAME[got]}`,
    "Q3/Q17の再回答理由": REANSWER[b.id]?.why ?? "",
  };
});
console.table(rows);
console.log(`的中: ${rows.filter((r) => r.結果 === "OK").length}/16`);

console.log("\n=== ランダム回答での分布 (N=20000) ===");
const N = 20000;
const dist: Record<string, number> = {};
for (let i = 0; i < N; i++) {
  const t = decide(PATCHED.map(() => KEYS[rand(4)]));
  dist[t] = (dist[t] ?? 0) + 1;
}
console.table(
  Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .map(([id, c]) => ({ タイプ: TYPE_NAME[id], 出現率: ((c / N) * 100).toFixed(1) + "%" }))
);

console.log("\n=== 安定性と単調性 ===");
function graded(base: OptionKey[], keep: number): OptionKey[] {
  const idx = base.map((a, i) => (a !== "A" ? i : -1)).filter((i) => i >= 0);
  const k = new Set([...idx].sort(() => Math.random() - 0.5).slice(0, Math.round(idx.length * keep)));
  return base.map((a, i) => (idx.includes(i) && !k.has(i) ? "A" : a));
}
const res = BLIND.map((b) => {
  const a = patchedAnswers(b.id, b.answers);
  const base = decide(a);
  const stab = (kk: number) => {
    let same = 0;
    for (let i = 0; i < 600; i++) {
      const x = [...a];
      const s = new Set<number>();
      while (s.size < kk) s.add(rand(30));
      for (const j of s) x[j] = KEYS[rand(4)];
      if (decide(x) === base) same++;
    }
    return Math.round((same / 600) * 100);
  };
  const lv: string[] = [];
  let prev = -1;
  let mono = true;
  for (const r of [0.25, 0.5, 0.75, 1.0]) {
    let hit = 0;
    for (let i = 0; i < 300; i++) if (decide(graded(a, r)) === b.id) hit++;
    const v = Math.round((hit / 300) * 100);
    lv.push(v + "%");
    if (v < prev - 5) mono = false;
    prev = v;
  }
  return { タイプ: b.label, k1: stab(1), k2: stab(2), k3: stab(3), 強度推移: lv.join(" → "), 単調: mono ? "OK" : "▲逆転" };
});
console.table(res);
console.log(
  `平均 k1:${(res.reduce((s, r) => s + r.k1, 0) / 16).toFixed(0)}% ` +
    `k2:${(res.reduce((s, r) => s + r.k2, 0) / 16).toFixed(0)}% ` +
    `k3:${(res.reduce((s, r) => s + r.k3, 0) / 16).toFixed(0)}% / ` +
    `逆転:${res.filter((r) => r.単調 === "▲逆転").length}/16`
);
