'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost, setAccessToken } from '@/lib/api-client';

interface ApiResponse<T> {
  data?: T;
  accessToken?: string;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [errorMsg, setErrorMsg] = useState(token ? '' : 'No verification token provided.');

  useEffect(() => {
    if (!token) return;

    apiPost<ApiResponse<{ accessToken: string }>>('/auth/verify-magic-link', { token })
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
        setErrorMsg(axiosErr.response?.data?.error?.message ?? 'Verification failed.');
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
        <Link href="/auth/magic-link" className="text-sm text-[var(--brand)] hover:underline">
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-6 text-center">
      <h1 className="text-xl font-semibold mb-2 text-[var(--bullish)]">Signed in!</h1>
      <p className="text-sm text-[var(--muted)] mb-4">You are now signed in to OptionKart.</p>
      <button
        onClick={() => router.push('/dashboard')}
        className="inline-block px-4 py-2 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors"
      >
        Go to Dashboard
      </button>
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
