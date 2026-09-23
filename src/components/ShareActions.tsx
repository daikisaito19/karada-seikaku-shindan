"use client";

import { useState, useSyncExternalStore } from "react";

interface ShareActionsProps {
  emoji: string;
  typeName: string;
}

type Feedback = "copied" | "failed" | null;

/** ブラウザ固有の値を読むだけなので購読するものはない */
const noSubscribe = () => () => {};
const getHref = () => window.location.href;
const getHrefOnServer = () => "";
const getCanShare = () => typeof navigator.share === "function";
const getCanShareOnServer = () => false;

/**
 * 結果ページのシェア導線。
 *
 * シェアURLは「いま表示している結果ページのURL」をそのまま使う。
 * 診断完了時のURLには回答が ?a= として載っているので、
 * 受け取った人も同じ結果（4軸メーター付き）を再現できる。
 * ドメインを埋め込まないので、開発環境でも本番でもそのURLのまま共有される。
 */
export function ShareActions({ emoji, typeName }: ShareActionsProps) {
  // window / navigator はサーバーでは読めないので、ハイドレーション後に確定させる
  const url = useSyncExternalStore(noSubscribe, getHref, getHrefOnServer);
  const canNativeShare = useSyncExternalStore(noSubscribe, getCanShare, getCanShareOnServer);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const title = "カラダ性格診断";
  const shareText = `私のカラダ性格は「${emoji} ${typeName}」でした。\nあなたも30問で診断してみて！`;
  const xText = `カラダ性格診断やってみた！\n私のタイプは「${emoji} ${typeName}」でした。\n\nあなたのカラダには、性格がある。\n30問で診断👇`;

  const xUrl = url
    ? `https://x.com/intent/post?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(url)}`
    : "";
  const lineUrl = url
    ? `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`
    : "";

  const notify = (kind: Feedback) => {
    setFeedback(kind);
    setTimeout(() => setFeedback(null), 2000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("copied");
    } catch {
      // クリップボードが使えない環境では手動コピー用に中身を見せる
      notify("failed");
      window.prompt("コピーできませんでした。手動でコピーしてください:", text);
    }
  };

  const handleShare = async () => {
    const current = url || window.location.href;
    if (canNativeShare) {
      try {
        await navigator.share({ title, text: shareText, url: current });
        return;
      } catch {
        // 共有シートを閉じただけの場合もここに来るので、何も出さずに終わる
        return;
      }
    }
    // 共有シートがない環境（PCなど）ではコピーで代替する
    await copyToClipboard(`${shareText}\n${current}`);
  };

  const iconButton =
    "flex min-h-[48px] flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-2xl border-2 border-accent-light bg-white px-1.5 text-[0.7rem] font-bold text-ink transition hover:border-accent active:scale-[0.97]";

  return (
    <div className="mt-6 rounded-[28px] bg-white p-5 shadow-[var(--card-shadow)]">
      <h2 className="mb-3 text-center text-sm font-bold text-ink-soft">結果をシェアする</h2>

      <button
        onClick={handleShare}
        className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff9ecb] to-accent px-4 text-sm font-bold text-white shadow-[0_6px_14px_rgba(155,93,229,0.3)] transition active:scale-[0.98]"
      >
        シェアする
      </button>

      <div className="mt-2.5 flex gap-2.5">
        <a
          href={xUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Xでシェアする"
          className={iconButton}
          onClick={(e) => {
            if (!xUrl) e.preventDefault();
          }}
        >
          <span aria-hidden>𝕏</span>
          <span>でシェア</span>
        </a>
        <a
          href={lineUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LINEでシェアする"
          className={iconButton}
          onClick={(e) => {
            if (!lineUrl) e.preventDefault();
          }}
        >
          <span aria-hidden>💬</span>
          <span>LINE</span>
        </a>
        <button
          onClick={() => copyToClipboard(url || window.location.href)}
          aria-label="結果ページのURLをコピーする"
          className={iconButton}
        >
          <span aria-hidden>🔗</span>
          <span>URLをコピー</span>
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`mt-2.5 text-center text-xs font-bold transition-opacity ${
          feedback ? "text-accent opacity-100" : "opacity-0"
        }`}
      >
        {feedback === "copied"
          ? "コピーしました！"
          : feedback === "failed"
            ? "コピーできませんでした"
            : "　"}
      </p>
    </div>
  );
}
