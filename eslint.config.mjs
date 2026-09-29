import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // scripts/ は設計時の使い捨ての分析・検証スクリプト置き場。
  // 公開されるアプリではなく、npm run verify が結果で正しさを担保している。
  // アプリ向けの書き方のルール（any 禁止・未使用 import 禁止など）を
  // ここにも当てると npm run lint が常に赤くなり、src/ の本当のエラーが埋もれるので外す。
  // 構文エラーや未定義参照など、実際に壊れる問題は引き続き検出される。
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "prefer-const": "off",
    },
  },
]);

export default eslintConfig;
