'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../../../lib/api-client';

interface WatchlistItem {
  id: string;
  symbol: string;
  strikePrice: number;
  optionType: string;
  expiryDate: string;
  createdAt: string;
}

interface ApiEnvelope<T> {
  data: T;
  success: boolean;
  timestamp: string;
}

interface AxiosErr {
  response?: { data?: { message?: string } };
  message?: string;
}

export default function WatchlistPage() {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState('');
  const [strike, setStrike] = useState('');
  const [optionType, setOptionType] = useState<'CE' | 'PE'>('CE');
  const [expiry, setExpiry] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiGet<ApiEnvelope<WatchlistItem[]>>('/watchlist').then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (body: unknown) => apiPost('/watchlist', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setSymbol('');
      setStrike('');
      setExpiry('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/watchlist/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const items: WatchlistItem[] = data ?? [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      instrumentKey: `${symbol}_${strike}_${optionType}_${expiry}`,
      symbol,
      strikePrice: parseInt(strike, 10),
      optionType,
      expiryDate: new Date(expiry).toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl animate-pulse">
        <div className="card h-12" />
        <div className="card h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center max-w-2xl">
        <p className="text-[var(--bearish)]">Failed to load watchlist.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Watchlist</h1>

      <form onSubmit={handleAdd} className="card p-4 flex flex-col gap-3">
        <h3 className="text-sm font-medium">Add Item</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Symbol (e.g. NIFTY)"
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand)]"
          />
          <input
            value={strike}
            onChange={(e) => setStrike(e.target.value)}
            placeholder="Strike price"
            type="number"
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand)]"
          />
          <select
            value={optionType}
            onChange={(e) => setOptionType(e.target.value as 'CE' | 'PE')}
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand)]"
          >
            <option value="CE">CE</option>
            <option value="PE">PE</option>
          </select>
          <input
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            placeholder="Expiry date"
            type="date"
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand)]"
          />
          <button
            type="submit"
            disabled={!symbol || !strike || !expiry || addMutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {addMutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
        {addMutation.error && (
          <p className="text-sm text-red-400">
            {(addMutation.error as AxiosErr).response?.data?.message ??
              (addMutation.error as AxiosErr).message ??
              'Failed to add item'}
          </p>
        )}
      </form>

      {items.length === 0 ? (
        <div className="card p-6 text-center text-[var(--muted)]">
          Your watchlist is empty. Add strikes above.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item: WatchlistItem) => (
            <div key={item.id} className="card p-4 flex items-center justify-between">
              <div>
                <span className="font-medium">{item.symbol}</span>
                <span className="ml-2 text-sm text-[var(--muted)]">
                  {item.strikePrice} {item.optionType}
                </span>
                <span className="ml-2 text-xs text-[var(--muted)]">
                  {new Date(item.expiryDate).toLocaleDateString('en-IN')}
                </span>
              </div>
              <button
                onClick={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
