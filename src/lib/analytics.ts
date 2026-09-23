import { track } from "@vercel/analytics";

/**
 * 計測の入口。イベント送信はすべてここを通す。
 *
 * このサービスは会員登録も個人情報の入力もなく、回答は端末の中だけで処理している。
 * 計測を足したことでその前提が崩れないよう、「何を送れるか」を型で塞いである。
 *
 * 送ってよいもの:
 *   - 画面のパス（クエリを除く。後述の stripQuery でクエリを落とす）
 *   - 16タイプのID（すでにURLのパスに含まれている値）
 *   - 何問目まで進んだかの節目（5/10/15/20/25）
 *   - シェア手段の種別と成否
 *
 * 送ってはいけないもの:
 *   - ?a= の回答文字列（全体・部分・ハッシュを問わず）
 *   - 個々の設問で選んだ A/B/C/D
 *   - 9内部軸のスコア、4軸メーターの値
 *   - localStorage の中身
 *   - クエリ文字列を含むURL
 *   - 端末を横断して個人を追跡できる識別子
 *
 * 型が allowlist になっているので、上記を渡そうとするとコンパイルが通らない。
 */

/** 計測してよいイベント名。これ以外は追加できない */
export type AnalyticsEvent =
  | "diagnosis_start"
  | "question_progress"
  | "diagnosis_complete"
  | "result_view"
  | "share_click"
  | "share_copy"
  | "restart_click";

/** 進捗を送る節目。30問すべてではなく、離脱位置が分かる最小限だけ */
export type ProgressStep = 5 | 10 | 15 | 20 | 25;

export type ShareMethod = "native" | "x" | "line";

/**
 * 計測してよいタイプID。resultTypes.ts の id と同じ16個。
 * ここに無い値は toTrackedTypeId が null を返して送信されない。
 * （resultTypes.ts を import するとタイプの説明文ごとクライアントに載るので、IDだけ持つ）
 */
const TRACKED_TYPE_IDS = [
  "juden-beta",
  "denchi-gire",
  "shokugo-sleep",
  "mukumi-stock",
  "hiehie",
  "hotehote",
  "karada-jutai",
  "ira-ira",
  "uruoi-busoku",
  "meguri-busoku",
  "atama-guruguru",
  "yagata-switch",
  "slow-start",
  "tsune-accel",
  "nami-nori",
  "kuse-tsuyoi",
] as const;

export type TrackedTypeId = (typeof TRACKED_TYPE_IDS)[number];

/** 既知の16タイプのときだけIDを返す。知らない値は null にして送らせない */
export function toTrackedTypeId(id: string): TrackedTypeId | null {
  return (TRACKED_TYPE_IDS as readonly string[]).includes(id) ? (id as TrackedTypeId) : null;
}

/** イベントごとに送ってよいプロパティ。ここに無いキーは渡せない */
type EventPayloads = {
  diagnosis_start: { resumed: boolean };
  question_progress: { step: ProgressStep };
  diagnosis_complete: never;
  result_view: { type: TrackedTypeId; personalized: boolean };
  share_click: { method: ShareMethod };
  share_copy: { ok: boolean };
  restart_click: never;
};

type PayloadOf<E extends AnalyticsEvent> = EventPayloads[E];

/**
 * イベントを1件送る。
 * 計測ツールを差し替えるときは、この関数の中だけを書き換えれば済む。
 */
export function trackEvent<E extends AnalyticsEvent>(
  ...args: [PayloadOf<E>] extends [never] ? [event: E] : [event: E, props: PayloadOf<E>]
): void {
  const [event, props] = args as [E, Record<string, string | number | boolean> | undefined];
  const send = () => {
    if (props) track(event, props);
    else track(event);
  };
  try {
    // 計測スクリプトは window.va が未定義のときイベントを黙って捨てる。
    // ページを開いた直後は、こちらの useEffect のほうが先に走ることがあるので、
    // まだ準備できていなければ次のタイミングで一度だけ送り直す。
    // （これが無いと、ファネルの起点になる diagnosis_start が初回表示時に落ちる）
    if (typeof window !== "undefined" && !window.va) {
      window.setTimeout(() => {
        try {
          send();
        } catch {
          // 送れなくても診断は続けられる
        }
      }, 0);
      return;
    }
    send();
  } catch {
    // 計測が落ちても診断は続けられる
  }
}

/**
 * 計測に渡すURLからクエリ文字列を落とす。
 *
 * 結果ページのURLには回答が ?a= として載っている。
 * ページビューはURLをそのまま送る作りなので、ここで確実に切っておく。
 * ハッシュも落とす（/privacy#contact などが意味を持つ計測はしていない）。
 */
export function stripQuery(url: string): string {
  try {
    const parsed = new URL(url, "http://localhost");
    return `${parsed.origin === "http://localhost" ? "" : parsed.origin}${parsed.pathname}`;
  } catch {
    // パースできない形なら、? と # の手前までを機械的に切る
    return url.split(/[?#]/)[0];
  }
}
