import { Injectable } from '@nestjs/common';
import type { Alert } from '@prisma/client';

export interface EvaluationResult {
  triggered: boolean;
  currentValue: number;
  message: string;
}

@Injectable()
export class AlertEvaluator {
  evaluate(alert: Alert, currentValue: number): EvaluationResult {
    const { conditionOperator, conditionValue } = alert;
    let triggered = false;
    const symbol = alert.symbol;

    switch (conditionOperator) {
      case 'GT':
        triggered = currentValue > conditionValue;
        break;
      case 'LT':
        triggered = currentValue < conditionValue;
        break;
      case 'CROSS_ABOVE':
        triggered = currentValue > conditionValue;
        break;
      case 'CROSS_BELOW':
        triggered = currentValue < conditionValue;
        break;
    }

    const operatorLabel =
      conditionOperator === 'GT'
        ? '>'
        : conditionOperator === 'LT'
          ? '<'
          : conditionOperator === 'CROSS_ABOVE'
            ? 'crossed above'
            : 'crossed below';

    return {
      triggered,
      currentValue,
      message: triggered
        ? `${symbol} ${operatorLabel} ${conditionValue} (current: ${currentValue})`
        : '',
    };
  }
}
