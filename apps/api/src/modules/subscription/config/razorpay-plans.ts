export const RAZORPAY_PLAN_IDS: Record<
  string,
  { monthly: string; yearly: string }
> = {
  starter: {
    monthly:
      process.env.RAZORPAY_PLAN_STARTER_MONTHLY ?? 'plan_starter_monthly',
    yearly: process.env.RAZORPAY_PLAN_STARTER_YEARLY ?? 'plan_starter_yearly',
  },
  pro: {
    monthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY ?? 'plan_pro_monthly',
    yearly: process.env.RAZORPAY_PLAN_PRO_YEARLY ?? 'plan_pro_yearly',
  },
  elite: {
    monthly: process.env.RAZORPAY_PLAN_ELITE_MONTHLY ?? 'plan_elite_monthly',
    yearly: process.env.RAZORPAY_PLAN_ELITE_YEARLY ?? 'plan_elite_yearly',
  },
};

export const PLAN_PRICES_PAISE: Record<
  string,
  { monthly: number; yearly: number }
> = {
  starter: { monthly: 19900, yearly: 190800 },
  pro: { monthly: 49900, yearly: 478800 },
  elite: { monthly: 99900, yearly: 958800 },
};
