import type { MetadataRoute } from "next";
import { RESULT_TYPES } from "@/data/resultTypes";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * /sitemap.xml
 *
 * 固定ページ5つ＋16タイプの結果ページ。
 *
 * 結果ページは `?a=` が無くても、そのタイプの紹介として成立する
 * （タイプ名・キャッチコピー・決め手・特徴・注意・充電方法が出る。
 *   個人の4軸メーターだけが出ない）。タイプごとに title と description も
 *   違うので、素のスラッグは検索結果に載せる価値がある。
 *
 * 逆に `?a=` 付きURLは、回答を埋め込んだ一時的なURLで中身はスラッグと同じなので載せない。
 *
 * lastModified は入れていない。ビルドのたびに現在時刻が入ると、
 * 中身が変わっていなくても「更新された」と伝えてしまうため。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/diagnosis`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const resultPages: MetadataRoute.Sitemap = RESULT_TYPES.map((type) => ({
    url: `${SITE_URL}/result/${type.id}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...resultPages];
}
