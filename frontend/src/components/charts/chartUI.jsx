// Shared premium styling for recharts across the app.

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
};

export const gridProps = {
  strokeDasharray: '3 6',
  stroke: 'hsl(var(--border))',
  strokeOpacity: 0.6,
  vertical: false,
};

/** A glassy, rounded tooltip that matches the design system. */
export function ChartTooltipContent({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-elevated backdrop-blur-xl">
      {label != null && label !== '' && (
        <div className="mb-1.5 text-xs font-semibold text-foreground">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: p.color || p.payload?.fill || p.fill }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {format ? format(p.value, p) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Gradient stop definitions reused by area/bar charts. */
export function LinearGradient({ id, color, from = 0.45, to = 0 }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={from} />
      <stop offset="100%" stopColor={color} stopOpacity={to} />
    </linearGradient>
  );
}
