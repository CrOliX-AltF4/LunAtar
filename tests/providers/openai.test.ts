import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/providers/config.js', () => ({
  getApiKey: vi.fn(),
}));

const mockCreate = vi.fn();
vi.mock('openai', () => {
  function OpenAIMock() {
    return { chat: { completions: { create: mockCreate } } };
  }
  return { default: OpenAIMock };
});

const { getApiKey } = await import('../../src/providers/config.js');
const { OpenAIProvider } = await import('../../src/providers/openai.js');

const mockGetApiKey = vi.mocked(getApiKey);

describe('OpenAIProvider', () => {
  let provider: InstanceType<typeof OpenAIProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider();
  });

  it('isConfigured returns false when no key', () => {
    mockGetApiKey.mockReturnValue(undefined);
    expect(provider.isConfigured()).toBe(false);
  });

  it('isConfigured returns true when key present', () => {
    mockGetApiKey.mockReturnValue('sk-test');
    expect(provider.isConfigured()).toBe(true);
  });

  it('complete throws when no key', async () => {
    mockGetApiKey.mockReturnValue(undefined);
    await expect(
      provider.complete({ modelId: 'm', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow('OpenAI API key not configured');
  });

  it('complete returns mapped response', async () => {
    mockGetApiKey.mockReturnValue('sk-test');
    mockCreate.mockResolvedValue({
      model: 'gpt-4o',
      choices: [{ message: { content: 'Reply', tool_calls: undefined }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 5, completion_tokens: 10 },
    });

    const result = await provider.complete({
      modelId: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('Reply');
    expect(result.provider).toBe('openai');
    expect(result.stopReason).toBe('end_turn');
  });
});
