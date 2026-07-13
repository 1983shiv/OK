'use client';

export function PCRGauge({ pcr, trend }: { pcr: number; trend: string }) {
  const arrow = trend === 'RISING' ? '↑' : trend === 'FALLING' ? '↓' : '→';
  const color = pcr < 0.5 ? 'var(--bearish)' : pcr > 1.0 ? 'var(--bullish)' : 'var(--neutral)';

  return (
    <div className="card p-4 flex flex-col justify-between">
      <span className="text-sm text-[var(--muted)]">Put-Call Ratio</span>
      <span className="text-xl font-semibold" style={{ color }}>
        {pcr.toFixed(2)}
      </span>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(pcr / 0.02, 100)}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-[var(--muted)]">{arrow}</span>
      </div>
    </div>
  );
}
