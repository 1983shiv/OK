import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SmartMoneyGauge } from '../SmartMoneyGauge';

describe('SmartMoneyGauge', () => {
  it('renders BUYING signal', () => {
    render(<SmartMoneyGauge mfi={1.5} signal="BUYING" />);
    expect(screen.getByText((c) => c.includes('BUYING'))).toBeDefined();
    expect(screen.getByText((c) => c.includes('1.50'))).toBeDefined();
  });

  it('renders SELLING signal', () => {
    render(<SmartMoneyGauge mfi={0.5} signal="SELLING" />);
    expect(screen.getByText((c) => c.includes('SELLING'))).toBeDefined();
  });

  it('renders NEUTRAL signal', () => {
    render(<SmartMoneyGauge mfi={1.0} signal="NEUTRAL" />);
    expect(screen.getByText((c) => c.includes('NEUTRAL'))).toBeDefined();
  });
});
