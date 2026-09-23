import type { Metadata } from "next";
import { DiagnosisFlow } from "./DiagnosisFlow";

export const metadata: Metadata = {
  title: "診断スタート",
  description: "全30問、直感でこたえるだけ。あなたの「カラダのクセ」を診断します。",
  alternates: { canonical: "/diagnosis" },
};

export default function DiagnosisPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
      {/* 画面には出さない。設問だけの画面なので見出しが無く、支援技術から構造が読めなかった */}
      <h1 className="sr-only">カラダ性格診断 全30問</h1>
      <DiagnosisFlow />
    </main>
  );
}
