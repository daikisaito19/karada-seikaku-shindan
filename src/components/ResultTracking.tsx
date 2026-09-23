"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { toTrackedTypeId, trackEvent } from "@/lib/analytics";

/**
 * 結果ページの計測。結果ページ自体はサーバーコンポーネントのままにしたいので、
 * 計測が必要な部分だけをこの小さなクライアントコンポーネントに切り出している。
 */

interface ResultViewTrackerProps {
  /** 16タイプのID。allowlist に無い値は送られない */
  typeId: string;
  /** ?a= から本人の回答を復元できた結果かどうか。?a= の中身そのものは渡さない */
  personalized: boolean;
}

/** 結果を表示したことだけを1回記録する。画面には何も出さない */
export function ResultViewTracker({ typeId, personalized }: ResultViewTrackerProps) {
  // 同じ結果で二重に送らないよう、送信済みの組み合わせを覚えておく
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const type = toTrackedTypeId(typeId);
    if (!type) return;
    const key = `${type}:${personalized}`;
    if (sent.current === key) return;
    sent.current = key;
    trackEvent("result_view", { type, personalized });
  }, [typeId, personalized]);

  return null;
}

interface RestartLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

/** 「もう一度診断する」。遷移の挙動は通常の Link と同じで、記録を1件足すだけ */
export function RestartLink({ href, className, children }: RestartLinkProps) {
  return (
    <Link href={href} className={className} onClick={() => trackEvent("restart_click")}>
      {children}
    </Link>
  );
}
