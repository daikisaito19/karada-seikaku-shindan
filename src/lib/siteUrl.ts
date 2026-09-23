/**
 * サイトの公開URL。metadata の相対URL（og:url / og:image）を絶対URLに解決するのに使う。
 *
 * 独自ドメインがまだ未定なので、優先順位を付けて解決する。
 *   1. NEXT_PUBLIC_SITE_URL          … 独自ドメインを取ったらこれを設定するだけでよい
 *   2. VERCEL_PROJECT_PRODUCTION_URL … Vercelの本番ドメイン（デプロイごとに変わらない）
 *   3. http://localhost:3000         … ローカル開発
 *
 * VERCEL_URL は使わない。あれはデプロイごとに変わる固有URLで、
 * プレビューのOGP画像が本番の共有カードに混ざる原因になる。
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
