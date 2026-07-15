import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, Context, session, SessionFlavor } from 'grammy';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';

interface SessionData {
  linkedUserId?: string;
}

type BotContext = Context & SessionFlavor<SessionData>;

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Bot<BotContext> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly marketService: MarketService,
  ) {}

  async onModuleInit(): Promise<void> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
      return;
    }

    this.bot = new Bot<BotContext>(token);

    this.bot.use(session({ initial: () => ({}) }));

    this.bot.command('start', async (ctx) => {
      const payload = ctx.match;
      if (payload) {
        const userId = payload;
        await this.prisma.client.userPreferences.updateMany({
          where: { userId },
          data: { telegramChatId: String(ctx.chat?.id ?? '') },
        });
        ctx.session.linkedUserId = userId;
        await ctx.reply(
          '✅ Your Telegram account is now linked to OptionKart!\n\n' +
            'You will receive alert notifications here.\n\n' +
            'Commands:\n' +
            '/pcr — Current PCR for Nifty/BankNifty\n' +
            '/signal — Market sentiment signal\n' +
            '/watchlist — Your watchlist with current prices',
        );
      } else {
        await ctx.reply(
          'Welcome to OptionKart!\n\n' +
            'Please use the link from the OptionKart app to connect your account.\n\n' +
            'Once linked, you can use:\n' +
            '/pcr — Current PCR\n' +
            '/signal — Market sentiment\n' +
            '/watchlist — Your watchlist',
        );
      }
    });

    this.bot.command('pcr', async (ctx) => {
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      const linked = await this.getLinkedUser(String(chatId));
      if (!linked) {
        await ctx.reply(
          '❌ Please link your account first via the OptionKart app.',
        );
        return;
      }

      try {
        const nifty = await this.marketService.getDashboard('NIFTY');
        const banknifty = await this.marketService.getDashboard('BANKNIFTY');
        await ctx.reply(
          '📊 *Put-Call Ratio*\n\n' +
            `Nifty PCR: \`${nifty.pcr.toFixed(2)}\`\n` +
            `Sentiment: ${nifty.sentiment}\n\n` +
            `BankNifty PCR: \`${banknifty.pcr.toFixed(2)}\`\n` +
            `Sentiment: ${banknifty.sentiment}`,
          { parse_mode: 'Markdown' },
        );
      } catch {
        await ctx.reply('⚠️ Could not fetch market data right now.');
      }
    });

    this.bot.command('signal', async (ctx) => {
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      const linked = await this.getLinkedUser(String(chatId));
      if (!linked) {
        await ctx.reply(
          '❌ Please link your account first via the OptionKart app.',
        );
        return;
      }

      try {
        const nifty = await this.marketService.getDashboard('NIFTY');
        await ctx.reply(
          '📈 *Market Signal — Nifty*\n\n' +
            `Signal: *${nifty.sentiment}*\n` +
            `Score: ${nifty.sentimentScore}/100\n` +
            `PCR: ${nifty.pcr.toFixed(2)}\n` +
            `Spot: ${nifty.spotPrice.toLocaleString('en-IN')}\n` +
            `Max Pain: ${nifty.maxPain.toLocaleString('en-IN')}\n` +
            `Status: ${nifty.marketStatus}`,
          { parse_mode: 'Markdown' },
        );
      } catch {
        await ctx.reply('⚠️ Could not fetch market data right now.');
      }
    });

    this.bot.command('watchlist', async (ctx) => {
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      const linked = await this.getLinkedUser(String(chatId));
      if (!linked) {
        await ctx.reply(
          '❌ Please link your account first via the OptionKart app.',
        );
        return;
      }

      try {
        const items = await this.prisma.client.watchlistItem.findMany({
          where: { userId: linked },
          take: 10,
        });

        if (items.length === 0) {
          await ctx.reply(
            '📭 Your watchlist is empty. Add items from the OptionKart dashboard.',
          );
          return;
        }

        const lines = items.map(
          (item) => `• ${item.symbol} ${item.strikePrice} ${item.optionType}`,
        );
        await ctx.reply(
          `📋 *Watchlist (${items.length})*\n\n${lines.join('\n')}`,
          {
            parse_mode: 'Markdown',
          },
        );
      } catch {
        await ctx.reply('⚠️ Could not fetch watchlist right now.');
      }
    });

    this.bot.catch((err) => {
      this.logger.error('Telegram bot error', err);
    });

    await this.bot.start({ drop_pending_updates: true });
    this.logger.log('Telegram bot started');
  }

  private async getLinkedUser(chatId: string): Promise<string | null> {
    const prefs = await this.prisma.client.userPreferences.findFirst({
      where: { telegramChatId: chatId },
      select: { userId: true },
    });
    return prefs?.userId ?? null;
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.bot) {
      this.logger.warn('Telegram bot not configured — cannot send message');
      return;
    }
    try {
      await this.bot.api.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (err) {
      this.logger.error(`Failed to send Telegram message to ${chatId}`, err);
    }
  }

  async sendAlert(
    userId: string,
    alertTitle: string,
    message: string,
  ): Promise<void> {
    const prefs = await this.prisma.client.userPreferences.findFirst({
      where: { userId },
      select: { telegramChatId: true },
    });

    if (!prefs?.telegramChatId) return;

    const formatted = `🔔 *${alertTitle}*\n\n${message}`;
    await this.sendMessage(prefs.telegramChatId, formatted);
  }

  get isConfigured(): boolean {
    return this.bot !== null;
  }
}
