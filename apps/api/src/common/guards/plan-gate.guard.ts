import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PLANS_KEY } from '../decorators/requires-plan.decorator';

@Injectable()
export class PlanGateGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PLANS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPlans || requiredPlans.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('User not found');

    if (!requiredPlans.includes(user.plan)) {
      throw new ForbiddenException(
        `This feature requires at least ${requiredPlans.join(' or ')} plan`,
      );
    }

    return true;
  }
}
