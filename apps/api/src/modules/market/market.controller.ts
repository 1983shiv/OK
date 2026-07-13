import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MarketService } from './market.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { PlanGateGuard } from '../../common/guards/plan-gate.guard';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('dashboard/:index')
  @Public()
  async getDashboard(@Param('index') index: string) {
    return this.marketService.getDashboard(index.toUpperCase());
  }

  @Get('chain/:index')
  @Public()
  async getChain(@Param('index') index: string) {
    return this.marketService.getChain(index.toUpperCase());
  }

  @Get('spot/:index')
  @Public()
  async getSpot(@Param('index') index: string) {
    return this.marketService.getSpot(index.toUpperCase());
  }

  @Get('pcr/:index')
  @Public()
  async getPCR(@Param('index') index: string) {
    return this.marketService.getPCR(index.toUpperCase());
  }

  @Get('max-pain/:index')
  @Public()
  async getMaxPain(@Param('index') index: string) {
    return this.marketService.getMaxPain(index.toUpperCase());
  }

  @Get('support-resistance/:index')
  @Public()
  async getSupportResistance(@Param('index') index: string) {
    return this.marketService.getSupportResistance(index.toUpperCase());
  }

  @Get('pcr/:index/history')
  @UseGuards(PlanGateGuard)
  @RequiresPlan('STARTER', 'PRO', 'ELITE')
  async getPCRHistory(@Param('index') index: string) {
    return this.marketService.getPCRHistory(index.toUpperCase());
  }

  @Get('heatmap/:index')
  @UseGuards(PlanGateGuard)
  @RequiresPlan('STARTER', 'PRO', 'ELITE')
  async getHeatmap(@Param('index') index: string) {
    return this.marketService.getHeatmap(index.toUpperCase());
  }

  @Get('oi-history/:index')
  @UseGuards(PlanGateGuard)
  @RequiresPlan('STARTER', 'PRO', 'ELITE')
  async getOIHistory(@Param('index') index: string) {
    return this.marketService.getOIHistory(index.toUpperCase());
  }

  @Get('unusual-activity/:index')
  @UseGuards(PlanGateGuard)
  @RequiresPlan('STARTER', 'PRO', 'ELITE')
  async getUnusualActivity(@Param('index') index: string) {
    return this.marketService.getUnusualActivity(index.toUpperCase());
  }
}
