'use client';

import { apiPost } from '../../../lib/api-client';
import { useState } from 'react';

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['5 watchlist items', '3 active alerts', '5 AI queries/day', 'Today-only data'],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: '₹199',
    period: '/month',
    features: [
      '15 watchlist items',
      '10 active alerts',
      '30 AI queries/day',
      '7-day historical data',
      'Heatmap access',
    ],
    cta: 'Subscribe',
    popular: false,
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '₹499',
    period: '/month',
    features: [
      '30 watchlist items',
      '25 active alerts',
      '100 AI queries/day',
      '30-day historical data',
      'Heatmap + strategy AI',
      'Telegram delivery',
      'Daily brief',
    ],
    cta: 'Subscribe',
    popular: true,
  },
  {
    id: 'ELITE',
    name: 'Elite',
    price: '₹999',
    period: '/month',
    features: [
      '50 watchlist items',
      'Unlimited alerts',
      '300 AI queries/day',
      '90-day history + CSV',
      'All features',
      'BYO OpenAI key',
    ],
    cta: 'Subscribe',
    popular: false,
  },
];

export default function PricingPage() {
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    setError(null);
    try {
      interface SubscriptionResponse {
        data?: { razorpayOrderId?: string; status?: string };
        razorpayOrderId?: string;
        status?: string;
      }
      const res: SubscriptionResponse = await apiPost<SubscriptionResponse>(
        '/subscription/create',
        {
          plan: planId,
          billingCycle: 'monthly',
        },
      );
      const data = res.data ?? res;
      if (data.razorpayOrderId) {
        alert('Redirect to Razorpay checkout: ' + data.razorpayOrderId);
      } else if (data.status === 'ACTIVE') {
        alert(`Subscribed to ${planId} plan! (mock mode)`);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr?.response?.data?.message ?? axiosErr?.message ?? 'Subscription failed');
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Plans & Pricing</h1>
        <p className="text-[var(--muted)] mt-2">Choose the plan that fits your trading needs</p>
      </div>

      {error && (
        <div className="card p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`card p-6 flex flex-col gap-4 relative ${
              plan.popular ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]' : ''
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--brand)] text-white text-xs font-medium">
                Popular
              </span>
            )}
            <div>
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-[var(--muted)]">{plan.period}</span>
              </div>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-[var(--foreground)] flex items-center gap-2">
                  <span className="text-[var(--bullish)]">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={plan.disabled || subscribing === plan.id}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                plan.disabled
                  ? 'bg-[var(--border)] text-[var(--muted)] cursor-default'
                  : 'bg-[var(--brand)] text-white hover:opacity-90'
              } disabled:opacity-50`}
            >
              {subscribing === plan.id ? 'Processing...' : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
