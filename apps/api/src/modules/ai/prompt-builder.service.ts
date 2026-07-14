import { Injectable } from '@nestjs/common';
import type { MarketContext } from './context-builder.service';

@Injectable()
export class PromptBuilderService {
  buildChatPrompt(
    context: MarketContext | null,
    query: string,
    history: Array<{ role: string; content: string }>,
  ): string {
    const contextBlock = context
      ? `CURRENT MARKET DATA (as of ${context.timestamp}):
- Index: ${context.index}
- Spot Price: ${context.spotPrice}
- PCR: ${context.pcr}
- Sentiment: ${context.sentiment} (score: ${context.sentimentScore})
- Max Pain: ${context.maxPain}
- Total Call OI: ${this.formatOI(context.totalCallOi)}
- Total Put OI: ${this.formatOI(context.totalPutOi)}
- Top Call Build-up: ${this.formatBuildup(context.topCallBuildup)}
- Top Put Build-up: ${this.formatBuildup(context.topPutBuildup)}`
      : 'No live market data available.';

    const historyBlock =
      history.length > 0
        ? `\n\nPREVIOUS CONVERSATION:\n${history
            .slice(-3)
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n')}`
        : '';

    return `You are OptionKart AI, an options data analyst for Indian markets (NSE).
Rules:
- Respond ONLY based on the data provided. Never fabricate numbers.
- Keep responses concise (max 150 words). If the user asks for detail, expand.
- Use simple language a beginner can understand.
- End with a relevant caveat or risk factor.
- NEVER recommend buying or selling any contract. Provide data-driven observations only.

${contextBlock}${historyBlock}

USER: ${query}

OPTIONKART AI:`;
  }

  buildStrategyPrompt(context: MarketContext | null, dte: number): string {
    const contextBlock = context
      ? `CURRENT MARKET DATA (as of ${context.timestamp}):
- Index: ${context.index}
- Spot Price: ${context.spotPrice}
- PCR: ${context.pcr}
- Sentiment: ${context.sentiment} (score: ${context.sentimentScore})
- Max Pain: ${context.maxPain}
- Total Call OI: ${this.formatOI(context.totalCallOi)}
- Total Put OI: ${this.formatOI(context.totalPutOi)}
- Days to Expiry: ${dte}`
      : 'No live market data available.';

    return `You are an options strategy educator. Suggest 2-3 strategies based on the data below.
- Explain WHY each fits the data.
- Include approximate profit/loss levels where possible.
- Rate confidence: High / Medium / Low.
- Format as a numbered list with clear headers.
- DISCLAIMER: These are educational examples, not trading advice.

${contextBlock}

Based on this data, suggest appropriate options strategies.`;
  }

  buildDailyBriefPrompt(
    index: string,
    summaryData: Record<string, unknown>,
  ): string {
    return `Generate a concise end-of-day market report for ${index}.

Format exactly as:
## ${index} Daily Brief — {date}
**Day's Verdict:** [one line]
**Key Numbers:** [5-6 bullets]
**What Happened:** [2-3 paragraphs]
**Watch Tomorrow:** [2-3 bullets]
**Confidence:** [High/Medium/Low]

DATA:
${JSON.stringify(summaryData, null, 2)}`;
  }

  private formatOI(oi: number): string {
    if (oi >= 1_00_00_000) return `${(oi / 1_00_00_000).toFixed(1)}Cr`;
    if (oi >= 1_00_000) return `${(oi / 1_00_000).toFixed(1)}L`;
    return oi.toLocaleString();
  }

  private formatBuildup(
    items: Array<{ strike: number; oiChange: number }>,
  ): string {
    if (!items || items.length === 0) return 'None';
    return items
      .map((i) => `Strike ${i.strike}: ${this.formatOI(i.oiChange)} OI change`)
      .join(' | ');
  }
}
