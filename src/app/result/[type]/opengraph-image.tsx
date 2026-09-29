import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { RESULT_TYPES, getResultTypeById } from "@/data/resultTypes";

export const alt = "カラダ性格診断の結果";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return RESULT_TYPES.map((t) => ({ type: t.id }));
}

// フォントはリクエストに依存しないのでモジュールスコープで一度だけ読む
const bold = readFile(join(process.cwd(), "assets/ZenMaruGothic-Bold.subset.ttf"));
const black = readFile(join(process.cwd(), "assets/ZenMaruGothic-Black.subset.ttf"));

export default async function Image({ params }: { params: Promise<{ type: string }> }) {
  const { type: typeId } = await params;
  const type = getResultTypeById(typeId);
  if (!type) return new Response("Not found", { status: 404 });

  const [boldData, blackData] = await Promise.all([bold, black]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: type.bg,
          fontFamily: "ZenMaru",
          padding: 48,
        }}
      >
        {/* 結果カード。サイトの結果画面と同じ角丸＋白カードの見た目に寄せる */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: 48,
            padding: "32px 56px 36px",
            boxShadow: "0 18px 40px rgba(120, 90, 160, 0.18)",
          }}
        >
          {/* ヘッダー行：サービス名 と TYPE番号 */}
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#6d607b" }}>
              カラダ性格診断
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                color: "#ffffff",
                backgroundColor: type.color,
                borderRadius: 999,
                padding: "8px 24px",
              }}
            >
              {`TYPE ${String(type.no).padStart(2, "0")}`}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 96, marginTop: 12 }}>{type.emoji}</div>

          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 900,
              color: type.color,
              marginTop: 2,
            }}
          >
            {type.name}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              color: "#4a3f55",
              backgroundColor: type.bg,
              borderRadius: 999,
              padding: "10px 32px",
              marginTop: 18,
            }}
          >
            {type.catchCopy}
          </div>
        </div>

        {/* フッターのキャッチ */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 900, color: "#4a3f55" }}>
            あなたのカラダには、性格がある。
          </div>
          <div style={{ display: "flex", fontSize: 21, fontWeight: 700, color: "#6d607b", marginTop: 6 }}>
            30問でわかる、あなたの「カラダのクセ」。
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "ZenMaru", data: boldData, weight: 700, style: "normal" },
        { name: "ZenMaru", data: blackData, weight: 900, style: "normal" },
      ],
    }
  );
}
