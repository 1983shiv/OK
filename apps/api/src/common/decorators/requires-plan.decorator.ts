import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PLANS_KEY = 'requiredPlans';
export const RequiresPlan = (...plans: string[]) =>
  SetMetadata(REQUIRED_PLANS_KEY, plans);
