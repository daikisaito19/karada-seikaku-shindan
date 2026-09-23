"use client";

import { useState } from "react";

export function ShareCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("コピーできませんでした。手動でコピーしてください:", text);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full rounded-2xl border-2 border-accent bg-white px-4 py-3.5 text-sm font-bold text-accent transition active:scale-[0.98]"
    >
      {copied ? "コピーしました！" : "結果とURLをコピーする"}
    </button>
  );
}
