import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "この診断について",
  description: "カラダ性格診断のコンセプトと使い方について。",
};

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-lg">
        <h1 className="text-xl font-black text-accent">この診断について</h1>

        <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed">
          <section>
            <h2 className="mb-1.5 font-bold">カラダ性格診断とは</h2>
            <p>
              東洋医学の考え方をベースにしながら、それをあまり前面に出さず、気軽に楽しめる「カラダの性格診断」として作りました。全30問に直感で答えるだけで、あなたの「カラダのクセ」を16タイプの中から診断します。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">医療行為・医学的診断ではありません</h2>
            <p>
              この診断は、東洋医学の考え方を参考にしたセルフチェック・エンターテインメントです。病気の診断や治療を目的としたものではなく、結果の内容が医学的に検証されたものでもありません。体調に不安がある場合は、医療機関を受診してください。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">結果について</h2>
            <p>
              質問の回答は、内部的にいくつかの傾向スコアへ変換され、16タイプの中からもっとも近いものを表示しています。回答の組み合わせによっては、複数のタイプの傾向が混ざって出ることもあります。診断ロジックは今後の検証を踏まえて改善していく予定です。
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex min-h-[44px] items-center px-2 text-xs text-ink-soft underline underline-offset-2"
        >
          トップに戻る
        </Link>
      </div>
    </main>
  );
}
