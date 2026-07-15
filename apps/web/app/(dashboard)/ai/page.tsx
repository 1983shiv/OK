'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAccessToken, setAccessToken } from '../../../lib/api-client';
import { ChatInterface } from '../../../components/ai/ChatInterface';
import api from '../../../lib/api-client';

export default function AiPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const initialToken = getAccessToken();
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(!initialToken);

  useEffect(() => {
    if (initialToken) return;

    api
      .post('/auth/refresh')
      .then((res: { data?: { data?: { accessToken?: string }; accessToken?: string } }) => {
        const t = res.data?.data?.accessToken ?? res.data?.accessToken;
        if (t) {
          setAccessToken(t);
          setToken(t);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="animate-pulse text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center">
        <p className="text-xl font-semibold text-[var(--muted)] mb-2">Sign in required</p>
        <p className="text-sm text-[var(--muted)] mb-4">
          Please sign in to use the AI Market Analyst.
        </p>
        <Link
          href="/auth/magic-link"
          className="px-6 py-3 rounded-lg text-sm font-medium bg-[var(--brand)] text-white hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return <ChatInterface apiUrl={apiUrl} />;
}
