import { Providers } from '../../components/providers';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <nav className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <a href="/" className="font-bold text-lg">
          Option<span className="text-[var(--brand)]">Kart</span>
        </a>
        <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <a href="/dashboard" className="hover:text-[var(--foreground)] transition-colors">
            Dashboard
          </a>
          <a href="/ai" className="hover:text-[var(--foreground)] transition-colors">
            AI
          </a>
          <a href="/settings" className="hover:text-[var(--foreground)] transition-colors">
            Settings
          </a>
          <a href="/auth/magic-link" className="hover:text-[var(--foreground)] transition-colors">
            Sign In
          </a>
        </div>
      </nav>
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">{children}</main>
    </Providers>
  );
}
