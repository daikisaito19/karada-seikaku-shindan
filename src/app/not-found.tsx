import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  description: "お探しのページは見つかりませんでした。",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-lg text-center">
        <p className="text-6xl">🧭</p>
        <h1 className="mt-4 text-xl font-black text-accent">ページが見つかりません</h1>
        <p className="mt-3 text-sm leading-relaxed">
          お探しのページは見つかりませんでした。
          <br />
          URLが変わったか、なくなってしまったのかもしれません。
        </p>

        <Link
          href="/"
          className="mt-8 inline-block w-full rounded-full bg-gradient-to-r from-[#ff9ecb] to-accent px-8 py-4 text-base font-bold text-white shadow-[0_8px_18px_rgba(155,93,229,0.35)] transition active:scale-[0.98] sm:w-auto"
        >
          トップに戻る
        </Link>

        <Link
          href="/diagnosis"
          className="mt-4 flex min-h-[44px] w-full items-center justify-center text-xs text-ink-soft underline underline-offset-2"
        >
          診断をはじめる
        </Link>
      </div>
    </main>
  );
}
