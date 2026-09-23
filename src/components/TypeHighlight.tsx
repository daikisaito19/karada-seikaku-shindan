import {
  HIGHLIGHT_LEVELS,
  TYPE_HIGHLIGHTS,
  axisStrength,
} from "@/data/typeHighlights";

interface TypeHighlightProps {
  typeId: string;
  color: string;
  /**
   * primary軸の0-100スコア。
   * ?a= がない共有リンクでは回答が無く算出できないので、その場合は null。
   * そのときはピップを出さず、タイプ固有の短文だけを見せる。
   */
  primaryPercent: number | null;
  /**
   * 4軸メーターが同じ画面に出ているか。
   * ?a= のない共有リンクではメーター自体が出ないので、
   * 「4つのメーターは〜」という補足も出さない（画面に無いものを指してしまうため）。
   */
  metersShown: boolean;
}

/**
 * 「このタイプの決め手」ブロック。
 *
 * 4軸メーターが全タイプ共通のものさしなのに対して、こちらはタイプごとに違う。
 * 数字は出さず、ピップの点灯数と日本語の傾向ラベルだけで強さを伝える
 * （「90点」のような読み方をされないため）。
 */
export function TypeHighlight({
  typeId,
  color,
  primaryPercent,
  metersShown,
}: TypeHighlightProps) {
  const highlight = TYPE_HIGHLIGHTS[typeId];
  if (!highlight) return null;

  // 軸が決め手のタイプでも、回答が無ければ強さは出せない
  const showPips = highlight.kind === "axis" && primaryPercent !== null;
  const strength = showPips ? axisStrength(primaryPercent) : null;

  return (
    <div className="mt-5 rounded-[28px] bg-white p-6 shadow-[var(--card-shadow)]">
      <h2 className="text-sm font-bold text-ink-soft">🔍 このタイプの決め手</h2>

      {showPips && strength && (
        <div className="mt-4" role="group" aria-label={`${highlight.axisLabel}: ${strength.label}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-ink">{highlight.axisLabel}</span>
            <span className="text-xs font-bold" style={{ color }}>
              {strength.label}
            </span>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: HIGHLIGHT_LEVELS }, (_, i) => (
              <div
                key={i}
                className="h-2.5 flex-1 rounded-full"
                style={{
                  backgroundColor: i < strength.level ? color : "rgba(0,0,0,0.06)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-[0.85rem] leading-relaxed">{highlight.note}</p>

      {metersShown && (
        <p className="mt-3 text-[0.7rem] leading-relaxed text-ink-soft">
          4つのメーターは、みんな共通のものさし。こちらは、あなたがこのタイプになった理由です。
        </p>
      )}
    </div>
  );
}
