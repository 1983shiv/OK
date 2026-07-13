'use client';

interface MoversItem {
  strikePrice: number;
  callOIChange?: number;
  putOIChange?: number;
}

export function TopMovers({
  title,
  items,
  field,
}: {
  title: string;
  items: MoversItem[];
  field: 'callOIChange' | 'putOIChange';
}) {
  if (!items || items.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-medium mb-3">{title}</h3>
        <p className="text-xs text-[var(--muted)]">No data available</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.strikePrice} className="flex justify-between items-center text-sm">
            <span className="text-[var(--muted)]">{item.strikePrice}</span>
            <span
              className={`font-medium ${(item[field] ?? 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}
            >
              {(item[field] ?? 0) >= 0 ? '+' : ''}
              {(item[field] ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
