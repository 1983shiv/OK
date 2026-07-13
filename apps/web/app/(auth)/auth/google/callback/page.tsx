'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiPost, setAccessToken } from '@/lib/api-client';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code received from Google.');
      return;
    }

    apiPost<{ accessToken: string }>('/auth/google', { code })
      .then((res) => {
        const accessToken = (res as any).data?.accessToken ?? (res as any).accessToken;
        setAccessToken(accessToken);
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err?.response?.data?.error?.message ?? 'Google sign-in failed.');
      });
  }, [code]);

  if (status === 'loading') {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)]">Completing Google sign-in...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-xl font-semibold mb-2 text-[var(--bearish)]">Sign-in failed</h1>
        <p className="text-sm text-[var(--muted)] mb-4">{errorMsg}</p>
        <a href="/auth/magic-link" className="text-sm text-[var(--brand)] hover:underline">
          Try email instead
        </a>
      </div>
    );
  }

  return (
    <div className="card p-6 text-center">
      <h1 className="text-xl font-semibold mb-2 text-[var(--bullish)]">Signed in with Google!</h1>
      <p className="text-sm text-[var(--muted)] mb-4">You are now signed in to OptionKart.</p>
      <a
        href="/"
        className="inline-block px-4 py-2 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="card p-6 text-center">
          <p className="text-[var(--muted)]">Loading...</p>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
