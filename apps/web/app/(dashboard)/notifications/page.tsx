'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '../../../lib/api-client';

interface Notification {
  id: string;
  alertId: string;
  triggerValue: number;
  message: string;
  readAt: string | null;
  createdAt: string;
  alert: { alertType: string; symbol: string };
}

interface ApiEnvelope<T> {
  data: T;
  success: boolean;
  timestamp: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<ApiEnvelope<Notification[]>>('/alerts/history').then((r) => r.data),
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () =>
      apiGet<ApiEnvelope<{ count: number }>>('/notifications/unread-count').then((r) => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const notifications: Notification[] = data ?? [];
  const unreadCount: number = unreadData?.count ?? 0;

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
        <p className="text-[var(--bearish)]">Failed to load notifications.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <span className="text-sm text-[var(--muted)]">{unreadCount} unread</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-6 text-center text-[var(--muted)]">
          No notifications yet. Alerts you create will appear here when triggered.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n: Notification) => (
            <div
              key={n.id}
              className={`card p-4 flex items-start justify-between ${
                !n.readAt ? 'border-l-2 border-l-[var(--brand)]' : ''
              }`}
            >
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase text-[var(--muted)]">
                    {n.alert.alertType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-[var(--muted)]">{n.alert.symbol}</span>
                </div>
                <p className="text-sm">{n.message}</p>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(n.createdAt).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                  })}
                </span>
              </div>
              {!n.readAt && (
                <button
                  onClick={() => markReadMutation.mutate(n.id)}
                  disabled={markReadMutation.isPending}
                  className="text-xs text-[var(--brand)] hover:opacity-80 shrink-0 ml-2"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
