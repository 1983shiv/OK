export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-8">
      <main className="flex flex-col items-center gap-6 text-center max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight">
          Option<span className="text-[var(--brand)]">Kart</span>
        </h1>
        <p className="text-lg text-[var(--muted)]">
          Real-time Nifty & BankNifty options analytics. Track PCR, Max Pain, OI build-ups, and get
          AI-powered market insights.
        </p>
        <div className="flex gap-4 mt-4">
          <a
            href="/auth/magic-link"
            className="px-6 py-2.5 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors"
          >
            Get Started
          </a>
        </div>
      </main>
    </div>
  );
}
