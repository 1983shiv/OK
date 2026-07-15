import Link from 'next/link';
import { Providers } from '../../components/providers';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <nav className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <Link href="/" className="font-bold text-lg">
          Option<span className="text-[var(--brand)]">Kart</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <Link href="/dashboard" className="hover:text-[var(--foreground)] transition-colors">
            Dashboard
          </Link>
          <Link href="/pricing" className="hover:text-[var(--foreground)] transition-colors">
            Pricing
          </Link>
          <Link href="/watchlist" className="hover:text-[var(--foreground)] transition-colors">
            Watchlist
          </Link>
          <Link href="/alerts" className="hover:text-[var(--foreground)] transition-colors">
            Alerts
          </Link>
          <Link href="/notifications" className="hover:text-[var(--foreground)] transition-colors">
            Notifications
          </Link>
          <Link href="/ai" className="hover:text-[var(--foreground)] transition-colors">
            AI
          </Link>
          <Link href="/settings" className="hover:text-[var(--foreground)] transition-colors">
            Settings
          </Link>
          <Link
            href="/auth/magic-link"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">{children}</main>
    </Providers>
  );
}
