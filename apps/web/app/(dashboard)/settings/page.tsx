'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../../lib/api-client';

export default function SettingsPage() {
  const [byoKey, setByoKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>('/user/profile')
      .then((r: any) => {
        setPlan((r as any).data?.plan ?? (r as any).plan ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isElite = plan === 'ELITE';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    try {
      await apiPatch('/user/preferences', {
        byoOpenaiKey: byoKey.trim() || null,
      });
      setSaved(true);
      setByoKey('');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to save');
    }
  };

  const handleRemove = async () => {
    setError(null);
    try {
      await apiPatch('/user/preferences', { byoOpenaiKey: null });
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to remove');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="card h-48" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-2">OpenAI API Key</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          {isElite
            ? 'As an Elite plan user, you can bring your own OpenAI API key. Your key is encrypted and never exposed to the client.'
            : 'Bring your own OpenAI key is available on the Elite plan.'}
        </p>

        {!isElite && (
          <div className="card p-4 bg-[var(--brand)]/10 border border-[var(--brand)]/20">
            <p className="text-sm">
              <a href="/pricing" className="text-[var(--brand)] hover:underline">
                Upgrade to Elite
              </a>{' '}
              to use your own OpenAI API key.
            </p>
          </div>
        )}

        {isElite && (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <input
              type="password"
              value={byoKey}
              onChange={(e) => setByoKey(e.target.value)}
              placeholder="sk-..."
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--brand)]"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!byoKey.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Save Key
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Remove Key
              </button>
            </div>

            {saved && <p className="text-sm text-[var(--bullish)]">Saved successfully.</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
