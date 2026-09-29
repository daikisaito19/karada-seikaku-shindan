"use client";

import { useEffect } from "react";

/**
 * ルートレイアウト自体が落ちたときの最後の受け皿。
 *
 * この画面はレイアウトの外側で描かれるので、<html> と <body> を自前で持つ必要がある。
 * CSSやフォントの読み込みに失敗している可能性もあるため、
 * Tailwind に頼らず inline style だけで組んである（それでも日本語で読める状態を保つ）。
 *
 * error.tsx と同じく、エラーの中身は画面に出さない。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(160deg, #fff6e9, #fdebff)",
          color: "#4a3f55",
          fontFamily:
            "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "32rem" }}>
          <p style={{ fontSize: "3.75rem", margin: 0 }}>🛠️</p>
          <h1
            style={{
              marginTop: "1rem",
              fontSize: "1.25rem",
              fontWeight: 900,
              color: "#7a35c9",
            }}
          >
            うまく表示できませんでした
          </h1>
          <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", lineHeight: 1.8 }}>
            一時的な問題が起きたようです。
            <br />
            もう一度お試しください。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              minHeight: "48px",
              padding: "0 2rem",
              border: "none",
              borderRadius: "9999px",
              background: "linear-gradient(to right, #c93f83, #7a35c9)",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            もう一度読み込む
          </button>
          <p style={{ marginTop: "1rem" }}>
            {/* ここはルートレイアウトが落ちた後の画面なので、next/link のクライアント遷移には頼らない。
                素の <a> でページごと読み込み直すほうが確実に復帰できる。 */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                display: "inline-flex",
                minHeight: "44px",
                alignItems: "center",
                fontSize: "0.75rem",
                color: "#6d607b",
              }}
            >
              トップに戻る
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
