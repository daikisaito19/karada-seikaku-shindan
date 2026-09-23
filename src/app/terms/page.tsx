import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-lg">
        <h1 className="text-xl font-black text-accent">利用規約</h1>

        <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed">
          <section>
            <h2 className="mb-1.5 font-bold">第1条（本サービスの内容）</h2>
            <p>
              「カラダ性格診断」（以下「本サービス」）は、東洋医学の考え方を参考にしたセルフチェック・エンターテインメント診断です。本サービスは医療行為・医学的診断を行うものではなく、結果の内容は健康状態を保証・確定するものではありません。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">第2条（利用上の注意）</h2>
            <p>
              本サービスの診断結果は、医療機関での診断や治療の代わりになるものではありません。体調に不安がある場合は、自己判断せず医療機関を受診してください。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">第3条（免責事項）</h2>
            <p>
              運営者は、本サービスの利用によって生じたいかなる損害についても、法令で認められる範囲で責任を負わないものとします。また、本サービスの内容は予告なく変更・中断・終了する場合があります。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">第4条（規約の変更）</h2>
            <p>
              運営者は、必要と判断した場合には、利用者への事前の通知なく本規約を変更できるものとします。変更後の規約は、本ページに掲載した時点から効力を生じるものとします。
            </p>
          </section>

          <p className="text-xs text-ink-soft">制定日：2026年9月20日</p>
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
