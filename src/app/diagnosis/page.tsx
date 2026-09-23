import type { Metadata } from "next";
import { DiagnosisFlow } from "./DiagnosisFlow";

export const metadata: Metadata = {
  title: "診断スタート",
  description: "全30問、直感でこたえるだけ。あなたの「カラダのクセ」を診断します。",
};

export default function DiagnosisPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
      <DiagnosisFlow />
    </main>
  );
}
