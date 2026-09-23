interface AxisMeterProps {
  /** 日本語の軸名。何のメーターかを一目で分かるようにする */
  name: string;
  leftIcon: string;
  leftLabel: string;
  rightIcon: string;
  rightLabel: string;
  /** 0-100。点数ではなく「どちら側に寄っているか」の位置。50が中央 */
  value: number;
  color: string;
}

/** つまみの直径(px)。端でも欠けないよう、この分を差し引いた範囲に置く */
const MARKER = 14;

/**
 * 中央からの離れ方を日本語にする。
 * 「80%」ではなく「ややHIGH寄り」と読ませることで、点数だと誤解されないようにする。
 */
function positionLabel(value: number, leftLabel: string, rightLabel: string): string {
  const distance = Math.abs(value - 50);
  if (distance <= 7) return "まんなか";
  const side = value < 50 ? leftLabel : rightLabel;
  if (distance <= 20) return `やや${side}寄り`;
  if (distance <= 35) return `${side}寄り`;
  return `かなり${side}寄り`;
}

/**
 * 双方向メーター。
 *
 * 左→右に伸びる量のバーではなく、中央を基準にどちら側へ寄っているかを示す。
 * 0 は「ゼロ・不足」ではなく「左端の傾向が強い」という意味になる。
 * （例: 温度0 = かなりCOOL寄り。バーが空になるのではなく、つまみが左端に立つ）
 */
export function AxisMeter({
  name,
  leftIcon,
  leftLabel,
  rightIcon,
  rightLabel,
  value,
  color,
}: AxisMeterProps) {
  const v = Math.max(0, Math.min(100, value));
  const position = positionLabel(v, leftLabel, rightLabel);

  // つまみの左端と中心。中心を基準に塗りの範囲を決める
  const markerLeft = `${v / 100} * (100% - ${MARKER}px)`;
  const markerCenter = `${markerLeft} + ${MARKER / 2}px`;
  // 中央からつまみまでを塗ることで、寄っている「向き」が見える
  const fill =
    v <= 50
      ? { left: `calc(${markerCenter})`, right: "50%" }
      : { left: "50%", right: `calc(100% - (${markerCenter}))` };

  return (
    <div className="w-full" role="group" aria-label={`${name}: ${position}`}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-ink">{name}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {position}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-[0.65rem] font-bold leading-none text-ink-soft">
          {leftIcon} {leftLabel}
        </span>

        <div className="relative h-2.5 flex-1 rounded-full bg-black/[0.06]">
          {/* まんなかの目印。ここが「どちらでもない」基準になる */}
          <div className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/20" />
          <div
            className="absolute top-0 h-full"
            style={{ ...fill, backgroundColor: color, opacity: 0.35 }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
            style={{
              left: `calc(${markerLeft})`,
              width: MARKER,
              height: MARKER,
              backgroundColor: color,
            }}
          />
        </div>

        <span className="shrink-0 text-[0.65rem] font-bold leading-none text-ink-soft">
          {rightLabel} {rightIcon}
        </span>
      </div>
    </div>
  );
}
