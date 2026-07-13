import { AlertEvaluator } from './alerts.evaluator';
import type { Alert } from '@prisma/client';

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert-1',
    userId: 'user-1',
    alertType: 'PCR_CROSS',
    symbol: 'NIFTY',
    strikePrice: null,
    optionType: null,
    conditionOperator: 'GT',
    conditionValue: 1.2,
    deliveryChannels: '["IN_APP"]',
    isActive: true,
    lastTriggeredAt: null,
    createdAt: new Date('2026-07-13'),
    updatedAt: new Date('2026-07-13'),
    ...overrides,
  } as Alert;
}

describe('AlertEvaluator', () => {
  let evaluator: AlertEvaluator;

  beforeEach(() => {
    evaluator = new AlertEvaluator();
  });

  it('triggers GT when current > condition', () => {
    const alert = makeAlert({ conditionOperator: 'GT', conditionValue: 1.0 });
    const result = evaluator.evaluate(alert, 1.5);
    expect(result.triggered).toBe(true);
    expect(result.currentValue).toBe(1.5);
    expect(result.message).toContain('>');
  });

  it('does not trigger GT when current <= condition', () => {
    const alert = makeAlert({ conditionOperator: 'GT', conditionValue: 1.0 });
    const result = evaluator.evaluate(alert, 0.8);
    expect(result.triggered).toBe(false);
    expect(result.message).toBe('');
  });

  it('triggers LT when current < condition', () => {
    const alert = makeAlert({ conditionOperator: 'LT', conditionValue: 1.0 });
    const result = evaluator.evaluate(alert, 0.5);
    expect(result.triggered).toBe(true);
  });

  it('does not trigger LT when current >= condition', () => {
    const alert = makeAlert({ conditionOperator: 'LT', conditionValue: 1.0 });
    const result = evaluator.evaluate(alert, 1.5);
    expect(result.triggered).toBe(false);
  });

  it('triggers CROSS_ABOVE when current > condition', () => {
    const alert = makeAlert({
      conditionOperator: 'CROSS_ABOVE',
      conditionValue: 1.0,
    });
    const result = evaluator.evaluate(alert, 1.2);
    expect(result.triggered).toBe(true);
    expect(result.message).toContain('crossed above');
  });

  it('triggers CROSS_BELOW when current < condition', () => {
    const alert = makeAlert({
      conditionOperator: 'CROSS_BELOW',
      conditionValue: 1.0,
    });
    const result = evaluator.evaluate(alert, 0.8);
    expect(result.triggered).toBe(true);
    expect(result.message).toContain('crossed below');
  });

  it('uses symbol in message', () => {
    const alert = makeAlert({
      symbol: 'BANKNIFTY',
      conditionOperator: 'GT',
      conditionValue: 1.0,
    });
    const result = evaluator.evaluate(alert, 1.5);
    expect(result.message).toContain('BANKNIFTY');
  });
});
