import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * /robots.txt
 *
 * 公開ページはすべてクロール可能にする。
 * 結果ページの `?a=` 付きURLは回答を含む一時的なURLで、
 * 中身はスラッグ（/result/<type>）と同じ内容なので、
 * sitemap には素のスラッグだけを載せている（ここでは特に除外しない）。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
