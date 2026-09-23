import type { Metadata } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const zenMaru = Zen_Maru_Gothic({
  variable: "--font-zen-maru",
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://karada-seikaku-shindan.vercel.app"),
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
  },
  twitter: {
    card: "summary_large_image",
    title: "カラダ性格診断",
    description: "30問でわかる、あなたの「カラダのクセ」。",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${zenMaru.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--bg-grad)] text-[var(--text)] antialiased">
        {children}
      </body>
    </html>
  );
}
