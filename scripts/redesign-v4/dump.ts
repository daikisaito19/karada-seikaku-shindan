import { QUESTIONS } from "./questions";
import { BLIND } from "./blind";
const target = process.argv[2];
for (const b of BLIND) {
  if (target && b.id !== target) continue;
  console.log(`\n### ${b.label} — ${b.persona.join(" / ")}`);
  QUESTIONS.forEach((q, i) => {
    const o = q.options.find((x) => x.key === b.answers[i])!;
    const sig = o.signals?.length ? `  [${o.signals.join(",")}]` : "";
    console.log(`  Q${q.id} ${q.text} → ${b.answers[i]}「${o.text}」${sig}`);
  });
}
