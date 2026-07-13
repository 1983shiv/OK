import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/jwt.service';
import type { Request } from 'express';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('create')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.createSubscription(
      user.sub,
      dto.planId,
      dto.billingCycle,
    );
  }

  @Post('cancel')
  async cancel(@CurrentUser() user: JwtPayload) {
    return this.subscriptionService.cancelSubscription(user.sub);
  }

  @Public()
  @Post('webhook')
  async webhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    if (!signature) throw new BadRequestException('Missing webhook signature');

    const bodyStr = JSON.stringify(req.body);
    return this.subscriptionService.handleWebhook(bodyStr, signature);
  }
}
