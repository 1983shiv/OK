'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api-client';

interface Alert {
  id: string;
  alertType: string;
  symbol: string;
  strikePrice: number | null;
  conditionOperator: string;
  conditionValue: number;
  deliveryChannels: string[];
  isActive: boolean;
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

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    alertType: 'PCR_CROSS',
    symbol: 'NIFTY',
    strikePrice: '',
    conditionOperator: 'GT',
    conditionValue: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiGet<ApiEnvelope<Alert[]>>('/alerts').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: unknown) => apiPost('/alerts', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setShowForm(false);
      setForm({
        alertType: 'PCR_CROSS',
        symbol: 'NIFTY',
        strikePrice: '',
        conditionOperator: 'GT',
        conditionValue: '',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPatch(`/alerts/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/alerts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const alerts: Alert[] = data ?? [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      strikePrice: form.strikePrice ? parseInt(form.strikePrice, 10) : null,
      conditionValue: parseFloat(form.conditionValue),
      deliveryChannels: ['IN_APP'],
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
        <p className="text-[var(--bearish)]">Failed to load alerts.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand)] text-white hover:opacity-90 transition-opacity"
        >
          {showForm ? 'Cancel' : 'New Alert'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-medium">Create Alert</h3>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.alertType}
              onChange={(e) => setForm({ ...form, alertType: e.target.value })}
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="PCR_CROSS">PCR Cross</option>
              <option value="OI_SPIKE">OI Spike</option>
              <option value="MAX_PAIN_SHIFT">Max Pain Shift</option>
            </select>
            <input
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder="Symbol"
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.strikePrice}
              onChange={(e) => setForm({ ...form, strikePrice: e.target.value })}
              placeholder="Strike (optional)"
              type="number"
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={form.conditionOperator}
              onChange={(e) => setForm({ ...form, conditionOperator: e.target.value })}
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="GT">Greater Than</option>
              <option value="LT">Less Than</option>
              <option value="CROSS_ABOVE">Crosses Above</option>
              <option value="CROSS_BELOW">Crosses Below</option>
            </select>
            <input
              value={form.conditionValue}
              onChange={(e) => setForm({ ...form, conditionValue: e.target.value })}
              placeholder="Condition value"
              type="number"
              step="0.01"
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!form.conditionValue || createMutation.isPending}
            className="self-start px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Alert'}
          </button>
          {createMutation.error && (
            <p className="text-sm text-red-400">
              {(createMutation.error as AxiosErr).response?.data?.message ??
                (createMutation.error as AxiosErr).message ??
                'Failed to create alert'}
            </p>
          )}
        </form>
      )}

      {alerts.length === 0 ? (
        <div className="card p-6 text-center text-[var(--muted)]">
          No alerts configured. Create one to get notified.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert: Alert) => (
            <div key={alert.id} className="card p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${alert.isActive ? 'bg-[var(--bullish)]' : 'bg-[var(--muted)]'}`}
                  />
                  <span className="font-medium">{alert.alertType.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-[var(--muted)]">{alert.symbol}</span>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {alert.conditionOperator} {alert.conditionValue}
                  {alert.strikePrice ? ` @ ${alert.strikePrice}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ id: alert.id, isActive: !alert.isActive })}
                  className={`text-xs px-2 py-1 rounded ${
                    alert.isActive
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-[var(--bullish)]/20 text-[var(--bullish)]'
                  }`}
                >
                  {alert.isActive ? 'Pause' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(alert.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
