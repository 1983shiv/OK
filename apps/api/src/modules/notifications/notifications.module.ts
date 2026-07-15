import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { TelegramBotService } from './telegram-bot.service';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [MarketModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, TelegramBotService],
  exports: [NotificationsService, EmailService, TelegramBotService],
})
export class NotificationsModule {}
