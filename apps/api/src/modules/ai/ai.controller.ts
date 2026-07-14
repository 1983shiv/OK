import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/ai-chat.dto';
import { StrategySuggestDto } from './dto/strategy-suggest.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGateGuard } from '../../common/guards/plan-gate.guard';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { Public } from '../../common/decorators/public.decorator';

interface RequestWithUser {
  user?: { sub: string; plan: string };
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() dto: AiChatDto,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const user = req.user!;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    await this.aiService.streamChat(
      user.sub,
      user.plan,
      dto.query,
      dto.index,
      dto.sessionId,
      {
        onToken: (token: string) => {
          res.write(
            `data: ${JSON.stringify({ type: 'token', content: token })}\n\n`,
          );
        },
        onDone: (tokensUsed: number, creditsRemaining: number) => {
          res.write(
            `data: ${JSON.stringify({ type: 'done', tokensUsed, creditsRemaining })}\n\n`,
          );
          res.end();
        },
        onError: (error: Error) => {
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`,
          );
          res.end();
        },
      },
    );
  }

  @Post('strategy-suggest')
  @UseGuards(PlanGateGuard)
  @RequiresPlan('PRO', 'ELITE')
  @HttpCode(HttpStatus.OK)
  async suggestStrategy(
    @Body() dto: StrategySuggestDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user!;
    return this.aiService.suggestStrategy(user.sub, user.plan, dto.index);
  }

  @Get('daily-brief/:index')
  @UseGuards(PlanGateGuard)
  @RequiresPlan('PRO', 'ELITE')
  async getDailyBrief(@Param('index') index: string) {
    const brief = await this.aiService.getDailyBrief(index);
    if (!brief) {
      return {
        brief: null,
        date: null,
        message: 'No brief available yet. Briefs are generated at 3:35 PM IST.',
      };
    }
    return brief;
  }

  @Get('usage')
  @HttpCode(HttpStatus.OK)
  async getUsage(@Req() req: RequestWithUser) {
    const user = req.user!;
    return this.aiService.getUsage(user.sub, user.plan);
  }

  @Get('status')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getStatus(@Req() req: RequestWithUser) {
    const user = req.user || { sub: '', plan: 'FREE' };
    return this.aiService.getAiStatus(user.sub, user.plan);
  }
}
