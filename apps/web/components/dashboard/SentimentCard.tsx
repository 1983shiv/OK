'use client';

export function SentimentCard({ sentiment, score }: { sentiment: string; score: number }) {
  const color =
    sentiment === 'BULLISH'
      ? 'var(--bullish)'
      : sentiment === 'BEARISH'
        ? 'var(--bearish)'
        : 'var(--neutral)';

  return (
    <div className="card p-4 flex flex-col justify-between">
      <span className="text-sm text-[var(--muted)]">Market Sentiment</span>
      <span className="text-xl font-semibold" style={{ color }}>
        {sentiment}
      </span>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-[var(--muted)]">{score}/100</span>
      </div>
    </div>
  );
}
