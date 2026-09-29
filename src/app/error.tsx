"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * ページ内で予期しないエラーが出たときの画面。
 *
 * これが無いと、本番では Next.js 既定の英語のエラー表示が出てしまう。
 * 診断の途中で出ても行き先が分かるように、やり直す手段とトップへの導線を置いている。
 *
 * エラーの中身は画面に出さない（回答やURLが混ざる可能性があるため）。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 開発時に原因を追えるようにしておく。本番のブラウザにも出るが、送信はしない
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-lg text-center">
        <p className="text-6xl">🛠️</p>
        <h1 className="mt-4 text-xl font-black text-accent">うまく表示できませんでした</h1>
        <p className="mt-3 text-sm leading-relaxed">
          一時的な問題が起きたようです。
          <br />
          もう一度お試しください。
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-block w-full rounded-full bg-gradient-to-r from-cta-from to-cta-to px-8 py-4 text-base font-bold text-white shadow-[0_8px_18px_rgba(155,93,229,0.35)] transition active:scale-[0.98] sm:w-auto"
        >
          もう一度読み込む
        </button>

        <Link
          href="/"
          className="mt-4 flex min-h-[44px] w-full items-center justify-center text-xs text-ink-soft underline underline-offset-2"
        >
          トップに戻る
        </Link>
      </div>
    </main>
  );
}
