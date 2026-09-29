import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/siteUrl";
import { SiteAnalytics } from "@/components/SiteAnalytics";

const zenMaru = Zen_Maru_Gothic({
  variable: "--font-zen-maru",
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // 各ページが自分の canonical を明示する。子の alternates は親を丸ごと置き換えるので、
  // ここだけに書いても結果ページには効かない（twitter.card が落ちたのと同じ構造）
  alternates: { canonical: "/" },
  title: {
    default: "カラダ性格診断",
    template: "%s | カラダ性格診断",
  },
  description:
    "あなたのカラダには、性格がある。30問でわかる、あなたの「カラダのクセ」。東洋医学の考え方をベースにした、無料のエンタメ体質診断。",
  openGraph: {
    title: "カラダ性格診断",
    description: "30問でわかる、あなたの「カラダのクセ」。",
    type: "website",
    locale: "ja_JP",
    siteName: "カラダ性格診断",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "カラダ性格診断",
    description: "30問でわかる、あなたの「カラダのクセ」。",
  },
};

/**
 * スマホのブラウザバーの色。ページ背景（グラデーションの開始色）に合わせて、
 * 画面上端との境目が出ないようにする。
 */
export const viewport: Viewport = {
  themeColor: "#fff6e9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${zenMaru.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--bg-grad)] text-[var(--text)] antialiased">
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
