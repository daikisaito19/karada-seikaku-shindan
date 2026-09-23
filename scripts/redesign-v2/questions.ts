import type { ScoreAxis } from "../../src/data/scoreAxes";

export type OptionKey = "A" | "B" | "C" | "D";
export type ScoreDelta = Partial<Record<ScoreAxis, number>>;

export interface QuestionOption {
  key: OptionKey;
  text: string;
  scores: ScoreDelta;
}

export interface Question {
  id: number;
  text: string;
  options: [QuestionOption, QuestionOption, QuestionOption, QuestionOption];
}

function opts(
  a: string,
  b: [string, ScoreDelta],
  c: [string, ScoreDelta],
  d: [string, ScoreDelta],
  aScores: ScoreDelta = {}
): [QuestionOption, QuestionOption, QuestionOption, QuestionOption] {
  return [
    { key: "A", text: a, scores: aScores },
    { key: "B", text: b[0], scores: b[1] },
    { key: "C", text: c[0], scores: c[1] },
    { key: "D", text: d[0], scores: d[1] },
  ];
}

// 変更点: Q3 / Q11 / Q15 / Q21 / Q29 を新設問に差し替え。他は旧設問を踏襲。
export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "朝起きたとき",
    options: opts(
      "起きたらすぐ動ける",
      ["もう少し寝たい", { QI: 2 }],
      ["布団から出るのがつらい", { YANG: 2, QI: 1 }],
      ["寝たのに疲れている", { QI: 3 }]
    ),
  },
  {
    id: 2,
    text: "食後",
    options: opts(
      "普通に動ける",
      ["かなり眠くなる", { SP: 3, QI: 2, DAM: 2 }],
      ["お腹が重い", { SP: 3, DAM: 3 }],
      ["まだ食べられる", { DAM: 1 }]
    ),
  },
  // --- NEW: STA (めぐり・血瘀) を測る。長時間同じ姿勢での身体のこわばり。 ---
  {
    id: 3,
    text: "長時間、同じ姿勢でいると",
    options: opts(
      "特に何も感じない",
      ["関節や体がこわばる", { STA: 4 }],
      ["足や顔がむくむ", { DAM: 2 }],
      ["眠くなる", { SP: 1, QI: 1 }]
    ),
  },
  {
    id: 4,
    text: "甘いもの",
    options: opts(
      "あまり欲しくならない",
      ["疲れると欲しくなる", { SP: 2, QI: 1 }],
      ["かなり好き", { SP: 2, DAM: 1 }],
      ["食後でも食べたくなる", { SP: 2, DAM: 2 }]
    ),
  },
  {
    id: 5,
    text: "冬",
    options: opts(
      "特に苦手ではない",
      ["かなり寒がり", { YANG: 3 }],
      ["手足が冷えやすい", { YANG: 3 }],
      ["冬より夏が苦手", { YIN: 2 }]
    ),
  },
  {
    id: 6,
    text: "夏",
    options: opts(
      "特に問題ない",
      ["暑さが苦手", { YIN: 1 }],
      ["ほてりやすい", { YIN: 3 }],
      ["冷房が苦手", { YANG: 2 }]
    ),
  },
  {
    id: 7,
    text: "ストレスが溜まると",
    options: opts(
      "寝る",
      ["食べる", { SP: 1, DAM: 1 }],
      ["イライラする", { ST: 3 }],
      ["頭の中でずっと考える", { ST: 2 }],
      { QI: 1 }
    ),
  },
  {
    id: 8,
    text: "嫌なことがあると",
    options: opts(
      "すぐ忘れる",
      ["ずっと引きずる", { ST: 2, STA: 1 }],
      ["誰かに話したい", { ST: 1 }],
      ["自分の中に溜める", { ST: 3, STA: 1 }]
    ),
  },
  {
    id: 9,
    text: "肩・首こり",
    options: opts(
      "あまり気にならない",
      ["ストレスが多いと凝る", { ST: 3 }],
      ["長時間同じ姿勢で凝る", { STA: 2 }],
      ["常に凝っている", { ST: 2, STA: 4 }]
    ),
  },
  {
    id: 10,
    text: "睡眠",
    options: opts(
      "比較的よく眠れる",
      ["寝ても疲れが残る", { QI: 3 }],
      ["夜に目が冴える", { YIN: 2, ST: 1 }],
      ["眠りが浅い", { QI: 1, YIN: 1, ST: 1 }]
    ),
  },
  // --- NEW: STA (めぐり・血瘀) を測る。あざのできやすさ。 ---
  {
    id: 11,
    text: "気づいたらアザができていることが",
    options: opts(
      "ほとんどない",
      ["たまにある", { STA: 1 }],
      ["よくある", { STA: 4 }],
      ["内出血しやすい気がする", { STA: 2, BL: 1 }]
    ),
  },
  {
    id: 12,
    text: "食事時間",
    options: opts(
      "ほぼ決まっている",
      ["バラバラ", { SP: 2 }],
      ["抜くことがある", { SP: 3, QI: 1 }],
      ["夜遅い", { SP: 2, ST: 1 }]
    ),
  },
  {
    id: 13,
    text: "お腹",
    options: opts(
      "安定している",
      ["食べると重い", { SP: 3, DAM: 2 }],
      ["張りやすい", { ST: 2, SP: 1 }],
      ["ストレスで変わる", { ST: 3, SP: 1 }]
    ),
  },
  {
    id: 14,
    text: "水分",
    options: opts(
      "普通",
      ["すぐトイレに行く", { QI: 1, YANG: 1 }],
      ["むくみやすい", { DAM: 3, SP: 2 }],
      ["もっと飲みたい", { YIN: 2 }]
    ),
  },
  // --- NEW: BL (うるおい・血虚) を測る。立ちくらみ・めまい。 ---
  {
    id: 15,
    text: "立ちくらみ・めまいは",
    options: opts(
      "ほとんどない",
      ["たまにある", { BL: 2 }],
      ["貧血気味とよく言われる", { BL: 3, QI: 1 }],
      ["低血圧気味", { BL: 2, YANG: 1 }]
    ),
  },
  {
    // 夜型スイッチの行動シグナルとして使うため、軸スコアは持たせず「時間帯の傾向」だけを測る
    id: 16,
    text: "朝と夜、どちらが元気？",
    options: opts(
      "朝",
      ["夜", {}],
      ["どちらも同じ", {}],
      ["日によって違う", { ST: 1 }]
    ),
  },
  {
    id: 17,
    text: "休みの日",
    options: opts(
      "外出したい",
      ["家でゆっくりしたい", { QI: 1 }],
      ["寝て終わる", { QI: 3 }],
      ["普段できないことを一気にやる", { ST: 1 }]
    ),
  },
  {
    id: 18,
    text: "天気が悪いと",
    options: opts(
      "特に変わらない",
      ["体が重い", { DAM: 3, SP: 1 }],
      ["気分が落ちる", { ST: 2 }],
      ["むくみやすい", { DAM: 3 }]
    ),
  },
  {
    id: 19,
    text: "汗",
    options: opts(
      "普通",
      ["あまりかかない", { YANG: 2 }],
      ["かきやすい", { YIN: 2 }],
      ["寝汗をかく", { YIN: 3 }]
    ),
  },
  {
    id: 20,
    text: "肌",
    options: opts(
      "特に気にならない",
      ["乾燥しやすい", { BL: 3, YIN: 1 }],
      ["ベタつきやすい", { DAM: 3 }],
      ["季節で変わる", { BL: 1, YIN: 1, DAM: 1 }]
    ),
  },
  // --- NEW: BL (うるおい・血虚) を測る。爪・髪・顔色。 ---
  {
    id: 21,
    text: "爪や髪、顔色の調子は",
    options: opts(
      "特に問題ない",
      ["爪が割れやすい", { BL: 2 }],
      ["髪がパサつく・抜けやすい", { BL: 2, YIN: 1 }],
      ["顔色が悪いと言われる", { BL: 3 }]
    ),
  },
  // 常時アクセルの行動シグナル専用。軸スコアは持たせない(他のST系タイプが引き寄せられないように)。
  {
    id: 22,
    text: "「頑張りすぎ」と言われる",
    options: opts(
      "よく言われる",
      ["ときどき言われる", {}],
      ["あまり言われない", {}],
      ["「もっと休んだら？」と言われる", {}]
    ),
  },
  {
    id: 23,
    text: "予定が詰まると",
    options: opts(
      "むしろ燃える",
      ["疲れる", { QI: 2 }],
      ["イライラする", { ST: 3 }],
      ["逃げたくなる", { QI: 2, ST: 1 }],
      { ST: 1 }
    ),
  },
  // 頭ぐるぐるの行動シグナル専用。軸スコアは持たせない(他のST系タイプが引き寄せられないように)。
  {
    id: 24,
    text: "考え事",
    options: opts(
      "すぐ答えが出る",
      ["ずっと考える", {}],
      ["誰かに相談する", {}],
      ["考え始めると止まらない", {}]
    ),
  },
  {
    id: 25,
    text: "冷えるのは",
    options: opts(
      "あまりない",
      ["手足", { YANG: 2 }],
      ["お腹", { YANG: 3 }],
      ["全身", { YANG: 3, QI: 1 }]
    ),
  },
  // 差し替え: 旧「熱くなるのは」はQ6と重複感があったため、波乗りコンディションの
  // 行動シグナル専用設問に変更。軸スコアは持たせない。
  {
    id: 26,
    text: "体調の波は？",
    options: opts(
      "安定していて、あまり変わらない",
      ["日によって、けっこう違う", {}],
      ["天気や気圧に左右される", {}],
      ["前触れなく急に変わる", {}]
    ),
  },
  {
    id: 27,
    text: "むくみ",
    options: opts(
      "あまりない",
      ["朝", { DAM: 2 }],
      ["夜", { DAM: 3 }],
      ["特定の時期", { DAM: 2, ST: 1 }]
    ),
  },
  {
    id: 28,
    text: "乾燥",
    options: opts(
      "あまりない",
      ["肌", { BL: 3 }],
      ["唇", { BL: 2, YIN: 1 }],
      ["喉や目", { YIN: 3, BL: 2 }]
    ),
  },
  // --- NEW: スロースタート vs 冷え冷え/電池切れ の行動シグナル専用。軸スコアは持たせない。 ---
  {
    id: 29,
    text: "朝の調子は、時間が経つとどう変わる？",
    options: opts(
      "最初から普通に動ける",
      ["時間が経っても本調子にならない", {}],
      ["最初はイマイチだけど、慣れると普通に動ける", {}],
      ["逆に朝が一番元気", {}]
    ),
  },
  {
    id: 30,
    text: "今、一番欲しいもの",
    options: opts(
      "元気",
      ["睡眠", { QI: 2, YANG: 1 }],
      ["リラックス", { ST: 3 }],
      ["体の軽さ", { DAM: 2, SP: 1 }],
      { QI: 2 }
    ),
  },
];
