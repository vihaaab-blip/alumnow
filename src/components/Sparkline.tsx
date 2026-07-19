export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 72, h = 24;
  const max = Math.max(...data, 1);
  const pts = data.length < 2
    ? `0,${h - ((data[0] ?? 0) / max) * h}`
    : data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}
