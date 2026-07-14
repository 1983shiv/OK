'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getAccessToken } from '../../lib/api-client';
import { ChatMessage } from './ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  apiUrl: string;
}

export function ChatInterface({ apiUrl }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    const token = getAccessToken();
    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: userMessage.content, index: 'NIFTY', sessionId }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        let errorMsg = 'Chat request failed';
        try {
          const errData = await response.json();
          errorMsg = errData.error?.message ?? errData.message ?? errorMsg;
        } catch {}
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError(errorMsg);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError('No response stream available');
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(trimmed.slice(6));

            if (parsed.type === 'token') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + parsed.content } : m,
                ),
              );
            } else if (parsed.type === 'done') {
              setCreditsRemaining(parsed.creditsRemaining);
              setIsStreaming(false);
            } else if (parsed.type === 'error') {
              setError(parsed.message);
              setMessages((prev) => prev.filter((m) => m.id !== assistantId));
              setIsStreaming(false);
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Connection failed. Check your API server.');
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">AI Market Analyst</h1>
        {creditsRemaining !== null && (
          <span className="text-sm text-[var(--muted)]">
            {creditsRemaining} queries remaining today
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-xl font-semibold text-[var(--muted)] mb-2">Ask about market data</p>
            <p className="text-sm text-[var(--muted)] max-w-md">
              Try asking about Nifty sentiment, PCR trends, OI build-ups, or unusual activity.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content || (isStreaming && msg.role === 'assistant' ? '...' : '')}
          />
        ))}

        {error && (
          <div className="card p-4 mb-4 border border-red-500/30 bg-red-500/10">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-[var(--border)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about market data..."
          disabled={isStreaming}
          className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--brand)] disabled:opacity-50"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={handleStop}
            className="px-4 py-3 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 rounded-lg text-sm font-medium bg-[var(--brand)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}
