'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiPost, setAccessToken } from '@/lib/api-client';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token provided.');
      return;
    }

    apiPost<{ accessToken: string }>('/auth/verify-magic-link', { token })
      .then((res) => {
        const accessToken = (res as any).data?.accessToken ?? (res as any).accessToken;
        setAccessToken(accessToken);
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err?.response?.data?.error?.message ?? 'Verification failed.');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)]">Verifying your link...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-xl font-semibold mb-2 text-[var(--bearish)]">Verification failed</h1>
        <p className="text-sm text-[var(--muted)] mb-4">{errorMsg}</p>
        <a href="/auth/magic-link" className="text-sm text-[var(--brand)] hover:underline">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="card p-6 text-center">
      <h1 className="text-xl font-semibold mb-2 text-[var(--bullish)]">Signed in!</h1>
      <p className="text-sm text-[var(--muted)] mb-4">You are now signed in to OptionKart.</p>
      <a
        href="/dashboard"
        className="inline-block px-4 py-2 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="card p-6 text-center">
          <p className="text-[var(--muted)]">Loading...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
