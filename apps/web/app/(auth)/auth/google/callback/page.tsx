'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost, setAccessToken } from '@/lib/api-client';

interface ApiResponse<T> {
  data?: T;
  accessToken?: string;
}

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(code ? 'loading' : 'error');
  const [errorMsg, setErrorMsg] = useState(
    code ? '' : 'No authorization code received from Google.',
  );

  useEffect(() => {
    if (!code) return;

    apiPost<ApiResponse<{ accessToken: string }>>('/auth/google', { code })
      .then((res) => {
        const accessToken = res.data?.accessToken ?? res.accessToken;
        if (accessToken) {
          setAccessToken(accessToken);
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg('Invalid response from server.');
        }
      })
      .catch((err: Error) => {
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
        setStatus('error');
        setErrorMsg(axiosErr.response?.data?.error?.message ?? 'Google sign-in failed.');
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
        <Link href="/auth/magic-link" className="text-sm text-[var(--brand)] hover:underline">
          Try email instead
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-6 text-center">
      <h1 className="text-xl font-semibold mb-2 text-[var(--bullish)]">Signed in with Google!</h1>
      <p className="text-sm text-[var(--muted)] mb-4">You are now signed in to OptionKart.</p>
      <button
        onClick={() => router.push('/')}
        className="inline-block px-4 py-2 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors"
      >
        Go to Dashboard
      </button>
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
