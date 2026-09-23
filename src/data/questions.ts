import type { ScoreAxis } from "./scoreAxes";

export type OptionKey = "A" | "B" | "C" | "D";

/** 軸への加点。main は1選択肢につき1つ、sub は 0.5 倍で加算される。 */
export interface AxisWeight {
  axis: ScoreAxis;
  v: number;
}

export interface QuestionOption {
  key: OptionKey;
  text: string;
  /** この選択肢が最も強く示す軸 */
  main?: AxisWeight;
  /** 副次的に示す軸（0.5倍で加算） */
  sub?: AxisWeight[];
  /** この選択肢が立てるタイプ固有のシグナル（タイプid） */
  signals?: string[];
  /** 「日によって違う」系の回答。15波乗りコンディションの判定に使う */
  variability?: boolean;
}

export interface Question {
  id: number; // 1-30
  text: string;
  options: [QuestionOption, QuestionOption, QuestionOption, QuestionOption];
}

/**
 * 30問（v4確定版）
 *
 * 設計の要:
 *   Q1 / Q23 / Q29 は、1つの設問の中に 01充電下手・02電池切れ・13スロースタート の
 *   選択肢を同居させ、互いに排他（どれか1つしか選べない）にしてある。
 *   これにより「疲れの強さ」ではなく「疲れのどのフェーズか」で分岐する。
 *   - 13 スロースタート = 始動の問題（エンジンがかかるまでが長い）
 *   - 02 電池切れ       = 持続の問題（動き出せるが持ちが短い）
 *   - 01 充電下手       = 回復の問題（寝ても戻らない）
 *   - 10 めぐり不足     = 中身の問題（材料が足りない）
 *
 *   身体感覚・行動・始動特性のみで構成し、純粋な性格質問は採用していない。
 */
export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "一晩ぐっすり寝たら、次の日は",
    options: [
      { key: "A", text: "すっきり戻っている" },
      { key: "B", text: "戻るけど、その日の後半までは持たない", main: { axis: "QI", v: 2 }, signals: ["denchi-gire"] },
      { key: "C", text: "あまり変わらない。疲れが残ったまま", main: { axis: "QI", v: 3 }, signals: ["juden-beta"] },
      { key: "D", text: "戻るけど、動き出せるようになるまでが長い", main: { axis: "QI", v: 1 }, signals: ["slow-start"] },
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
    id: 7,
    text: "ストレスがかかったとき、最初に出るのは",
    options: [
      { key: "A", text: "肩や背中が固まる、体が重くなる", main: { axis: "ST", v: 3 }, sub: [{ axis: "STA", v: 2 }], signals: ["karada-jutai"] },
      { key: "B", text: "イラッとする、口調がきつくなる", main: { axis: "ST", v: 3 }, signals: ["ira-ira"] },
      { key: "C", text: "同じことを何度も考えてしまう", main: { axis: "ST", v: 3 }, signals: ["atama-guruguru"] },
      { key: "D", text: "とにかく動いて予定を埋めたくなる", main: { axis: "ST", v: 3 }, signals: ["tsune-accel"] },
    ],
  },
  {
    id: 8,
    text: "やらなきゃいけないことがあるとき",
    options: [
      { key: "A", text: "だいたいすぐ取りかかれる" },
      { key: "B", text: "取りかかるまでが長い。始めてしまえばできる", signals: ["slow-start"] },
      { key: "C", text: "考えているうちに時間が経つ", main: { axis: "ST", v: 2 }, signals: ["atama-guruguru"] },
      { key: "D", text: "体が重くて、なかなか動き出せない", main: { axis: "QI", v: 2 }, signals: ["juden-beta"] },
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
    // 【シグナル密度修正】旧版はB/C/Dの3択すべてがめぐり不足のシグナルで、ランダム回答でも
    // 75%発火していた。「血・栄養が届いていない」ことを最も端的に示すD(顔色)だけを
    // シグナルとして残し、B/Cは軸スコア(BL)のみに変更。文面・軸配点は変更していない。
    text: "爪・髪・顔色は",
    options: [
      { key: "A", text: "とくに問題ない" },
      { key: "B", text: "爪が割れやすい", main: { axis: "BL", v: 2 } },
      { key: "C", text: "髪がパサつく・抜けやすい", main: { axis: "BL", v: 2 } },
      { key: "D", text: "顔色が悪いと言われる", main: { axis: "BL", v: 3 }, signals: ["meguri-busoku"] },
    ],
  },
  {
    id: 22,
    text: "体が重くなるのは、どんなとき",
    options: [
      { key: "A", text: "食べたあと", main: { axis: "SP", v: 3 }, signals: ["shokugo-sleep"] },
      { key: "B", text: "夕方や、天気の悪い日", main: { axis: "DAM", v: 3 }, signals: ["mukumi-stock"] },
      { key: "C", text: "重くはならない。どちらかというと乾く", main: { axis: "JIN", v: 3 }, signals: ["uruoi-busoku"] },
      { key: "D", text: "とくにない" },
    ],
  },
  {
    id: 23,
    text: "運動や作業を始めて、最初の10分は",
    options: [
      { key: "A", text: "とくに何も感じない" },
      { key: "B", text: "そこがいちばんつらい。越えると楽になる", signals: ["slow-start"] },
      { key: "C", text: "最初は平気。だんだんきつくなる", main: { axis: "QI", v: 2 }, signals: ["denchi-gire"] },
      { key: "D", text: "むしろどんどん乗ってくる", main: { axis: "ST", v: 1 }, signals: ["tsune-accel"] },
    ],
  },
  {
    id: 24,
    text: "体温やだるさで気になるのは",
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
    // 【シグナル密度修正】旧版はB/C/Dの3択すべてがうるおい不足のシグナルだった。
    // C(唇)を軸スコアのみに変更し2/4に。D(喉や目)は06ほてほての人も選ぶ「漏れ」として
    // あえて残し、検証が甘くならないようにした。文面・軸配点は変更していない。
    text: "乾燥を感じるのは",
    options: [
      { key: "A", text: "あまりない" },
      { key: "B", text: "肌", main: { axis: "JIN", v: 3 }, signals: ["uruoi-busoku"] },
      { key: "C", text: "唇", main: { axis: "JIN", v: 2 } },
      { key: "D", text: "喉や目", main: { axis: "JIN", v: 3 }, signals: ["uruoi-busoku"] },
    ],
  },
  {
    id: 29,
    // 05冷え冷え(温度)・13スロースタート(始動)・02電池切れ(持続)を
    // 同じ設問内で排他にする最重要設問。
    text: "午後から夕方にかけて、調子は",
    options: [
      { key: "A", text: "朝とあまり変わらない" },
      { key: "B", text: "体が温まってきて、楽になる", main: { axis: "YANG", v: 2 }, signals: ["hiehie"] },
      { key: "C", text: "エンジンがかかってきて、ようやく本調子", signals: ["slow-start"] },
      { key: "D", text: "だんだん落ちて、夕方にはもう終わっている", main: { axis: "QI", v: 2 }, signals: ["denchi-gire"] },
    ],
  },
  {
    id: 30,
    text: "予定を2日続けて入れると",
    options: [
      { key: "A", text: "とくに問題ない" },
      { key: "B", text: "2日目がはっきりつらい", main: { axis: "QI", v: 2 }, signals: ["denchi-gire"] },
      { key: "C", text: "むしろ充実する", main: { axis: "ST", v: 1 }, signals: ["tsune-accel"] },
      { key: "D", text: "イライラして余裕がなくなる", main: { axis: "ST", v: 2 }, signals: ["ira-ira"] },
    ],
  },
];
