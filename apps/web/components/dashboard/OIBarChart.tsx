'use client';

export function OIBarChart({
  totalCallOI,
  totalPutOI,
}: {
  totalCallOI: number;
  totalPutOI: number;
}) {
  const max = Math.max(totalCallOI, totalPutOI);
  const callPct = (totalCallOI / max) * 100;
  const putPct = (totalPutOI / max) * 100;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium mb-3">Open Interest</h3>
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
            <span>Calls</span>
            <span>{(totalCallOI / 1_00_00_000).toFixed(2)}Cr</span>
          </div>
          <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--bearish)] rounded-full"
              style={{ width: `${callPct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
            <span>Puts</span>
            <span>{(totalPutOI / 1_00_00_000).toFixed(2)}Cr</span>
          </div>
          <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--bullish)] rounded-full"
              style={{ width: `${putPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
