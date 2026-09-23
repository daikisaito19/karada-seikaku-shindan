import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { RESULT_TYPES } from "@/data/resultTypes";

export const alt = "カラダ性格診断 - あなたのカラダには、性格がある。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const bold = readFile(join(process.cwd(), "assets/ZenMaruGothic-Bold.subset.ttf"));
const black = readFile(join(process.cwd(), "assets/ZenMaruGothic-Black.subset.ttf"));

export default async function Image() {
  const [boldData, blackData] = await Promise.all([bold, black]);
  const tiles = [...RESULT_TYPES].sort((a, b) => a.no - b.no);

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
          backgroundImage: "linear-gradient(160deg, #fff6e9, #fdebff)",
          fontFamily: "ZenMaru",
          padding: 48,
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#9b5de5" }}>
          カラダ性格診断
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 900, color: "#4a3f55", marginTop: 12 }}>
          あなたのカラダには、性格がある。
        </div>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#8a7d99", marginTop: 14 }}>
          30問でわかる、あなたの「カラダのクセ」。
        </div>

        {/* 16タイプのタイル。「16タイプ診断」であることが一目で伝わるようにする */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            width: 1000,
            marginTop: 34,
          }}
        >
          {tiles.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 104,
                height: 104,
                margin: 6,
                borderRadius: 28,
                backgroundColor: t.bg,
                fontSize: 52,
              }}
            >
              {t.emoji}
            </div>
          ))}
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
