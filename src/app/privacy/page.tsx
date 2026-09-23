import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-lg">
        <h1 className="text-xl font-black text-accent">プライバシーポリシー</h1>

        <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed">
          <section>
            <h2 className="mb-1.5 font-bold">取得する情報について</h2>
            <p>
              本サービス「カラダ性格診断」（以下「本サービス」）は、現在のバージョンにおいて、氏名・メールアドレスなどの個人情報の入力や会員登録を必要としません。診断の回答内容は、お使いの端末上で処理され、結果ページのURLの一部として利用されます。回答内容や診断結果を、運営者がサーバー上で個人と紐づけて保存することはありません。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">アクセス解析について</h2>
            <p>
              本サービスは、サイトの利用状況を把握するために、アクセス解析ツールを利用する場合があります。これらのツールは、個人を特定しない形で、閲覧ページやアクセス日時などの情報を収集することがあります。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">今後の機能追加について</h2>
            <p>
              今後、診断結果の保存やユーザー登録などの機能を追加する場合は、取得する情報の内容と利用目的を本ポリシーに追記し、あらためてご案内します。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">お問い合わせ</h2>
            <p>本サービスに関するお問い合わせは、運営者までご連絡ください。</p>
          </section>

          <p className="text-xs text-ink-soft">制定日：2026年9月20日</p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-xs text-ink-soft underline underline-offset-2"
        >
          トップに戻る
        </Link>
      </div>
    </main>
  );
}
