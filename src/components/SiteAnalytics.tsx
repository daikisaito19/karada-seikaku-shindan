"use client";

import { Analytics } from "@vercel/analytics/next";
import { stripQuery } from "@/lib/analytics";

/** クエリを落としたい、URLらしき値が入るフィールド */
const URL_FIELDS = ["url", "path"] as const;

/**
 * 送信直前に、URLらしきフィールドからクエリ文字列を落とす。
 *
 * 結果ページのURLには回答が ?a= として載っているので、出口で必ず切っておく。
 * 実測では Next.js 向けの統合が送るのは { route, path } で、この時点で
 * すでにクエリは含まれていないが、送信形式が変わっても漏れないようにしている。
 *
 * 無かったフィールドを足さないのが重要。型では url: string となっているものの、
 * 実際のイベントに url が無いことがあり、機械的に上書きすると
 * url: "/undefined" のような値を作ってしまう。
 */
function stripQueryFromEvent<T>(event: T): T {
  const source = event as unknown as Record<string, unknown>;
  const cleaned: Record<string, unknown> = { ...source };
  for (const field of URL_FIELDS) {
    const value = source[field];
    if (typeof value === "string") cleaned[field] = stripQuery(value);
  }
  return cleaned as T;
}

/**
 * アクセス解析の設置。
 *
 * beforeSend は関数なので、サーバーコンポーネントから直接は渡せない。
 * そのためこの薄いクライアントコンポーネントを挟んでいる。
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={stripQueryFromEvent} />;
}
