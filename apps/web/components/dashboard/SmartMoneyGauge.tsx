interface SmartMoneyGaugeProps {
  mfi: number;
  signal: 'BUYING' | 'SELLING' | 'NEUTRAL';
}

export function SmartMoneyGauge({ mfi, signal }: SmartMoneyGaugeProps) {
  const color =
    signal === 'BUYING'
      ? 'var(--bullish)'
      : signal === 'SELLING'
        ? 'var(--bearish)'
        : 'var(--foreground)';

  const icon = signal === 'BUYING' ? '↑' : signal === 'SELLING' ? '↓' : '→';

  return (
    <div className="card p-4 flex flex-col justify-between">
      <span className="text-sm text-[var(--muted)]">Smart Money</span>
      <span className="text-xl font-semibold" style={{ color }}>
        {icon} {signal}
      </span>
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>MFI: {mfi.toFixed(2)}</span>
      </div>
    </div>
  );
}
