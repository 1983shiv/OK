import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VixWidget } from '../VixWidget';

describe('VixWidget', () => {
  it('renders VIX value', () => {
    render(<VixWidget vix={15.5} marketStatus="OPEN" />);
    expect(screen.getByText('15.5')).toBeDefined();
  });

  it('shows Low for VIX < 14', () => {
    render(<VixWidget vix={12.3} marketStatus="OPEN" />);
    expect(screen.getByText('Low Volatility')).toBeDefined();
  });

  it('shows Normal for VIX 14-20', () => {
    render(<VixWidget vix={16.0} marketStatus="CLOSED" />);
    expect(screen.getByText('Normal Volatility')).toBeDefined();
  });

  it('shows High for VIX > 20', () => {
    render(<VixWidget vix={25.4} marketStatus="OPEN" />);
    expect(screen.getByText('High Volatility')).toBeDefined();
  });
});
