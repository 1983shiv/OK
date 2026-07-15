'use client';

import posthog from 'posthog-js';
import { getAccessToken } from './api-client';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export function initPostHog(): void {
  if (typeof window === 'undefined') return;
  if (!POSTHOG_KEY) return;
  if (posthog.__loaded) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    autocapture: true,
    loaded: (ph) => {
      ph.identify(getAccessToken() ?? undefined);
    },
  });
}

export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean | undefined>,
): void {
  if (typeof window === 'undefined') return;
  if (!POSTHOG_KEY) return;

  posthog.capture(name, {
    ...properties,
    user_plan: properties?.user_plan ?? 'unknown',
  });
}

export function identifyUser(
  userId: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return;
  if (!POSTHOG_KEY) return;

  posthog.identify(userId, properties);
}

export function resetAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (!POSTHOG_KEY) return;

  posthog.reset();
}
