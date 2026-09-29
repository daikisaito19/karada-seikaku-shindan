import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  alternates: { canonical: "/privacy" },
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
              本サービス「カラダ性格診断」（以下「本サービス」）は、氏名・メールアドレスなどの個人情報の入力や会員登録を必要としません。診断の回答は、お使いの端末（ブラウザ）の中だけで処理され、回答内容や診断結果を、運営者がサーバー上で個人と紐づけて保存することはありません。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">端末に保存される情報</h2>
            <p>
              診断の途中経過（何問目まで進んだか、そこまでの回答）を、お使いのブラウザの localStorage
              に一時的に保存します。これは、途中で画面を閉じたり再読み込みしたりしたあとに、続きから再開できるようにするためのものです。この情報が運営者のサーバーへ送信されることはありません。
            </p>
            <p className="mt-2">
              保存された途中経過は、<strong className="font-bold">30問すべてに回答し終えたとき</strong>、または
              <strong className="font-bold">トップページから新しく診断を始めたとき</strong>に削除されます。
            </p>
            <p className="mt-2">なお、本サービスはCookieを使用していません。</p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">結果ページのURLについて</h2>
            <p>
              診断結果のURLには、あなたの回答が <code className="font-bold">?a=</code>{" "}
              という形で含まれています。これは、あとからもう一度同じ結果を開いたり、友人に結果を見せたりするためのものです。この仕組みのおかげで、運営者が回答をサーバーに保存しなくても結果を再現できます。
            </p>
            <p className="mt-2">
              そのため、
              <strong className="font-bold">
                このURLを誰かに共有すると、30問の回答内容もあわせて共有されます。
              </strong>
              知られたくない内容が含まれる場合は、共有をお控えください。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">アクセス解析について</h2>
            <p>
              本サービスは、どのページがどれくらい見られているかを把握するために、Vercel Web Analytics
              を利用します。このツールはCookieを使用せず、個人を特定できる情報を収集しません。取得するのは、閲覧されたページのパス、アクセス日時、おおまかな地域・端末種別といった統計情報です。
            </p>
            <p className="mt-2">
              <strong className="font-bold">
                30問の回答内容や、結果URLに含まれる <code>?a=</code> の文字列を送信することはありません。
              </strong>
              また、端末をまたいで個人を追跡することもありません。
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-bold">今後の機能追加について</h2>
            <p>
              今後、診断結果の保存やユーザー登録などの機能を追加する場合は、取得する情報の内容と利用目的を本ポリシーに追記し、あらためてご案内します。
            </p>
          </section>

          <section id="contact" className="scroll-mt-6">
            <h2 className="mb-1.5 font-bold">運営者情報</h2>
            <p>運営者：terotero</p>
            <p className="mt-2">
              本サービスは、お名前・メールアドレスなどの個人情報を取得していません。そのため、保有個人データの開示・訂正・削除のご請求をお受けする窓口は設けていません。
            </p>
            <p className="mt-2">
              お問い合わせ窓口を設けた際には、本ページに追記してご案内します。
            </p>
          </section>

          <p className="text-xs text-ink-soft">制定日：2026年9月20日／最終更新日：2026年9月23日</p>
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
