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
const { NimProvider } = await import('../../src/providers/nim.js');

const mockGetApiKey = vi.mocked(getApiKey);

describe('NimProvider', () => {
  let provider: InstanceType<typeof NimProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new NimProvider();
  });

  it('isConfigured returns false when no key', () => {
    mockGetApiKey.mockReturnValue(undefined);
    expect(provider.isConfigured()).toBe(false);
  });

  it('isConfigured returns true when key present', () => {
    mockGetApiKey.mockReturnValue('nim-key');
    expect(provider.isConfigured()).toBe(true);
  });

  it('complete throws when no key', async () => {
    mockGetApiKey.mockReturnValue(undefined);
    await expect(
      provider.complete({ modelId: 'm', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow('NVIDIA NIM API key not configured');
  });

  it('complete returns mapped response', async () => {
    mockGetApiKey.mockReturnValue('nim-key');
    mockCreate.mockResolvedValue({
      model: 'meta/llama-3.1-70b-instruct',
      choices: [
        { message: { content: 'NIM reply', tool_calls: undefined }, finish_reason: 'stop' },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 10 },
    });

    const result = await provider.complete({
      modelId: 'meta/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('NIM reply');
    expect(result.provider).toBe('nim');
  });
});
