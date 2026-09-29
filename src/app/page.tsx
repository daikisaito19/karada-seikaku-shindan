import Link from "next/link";
import { RESULT_TYPES } from "@/data/resultTypes";

const RECOMMEND_POINTS = [
  "最近なんとなく疲れる",
  "自分の体質が気になる",
  "健康診断は普通だけど、調子がいまいち",
  "友達と診断結果を比べたい",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-lg">
        <section className="text-center">
          <h1 className="text-[1.9rem] font-black leading-tight text-ink sm:text-4xl">
            あなたのカラダには、
            <br />
            性格がある。
          </h1>
          <p className="mt-4 text-sm text-ink-soft sm:text-base">
            30問でわかる、あなたの「カラダのクセ」。
          </p>

          <Link
            href="/diagnosis"
            className="mt-8 inline-block w-full rounded-full bg-gradient-to-r from-cta-from to-cta-to px-8 py-4 text-base font-bold text-white shadow-[0_8px_18px_rgba(155,93,229,0.35)] transition active:scale-[0.98] sm:w-auto"
          >
            無料で診断する
          </Link>
        </section>

        <section className="mt-14 grid grid-cols-4 gap-2.5 sm:grid-cols-4">
          {RESULT_TYPES.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl px-1 py-3 text-center text-2xl"
              style={{ backgroundColor: t.bg }}
            >
              {t.emoji}
              <span className="mt-1 block text-[0.6rem] font-bold leading-tight text-ink">
                {t.name}
              </span>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-[28px] bg-white p-6 shadow-[var(--card-shadow)]">
          <h2 className="mb-4 text-center text-base font-bold text-accent">
            こんな人におすすめ
          </h2>
          <ul className="flex flex-col gap-2.5 text-sm leading-relaxed">
            {RECOMMEND_POINTS.map((point) => (
              <li key={point} className="flex gap-2">
                <span>✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-center text-[0.7rem] leading-relaxed text-ink-soft">
          このサイトは東洋医学の考え方をベースにしたセルフチェック・エンタメ診断です。
          <br />
          医療行為・医学的診断を行うものではありません。
        </p>

        <footer className="mt-4 flex flex-wrap items-center justify-center gap-x-2 text-xs text-ink-soft">
          <Link
            href="/about"
            className="inline-flex min-h-[44px] items-center px-2 underline underline-offset-2"
          >
            この診断について
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-[44px] items-center px-2 underline underline-offset-2"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/terms"
            className="inline-flex min-h-[44px] items-center px-2 underline underline-offset-2"
          >
            利用規約
          </Link>
          <Link
            href="/privacy#contact"
            className="inline-flex min-h-[44px] items-center px-2 underline underline-offset-2"
          >
            お問い合わせ
          </Link>
        </footer>
      </div>
    </main>
  );
}
