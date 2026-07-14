import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

describe('ChatInterface', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders empty state with prompt text', () => {
    render(<ChatInterface apiUrl="http://localhost:3001/v1" />);
    expect(screen.getByText('Ask about market data')).toBeTruthy();
  });

  it('renders input field and send button', () => {
    render(<ChatInterface apiUrl="http://localhost:3001/v1" />);
    expect(screen.getByPlaceholderText('Ask about market data...')).toBeTruthy();
    expect(screen.getByRole('button', { name: /send/i })).toBeTruthy();
  });

  it('send button is disabled when input is empty', () => {
    render(<ChatInterface apiUrl="http://localhost:3001/v1" />);
    const button = screen.getByRole('button', { name: /send/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('send button is enabled when input has text', () => {
    render(<ChatInterface apiUrl="http://localhost:3001/v1" />);
    const input = screen.getByPlaceholderText('Ask about market data...');
    fireEvent.change(input, { target: { value: 'What is Nifty?' } });
    const button = screen.getByRole('button', { name: /send/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('sends message and shows user bubble', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => {
          let called = false;
          return {
            read: () => {
              if (!called) {
                called = true;
                const encoder = new TextEncoder();
                return Promise.resolve({
                  done: false,
                  value: encoder.encode(
                    'data: {"type":"token","content":"Hello"}\n\ndata: {"type":"done","tokensUsed":5,"creditsRemaining":4}\n\n',
                  ),
                });
              }
              return Promise.resolve({ done: true, value: undefined });
            },
          };
        },
      },
    });

    render(<ChatInterface apiUrl="http://localhost:3001/v1" />);
    const input = screen.getByPlaceholderText('Ask about market data...');
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Hi')).toBeTruthy();
    });
  });

  it('shows error on failed response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Quota exceeded' } }),
    });

    render(<ChatInterface apiUrl="http://localhost:3001/v1" />);
    const input = screen.getByPlaceholderText('Ask about market data...');
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Quota exceeded')).toBeTruthy();
    });
  });

  it('shows error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<ChatInterface apiUrl="http://localhost:3001/v1" />);
    const input = screen.getByPlaceholderText('Ask about market data...');
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Connection failed. Check your API server.')).toBeTruthy();
    });
  });

  it('shows credits remaining after response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => {
          let called = false;
          return {
            read: () => {
              if (!called) {
                called = true;
                const encoder = new TextEncoder();
                return Promise.resolve({
                  done: false,
                  value: encoder.encode(
                    'data: {"type":"done","tokensUsed":5,"creditsRemaining":4}\n\n',
                  ),
                });
              }
              return Promise.resolve({ done: true, value: undefined });
            },
          };
        },
      },
    });

    render(<ChatInterface apiUrl="http://localhost:3001/v1" />);
    const input = screen.getByPlaceholderText('Ask about market data...');
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('4 queries remaining today')).toBeTruthy();
    });
  });
});
