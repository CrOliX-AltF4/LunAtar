import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GroqProvider as GroqProviderType } from '../../src/providers/groq.js';

const mockCreate = vi.fn();

vi.mock('../../src/providers/config.js', () => ({
  getApiKey: vi.fn(),
}));

vi.mock('groq-sdk', () => {
  function GroqMock() {
    return { chat: { completions: { create: mockCreate } } };
  }
  return { default: GroqMock };
});

const { getApiKey } = await import('../../src/providers/config.js');
const { GroqProvider } = (await import('../../src/providers/groq.js')) as {
  GroqProvider: typeof GroqProviderType;
};

const mockGetApiKey = vi.mocked(getApiKey);

function makeGroqResponse(overrides: Record<string, unknown> = {}) {
  return {
    model: 'llama-3.3-70b-versatile',
    choices: [
      {
        message: { content: 'Hello', tool_calls: undefined },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 20 },
    ...overrides,
  };
}

describe('GroqProvider', () => {
  let provider: GroqProviderType;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GroqProvider();
  });

  it('isConfigured returns false when no key', () => {
    mockGetApiKey.mockReturnValue(undefined);
    expect(provider.isConfigured()).toBe(false);
  });

  it('isConfigured returns true when key present', () => {
    mockGetApiKey.mockReturnValue('test-key');
    expect(provider.isConfigured()).toBe(true);
  });

  it('complete throws when no API key configured', async () => {
    mockGetApiKey.mockReturnValue(undefined);
    await expect(
      provider.complete({ modelId: 'm', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow('Groq API key not configured');
  });

  it('complete returns mapped response', async () => {
    mockGetApiKey.mockReturnValue('test-key');
    mockCreate.mockResolvedValue(makeGroqResponse());

    const result = await provider.complete({
      modelId: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('Hello');
    expect(result.inputTokens).toBe(10);
    expect(result.outputTokens).toBe(20);
    expect(result.provider).toBe('groq');
    expect(result.stopReason).toBe('end_turn');
  });

  it('complete maps tool_calls finish_reason to tool_use', async () => {
    mockGetApiKey.mockReturnValue('test-key');
    mockCreate.mockResolvedValue(
      makeGroqResponse({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [{ id: 'tc1', function: { name: 'my_tool', arguments: '{"a":1}' } }],
            },
            finish_reason: 'tool_calls',
          },
        ],
      }),
    );

    const result = await provider.complete({
      modelId: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'call tool' }],
    });

    expect(result.stopReason).toBe('tool_use');
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls?.[0]?.name).toBe('my_tool');
    expect(result.toolCalls?.[0]?.input).toEqual({ a: 1 });
  });

  it('complete maps length finish_reason to max_tokens', async () => {
    mockGetApiKey.mockReturnValue('test-key');
    mockCreate.mockResolvedValue(
      makeGroqResponse({
        choices: [
          { message: { content: 'truncated', tool_calls: undefined }, finish_reason: 'length' },
        ],
      }),
    );

    const result = await provider.complete({
      modelId: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result.stopReason).toBe('max_tokens');
  });

  it('complete throws when Groq returns no choices', async () => {
    mockGetApiKey.mockReturnValue('test-key');
    mockCreate.mockResolvedValue({ choices: [], model: 'x', usage: {} });

    await expect(
      provider.complete({ modelId: 'm', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow('Groq returned no choices');
  });
});
