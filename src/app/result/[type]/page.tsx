import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RESULT_TYPES, getResultTypeById } from "@/data/resultTypes";
import { decodeAnswers, evaluateAnswers, determineType } from "@/data/scoring";
import { AxisMeter } from "@/components/AxisMeter";
import { ShareActions } from "@/components/ShareActions";

interface Props {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ a?: string }>;
}

export function generateStaticParams() {
  return RESULT_TYPES.map((t) => ({ type: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type: typeId } = await params;
  const type = getResultTypeById(typeId);
  if (!type) return {};

  const title = `${type.emoji} ${type.name}タイプ`;
  const description = `${type.catchCopy} カラダ性格診断であなたのタイプをチェック。`;

  // openGraph / twitter はオブジェクトごと親layoutを置き換えるので、
  // card や type などの共通項目もここで明示しないと失われる
  // （以前は twitter.card が落ちて summary に降格していた）
  return {
    title,
    description,
    openGraph: {
      title: `${title}｜カラダ性格診断`,
      description,
      type: "website",
      locale: "ja_JP",
      siteName: "カラダ性格診断",
      url: `/result/${type.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title}｜カラダ性格診断`,
      description,
    },
  };
}

export default async function ResultPage({ params, searchParams }: Props) {
  const { type: typeId } = await params;
  const { a } = await searchParams;

  const type = getResultTypeById(typeId);
  if (!type) notFound();

  const answers = decodeAnswers(a);
  const personalized = answers && determineType(answers).id === type.id;
  const result = personalized ? evaluateAnswers(answers!) : null;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-lg">
        <div
          className="animate-pop-in rounded-[28px] p-7 shadow-[var(--card-shadow)]"
          style={{ backgroundColor: type.bg }}
        >
          <p className="text-center text-5xl">{type.emoji}</p>
          <h1 className="mt-2 text-center text-2xl font-black" style={{ color: type.color }}>
            {type.name}
          </h1>
          <p className="mt-1 text-center text-sm font-bold text-ink-soft">
            {type.catchCopy}
          </p>
          <p className="mt-4 rounded-2xl bg-white/70 p-4 text-center text-sm leading-relaxed">
            {type.lead}
          </p>
        </div>

        {result && (
          <div className="mt-5 rounded-[28px] bg-white p-6 shadow-[var(--card-shadow)]">
            <h2 className="mb-4 text-sm font-bold text-ink-soft">あなたの4つの軸</h2>
            <div className="flex flex-col gap-4">
              <AxisMeter
                name="エネルギー"
                leftIcon="🪫"
                leftLabel="LOW"
                rightIcon="🔋"
                rightLabel="HIGH"
                value={result.visible.energy}
                color={type.color}
              />
              <AxisMeter
                name="流れ"
                leftIcon="🚦"
                leftLabel="STUCK"
                rightIcon="🌪️"
                rightLabel="FLOW"
                value={result.visible.flow}
                color={type.color}
              />
              <AxisMeter
                name="温度"
                leftIcon="🧊"
                leftLabel="COOL"
                rightIcon="🔥"
                rightLabel="HOT"
                value={result.visible.temperature}
                color={type.color}
              />
              <AxisMeter
                name="うるおい"
                leftIcon="🏜️"
                leftLabel="DRY"
                rightIcon="💧"
                rightLabel="WET"
                value={result.visible.moisture}
                color={type.color}
              />
            </div>
            <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-ink-soft">
              これは良し悪しの点数ではなく、カラダのクセの方向を表しています。
            </p>
          </div>
        )}

        {!result && (
          <div className="mt-5 rounded-[28px] bg-white p-5 text-center text-xs leading-relaxed text-ink-soft shadow-[var(--card-shadow)]">
            このリンクは共有された結果ページです。あなた自身の4軸グラフを見るには、診断を受けてみてください。
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4">
          <ResultBox title="✨ あなたの特徴" items={type.features} tone="good" />
          <ResultBox title="⚠️ こんなとき注意" items={type.cautions} tone="care" />
          <ResultBox title="🔋 あなたの充電方法" items={type.charges} tone="charge" />
        </div>

        <p className="mt-5 text-center text-[0.7rem] leading-relaxed text-ink-soft">
          {type.tcmNote}
          <br />
          この診断は医療行為・医学的診断を行うものではありません。
        </p>

        <ShareActions emoji={type.emoji} typeName={type.name} />

        <div className="mt-4 flex flex-col gap-2.5">
          <Link
            href="/diagnosis"
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border-2 border-accent bg-white px-4 text-sm font-bold text-accent transition active:scale-[0.98]"
          >
            もう一度診断する
          </Link>
          <Link
            href="/"
            className="flex min-h-[44px] w-full items-center justify-center text-xs text-ink-soft underline underline-offset-2"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

function ResultBox({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "care" | "charge";
}) {
  const bg = tone === "good" ? "#eafaf0" : tone === "care" ? "#fff0ec" : "#fff7e0";
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: bg }}>
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <ul className="flex flex-col gap-1.5 text-[0.85rem] leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-1.5">
            <span>・</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
