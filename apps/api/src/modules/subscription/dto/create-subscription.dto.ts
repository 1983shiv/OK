import { IsIn, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsIn(['starter', 'pro', 'elite'])
  planId!: string;

  @IsString()
  @IsIn(['monthly', 'yearly'])
  billingCycle!: string;
}
