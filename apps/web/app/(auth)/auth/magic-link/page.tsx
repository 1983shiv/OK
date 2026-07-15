'use client';

import { Suspense, useState, FormEvent } from 'react';
import { apiPost } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiPost('/auth/magic-link', { email });
      setSent(true);
    } catch {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Check your email</h1>
        <p className="text-sm text-[var(--muted)]">
          If an account exists with <strong className="text-[var(--foreground)]">{email}</strong>,
          we&apos;ve sent a magic link.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h1 className="text-xl font-semibold mb-1">Sign in to OptionKart</h1>
      <p className="text-sm text-[var(--muted)] mb-6">Enter your email to receive a magic link.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--brand)] transition-colors"
        />
        {error && <p className="text-sm text-[var(--bearish)]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <a
          href="/auth/google/callback"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--surface-hover)] transition-colors"
        >
          Continue with Google
        </a>
      </div>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="card p-6 text-center">
          <p className="text-[var(--muted)]">Loading...</p>
        </div>
      }
    >
      <MagicLinkForm />
    </Suspense>
  );
}
