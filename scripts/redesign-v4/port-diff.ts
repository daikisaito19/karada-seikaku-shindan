/**
 * prototype の questions.ts と src/data/questions.ts が
 * データとして完全に一致しているかを機械的に確認する。
 * 設問文・選択肢文・main・sub・signals・variability のすべてを比較する。
 */
import { QUESTIONS as PROTO } from "./questions";
import { QUESTIONS as SRC } from "../../src/data/questions";

type Any = Record<string, unknown>;

const norm = (q: Any) => ({
  id: q.id,
  text: q.text,
  options: (q.options as Any[]).map((o) => ({
    key: o.key,
    text: o.text,
    main: o.main ?? null,
    sub: o.sub ?? null,
    signals: o.signals ?? null,
    variability: o.variability ?? false,
  })),
});

const a = JSON.stringify(PROTO.map((q) => norm(q as unknown as Any)), null, 1);
const b = JSON.stringify(SRC.map((q) => norm(q as unknown as Any)), null, 1);

if (a === b) {
  console.log(`✅ 完全一致: 30問 × 4選択肢のデータが prototype と src で同一`);
  console.log(`   設問数 proto=${PROTO.length} src=${SRC.length}`);
} else {
  console.log("❌ 不一致あり");
  const la = a.split("\n");
  const lb = b.split("\n");
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) console.log(`  L${i}: proto=${la[i]}  |  src=${lb[i]}`);
  }
  process.exitCode = 1;
}
