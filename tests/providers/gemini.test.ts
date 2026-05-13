import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/providers/config.js', () => ({
  getApiKey: vi.fn(),
}));

const mockSendMessage = vi.fn();
const mockStartChat = vi.fn().mockReturnValue({ sendMessage: mockSendMessage });
const mockGetGenerativeModel = vi.fn().mockReturnValue({ startChat: mockStartChat });

vi.mock('@google/generative-ai', () => {
  function GoogleGenerativeAIMock() {
    return { getGenerativeModel: mockGetGenerativeModel };
  }
  return { GoogleGenerativeAI: GoogleGenerativeAIMock };
});

const { getApiKey } = await import('../../src/providers/config.js');
const { GeminiProvider } = await import('../../src/providers/gemini.js');

const mockGetApiKey = vi.mocked(getApiKey);

describe('GeminiProvider', () => {
  let provider: InstanceType<typeof GeminiProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStartChat.mockReturnValue({ sendMessage: mockSendMessage });
    mockGetGenerativeModel.mockReturnValue({ startChat: mockStartChat });
    provider = new GeminiProvider();
  });

  it('isConfigured returns false when no key', () => {
    mockGetApiKey.mockReturnValue(undefined);
    expect(provider.isConfigured()).toBe(false);
  });

  it('isConfigured returns true when key present', () => {
    mockGetApiKey.mockReturnValue('gemini-key');
    expect(provider.isConfigured()).toBe(true);
  });

  it('complete throws when no key', async () => {
    mockGetApiKey.mockReturnValue(undefined);
    await expect(
      provider.complete({ modelId: 'm', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow('Gemini API key not configured');
  });

  it('complete returns mapped response', async () => {
    mockGetApiKey.mockReturnValue('gemini-key');
    mockSendMessage.mockResolvedValue({
      response: {
        text: () => 'Gemini reply',
        usageMetadata: { promptTokenCount: 8, candidatesTokenCount: 15 },
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const result = await provider.complete({
      modelId: 'gemini-1.5-pro',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('Gemini reply');
    expect(result.provider).toBe('gemini');
  });
});
