/**
 * v3プロトタイプ: 30問 / 9軸 / タイプ固有シグナル付き
 *
 * 設計方針:
 *  - 各選択肢は「主軸(main)」と「副軸(sub)」を持つ。方式1/2/3の比較のため分けて保持する。
 *  - 各選択肢は「その回答をする人はこのタイプっぽい」というシグナル(signals)を持つ。
 *    案A/B/C の3つの判定方式は、すべてこの同じ設問セットの上で動かす。
 */

export type Axis = "QI" | "SP" | "ST" | "BL" | "JIN" | "YANG" | "YIN" | "DAM" | "STA";
export const AXES: Axis[] = ["QI", "SP", "ST", "BL", "JIN", "YANG", "YIN", "DAM", "STA"];

export type OptionKey = "A" | "B" | "C" | "D";

export interface Opt {
  key: OptionKey;
  text: string;
  /** 主軸: この選択肢が一番強く意味するもの */
  main?: { axis: Axis; v: number };
  /** 副軸: 意味としては関係するが、弱く効かせるべきもの */
  sub?: { axis: Axis; v: number }[];
  /** この回答が示すタイプ(複数可) */
  signals?: string[];
  /** 「日によって変わる」ことを示す回答か */
  variability?: boolean;
}

export interface Question {
  id: number;
  text: string;
  /** 系統識別シグナル設問か(案Aで使う) */
  discriminatorFor?: "energy" | "stress" | "moisture" | "temperature";
  options: [Opt, Opt, Opt, Opt];
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "朝起きたとき",
    options: [
      { key: "A", text: "起きたらすぐ動ける" },
      { key: "B", text: "もう少し寝ていたい", main: { axis: "QI", v: 1 } },
      { key: "C", text: "布団から出るまでが長い", main: { axis: "QI", v: 2 }, sub: [{ axis: "YANG", v: 1 }], signals: ["slow-start"] },
      { key: "D", text: "寝たのに疲れが残っている", main: { axis: "QI", v: 3 }, signals: ["juden-beta"] },
    ],
  },
  {
    id: 2,
    text: "食べたあと",
    options: [
      { key: "A", text: "とくに変わらない" },
      { key: "B", text: "がくっと眠くなる", main: { axis: "SP", v: 3 }, sub: [{ axis: "QI", v: 1 }], signals: ["shokugo-sleep"] },
      { key: "C", text: "お腹が重くて動きたくない", main: { axis: "SP", v: 3 }, sub: [{ axis: "DAM", v: 1 }], signals: ["shokugo-sleep"] },
      { key: "D", text: "まだ食べられる", sub: [{ axis: "DAM", v: 1 }] },
    ],
  },
  {
    id: 3,
    text: "長い時間、同じ姿勢でいると",
    options: [
      { key: "A", text: "とくに何も感じない" },
      { key: "B", text: "体がこわばって動かしにくい", main: { axis: "STA", v: 4 }, signals: ["karada-jutai"] },
      { key: "C", text: "足や顔がむくむ", main: { axis: "DAM", v: 2 }, signals: ["mukumi-stock"] },
      { key: "D", text: "眠くなってくる", main: { axis: "QI", v: 1 } },
    ],
  },
  {
    id: 4,
    text: "食事と、その日の調子の関係は",
    options: [
      { key: "A", text: "とくに関係ない" },
      { key: "B", text: "食べた量で午後の調子が決まる", main: { axis: "SP", v: 3 }, signals: ["shokugo-sleep"] },
      { key: "C", text: "ちゃんと食べないと力が出ない", main: { axis: "BL", v: 2 }, signals: ["meguri-busoku"] },
      { key: "D", text: "食べる時間がずれると崩れる", main: { axis: "SP", v: 2 } },
    ],
  },
  {
    id: 5,
    text: "冬は",
    options: [
      { key: "A", text: "とくに苦手ではない" },
      { key: "B", text: "とにかく寒がり", main: { axis: "YANG", v: 3 }, signals: ["hiehie"] },
      { key: "C", text: "手先・足先が冷たい", main: { axis: "YANG", v: 3 }, signals: ["hiehie"] },
      { key: "D", text: "冬より夏のほうがつらい", main: { axis: "YIN", v: 2 } },
    ],
  },
  {
    id: 6,
    text: "夏は",
    options: [
      { key: "A", text: "とくに問題ない" },
      { key: "B", text: "暑さに弱い", main: { axis: "YIN", v: 2 } },
      { key: "C", text: "顔や上半身がカーッと熱くなる", main: { axis: "YIN", v: 3 }, signals: ["hotehote"] },
      { key: "D", text: "冷房のほうがつらい", main: { axis: "YANG", v: 2 } },
    ],
  },
  {
    // === 系統識別シグナル(ストレス系) ===
    id: 7,
    text: "ストレスがかかったとき、最初に出るのは",
    discriminatorFor: "stress",
    options: [
      { key: "A", text: "肩や背中が固まる、体が重くなる", main: { axis: "ST", v: 3 }, sub: [{ axis: "STA", v: 2 }], signals: ["karada-jutai"] },
      { key: "B", text: "イラッとする、口調がきつくなる", main: { axis: "ST", v: 3 }, signals: ["ira-ira"] },
      { key: "C", text: "同じことを何度も考えてしまう", main: { axis: "ST", v: 3 }, signals: ["atama-guruguru"] },
      { key: "D", text: "とにかく動いて予定を埋めたくなる", main: { axis: "ST", v: 3 }, signals: ["tsune-accel"] },
    ],
  },
  {
    id: 8,
    text: "嫌なことがあったあと",
    options: [
      { key: "A", text: "切り替えて次に行く", signals: ["tsune-accel"] },
      { key: "B", text: "しばらく頭から離れない", main: { axis: "ST", v: 2 }, signals: ["atama-guruguru"] },
      { key: "C", text: "誰かに話すとスッキリする", main: { axis: "ST", v: 1 }, signals: ["ira-ira"] },
      { key: "D", text: "言わずに自分の中にしまう", main: { axis: "STA", v: 2 }, sub: [{ axis: "ST", v: 1 }], signals: ["karada-jutai"] },
    ],
  },
  {
    id: 9,
    text: "肩や首のこりは",
    options: [
      { key: "A", text: "あまり気にならない" },
      { key: "B", text: "忙しいときだけ凝る", main: { axis: "ST", v: 2 }, sub: [{ axis: "STA", v: 1 }] },
      { key: "C", text: "長く座っていると凝る", main: { axis: "STA", v: 2 } },
      { key: "D", text: "ずっと凝りっぱなし", main: { axis: "STA", v: 4 }, signals: ["karada-jutai"] },
    ],
  },
  {
    id: 10,
    text: "睡眠は",
    options: [
      { key: "A", text: "だいたいよく眠れる" },
      { key: "B", text: "寝ても疲れが抜けない", main: { axis: "QI", v: 3 }, signals: ["juden-beta"] },
      { key: "C", text: "夜になると目が冴える", main: { axis: "YIN", v: 1 }, signals: ["yagata-switch"] },
      { key: "D", text: "考えごとで寝つけない", main: { axis: "ST", v: 1 }, signals: ["atama-guruguru"] },
    ],
  },
  {
    id: 11,
    text: "アザは",
    options: [
      { key: "A", text: "ほとんどできない" },
      { key: "B", text: "たまにできる", main: { axis: "STA", v: 1 } },
      { key: "C", text: "よくできる", main: { axis: "STA", v: 4 }, signals: ["karada-jutai"] },
      { key: "D", text: "ぶつけた覚えがないのにできている", main: { axis: "STA", v: 3 }, signals: ["karada-jutai"] },
    ],
  },
  {
    id: 12,
    text: "食事の時間は",
    options: [
      { key: "A", text: "だいたい決まっている" },
      { key: "B", text: "バラバラ", main: { axis: "SP", v: 2 } },
      { key: "C", text: "抜いてしまうことがある", main: { axis: "SP", v: 2 }, sub: [{ axis: "QI", v: 1 }] },
      { key: "D", text: "夜が遅い", main: { axis: "SP", v: 2 }, signals: ["yagata-switch"] },
    ],
  },
  {
    id: 13,
    text: "胃腸の調子は",
    options: [
      { key: "A", text: "安定している" },
      { key: "B", text: "食べると重くなる", main: { axis: "SP", v: 3 }, signals: ["shokugo-sleep"] },
      { key: "C", text: "張りやすい", main: { axis: "ST", v: 2 } },
      { key: "D", text: "ストレスですぐ変わる", main: { axis: "ST", v: 2 }, signals: ["ira-ira"] },
    ],
  },
  {
    id: 14,
    text: "水分については",
    options: [
      { key: "A", text: "とくに意識していない" },
      { key: "B", text: "トイレが近い", main: { axis: "YANG", v: 1 } },
      { key: "C", text: "むくみやすい", main: { axis: "DAM", v: 3 }, signals: ["mukumi-stock"] },
      { key: "D", text: "飲んでも飲んでも足りない", main: { axis: "JIN", v: 3 }, signals: ["uruoi-busoku"] },
    ],
  },
  {
    id: 15,
    text: "立ちくらみは",
    options: [
      { key: "A", text: "ほとんどない" },
      { key: "B", text: "たまにある", main: { axis: "BL", v: 2 } },
      { key: "C", text: "貧血ぎみとよく言われる", main: { axis: "BL", v: 3 }, signals: ["meguri-busoku"] },
      { key: "D", text: "立ち上がるとクラッとする", main: { axis: "BL", v: 3 }, signals: ["meguri-busoku"] },
    ],
  },
  {
    id: 16,
    text: "朝と夜、元気なのは",
    options: [
      { key: "A", text: "朝" },
      { key: "B", text: "夜", signals: ["yagata-switch"] },
      { key: "C", text: "どちらも同じくらい" },
      { key: "D", text: "日によって違う", signals: ["nami-nori"], variability: true },
    ],
  },
  {
    id: 17,
    text: "休みの日は",
    options: [
      { key: "A", text: "出かけたい" },
      { key: "B", text: "家でゆっくりしたい", main: { axis: "QI", v: 1 } },
      { key: "C", text: "寝て終わる", main: { axis: "QI", v: 3 }, signals: ["juden-beta"] },
      { key: "D", text: "やりたいことを一気に片づける", signals: ["tsune-accel"] },
    ],
  },
  {
    id: 18,
    text: "天気が悪い日は",
    options: [
      { key: "A", text: "とくに変わらない" },
      { key: "B", text: "体が重くなる", main: { axis: "DAM", v: 3 }, signals: ["mukumi-stock"] },
      { key: "C", text: "気分が落ちる", main: { axis: "ST", v: 1 } },
      { key: "D", text: "天気で調子が決まってしまう", main: { axis: "DAM", v: 2 }, signals: ["mukumi-stock", "nami-nori"], variability: true },
    ],
  },
  {
    id: 19,
    text: "汗は",
    options: [
      { key: "A", text: "人並み" },
      { key: "B", text: "あまりかかない", main: { axis: "YANG", v: 2 }, signals: ["hiehie"] },
      { key: "C", text: "かきやすい", main: { axis: "YIN", v: 2 } },
      { key: "D", text: "寝汗をかく", main: { axis: "YIN", v: 3 }, signals: ["hotehote"] },
    ],
  },
  {
    id: 20,
    text: "肌は",
    options: [
      { key: "A", text: "とくに気にならない" },
      { key: "B", text: "乾燥しやすい", main: { axis: "JIN", v: 3 }, signals: ["uruoi-busoku"] },
      { key: "C", text: "ベタつきやすい", main: { axis: "DAM", v: 2 }, signals: ["mukumi-stock"] },
      { key: "D", text: "季節や日によって大きく変わる", signals: ["nami-nori"], variability: true },
    ],
  },
  {
    id: 21,
    text: "爪・髪・顔色は",
    options: [
      { key: "A", text: "とくに問題ない" },
      { key: "B", text: "爪が割れやすい", main: { axis: "BL", v: 2 }, signals: ["meguri-busoku"] },
      { key: "C", text: "髪がパサつく・抜けやすい", main: { axis: "BL", v: 2 }, signals: ["meguri-busoku"] },
      { key: "D", text: "顔色が悪いと言われる", main: { axis: "BL", v: 3 }, signals: ["meguri-busoku"] },
    ],
  },
  {
    // === 系統識別シグナル(水分・消化系) ===
    id: 22,
    text: "体が重くなるのは、どんなとき",
    discriminatorFor: "moisture",
    options: [
      { key: "A", text: "食べたあと", main: { axis: "SP", v: 3 }, signals: ["shokugo-sleep"] },
      { key: "B", text: "夕方や、天気の悪い日", main: { axis: "DAM", v: 3 }, signals: ["mukumi-stock"] },
      { key: "C", text: "重くはならない。どちらかというと乾く", main: { axis: "JIN", v: 3 }, signals: ["uruoi-busoku"] },
      { key: "D", text: "とくにない" },
    ],
  },
  {
    id: 23,
    text: "予定が詰まると",
    options: [
      { key: "A", text: "むしろ燃える", main: { axis: "ST", v: 2 }, signals: ["tsune-accel"] },
      { key: "B", text: "すぐ疲れてしまう", main: { axis: "QI", v: 2 }, signals: ["denchi-gire"] },
      { key: "C", text: "イライラしてくる", main: { axis: "ST", v: 3 }, signals: ["ira-ira"] },
      { key: "D", text: "逃げ出したくなる", main: { axis: "QI", v: 2 }, signals: ["denchi-gire"] },
    ],
  },
  {
    // === 系統識別シグナル(温度・リズム系) ===
    id: 24,
    text: "体温やだるさで気になるのは",
    discriminatorFor: "temperature",
    options: [
      { key: "A", text: "手足やお腹が冷える", main: { axis: "YANG", v: 3 }, signals: ["hiehie"] },
      { key: "B", text: "顔や上半身が熱い、寝汗をかく", main: { axis: "YIN", v: 3 }, signals: ["hotehote"] },
      { key: "C", text: "昼間は普通だけど、夜になると目が冴える", main: { axis: "YIN", v: 2 }, signals: ["yagata-switch"] },
      { key: "D", text: "とくにない" },
    ],
  },
  {
    id: 25,
    text: "冷えを感じるのは",
    options: [
      { key: "A", text: "あまりない" },
      { key: "B", text: "手足", main: { axis: "YANG", v: 2 }, signals: ["hiehie"] },
      { key: "C", text: "お腹", main: { axis: "YANG", v: 3 }, signals: ["hiehie"] },
      { key: "D", text: "全身", main: { axis: "YANG", v: 3 }, sub: [{ axis: "QI", v: 1 }] },
    ],
  },
  {
    id: 26,
    text: "体調の波は",
    options: [
      { key: "A", text: "安定していて、あまり変わらない" },
      { key: "B", text: "日によって、けっこう違う", signals: ["nami-nori"], variability: true },
      { key: "C", text: "天気や気圧に左右される", signals: ["nami-nori"], variability: true },
      { key: "D", text: "前ぶれなく急に変わる", signals: ["nami-nori"], variability: true },
    ],
  },
  {
    id: 27,
    text: "むくみは",
    options: [
      { key: "A", text: "あまりない" },
      { key: "B", text: "朝、顔が腫れぼったい", main: { axis: "DAM", v: 2 }, signals: ["mukumi-stock"] },
      { key: "C", text: "夕方、足が重い・靴下の跡がつく", main: { axis: "DAM", v: 3 }, signals: ["mukumi-stock"] },
      { key: "D", text: "時期によって出る", main: { axis: "DAM", v: 2 } },
    ],
  },
  {
    id: 28,
    text: "乾燥を感じるのは",
    options: [
      { key: "A", text: "あまりない" },
      { key: "B", text: "肌", main: { axis: "JIN", v: 3 }, signals: ["uruoi-busoku"] },
      { key: "C", text: "唇", main: { axis: "JIN", v: 2 }, signals: ["uruoi-busoku"] },
      { key: "D", text: "喉や目", main: { axis: "JIN", v: 3 }, signals: ["uruoi-busoku"] },
    ],
  },
  {
    // === 系統識別シグナル(エネルギー系) ===
    id: 29,
    text: "「疲れているな」と感じるのは、どんなとき",
    discriminatorFor: "energy",
    options: [
      { key: "A", text: "朝、動き出すまで。動き出せば平気", main: { axis: "QI", v: 2 }, sub: [{ axis: "YANG", v: 1 }], signals: ["slow-start"] },
      { key: "B", text: "休んだはずなのに、抜けきっていない", main: { axis: "QI", v: 3 }, signals: ["juden-beta"] },
      { key: "C", text: "何もしていなくても、常に残量が少ない", main: { axis: "QI", v: 3 }, signals: ["denchi-gire"] },
      { key: "D", text: "ふらっとする、顔色が悪いと言われる", main: { axis: "QI", v: 2 }, sub: [{ axis: "BL", v: 2 }], signals: ["meguri-busoku"] },
    ],
  },
  {
    id: 30,
    text: "朝いちばんの予定は",
    options: [
      { key: "A", text: "とくに苦にならない" },
      { key: "B", text: "できれば午後にしたい", signals: ["slow-start"] },
      { key: "C", text: "朝がいちばん集中できる" },
      { key: "D", text: "朝は無理。夜のほうがはかどる", signals: ["yagata-switch"] },
    ],
  },
];
