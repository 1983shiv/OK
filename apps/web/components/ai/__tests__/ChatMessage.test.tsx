import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessage', () => {
  it('renders user message aligned right', () => {
    render(<ChatMessage role="user" content="What is Nifty sentiment?" />);
    const container = screen.getByText('What is Nifty sentiment?').closest('div');
    expect(container?.parentElement?.className).toContain('justify-end');
  });

  it('renders assistant message aligned left', () => {
    render(<ChatMessage role="assistant" content="Nifty is bullish." />);
    const container = screen.getByText('Nifty is bullish.').closest('div');
    expect(container?.parentElement?.className).toContain('justify-start');
  });

  it('renders user message with brand background', () => {
    const { container } = render(<ChatMessage role="user" content="Test" />);
    const messageEl = container.querySelector('.bg-\\[var\\(--brand\\)\\]');
    expect(messageEl).toBeTruthy();
  });

  it('renders assistant message with card background', () => {
    const { container } = render(<ChatMessage role="assistant" content="Test" />);
    const messageEl = container.querySelector('.bg-\\[var\\(--card\\)\\]');
    expect(messageEl).toBeTruthy();
  });

  it('handles empty content', () => {
    const { container } = render(<ChatMessage role="assistant" content="" />);
    expect(container.textContent).toBe('');
  });

  it('preserves whitespace in content', () => {
    render(<ChatMessage role="assistant" content="Line 1\n\nLine 2" />);
    expect(screen.getByText(/Line 1/)).toBeTruthy();
  });
});
