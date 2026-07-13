export function formatIndianNumber(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

export function formatCrore(n: number): string {
  if (n >= 1_00_00_000) {
    return `${(n / 1_00_00_000).toFixed(1)} Cr`;
  }
  return `${(n / 1_00_000).toFixed(1)} L`;
}

export function formatISTTime(date: Date | string): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(date));
}

export function formatISTDateTime(date: Date | string): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(date));
}
