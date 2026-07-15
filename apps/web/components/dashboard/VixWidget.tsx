interface VixWidgetProps {
  vix: number;
  marketStatus: string;
}

export function VixWidget({ vix, marketStatus }: VixWidgetProps) {
  const color = vix < 14 ? 'var(--bullish)' : vix < 20 ? 'var(--foreground)' : 'var(--bearish)';

  const label = vix < 14 ? 'Low' : vix < 20 ? 'Normal' : 'High';

  return (
    <div className="card p-4 flex flex-col justify-between">
      <span className="text-sm text-[var(--muted)]">India VIX</span>
      <span className="text-xl font-semibold" style={{ color }}>
        {vix.toFixed(1)}
      </span>
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>{label} Volatility</span>
        <span>{marketStatus}</span>
      </div>
    </div>
  );
}
