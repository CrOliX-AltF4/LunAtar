import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../src/providers/registry.js');
vi.mock('../../src/models/recommender.js');
vi.mock('fs');

const { getConfiguredProviders, getProvider } = await import('../../src/providers/registry.js');
const { recommend } = await import('../../src/models/recommender.js');
const fs = await import('fs');

const mockGetConfiguredProviders = vi.mocked(getConfiguredProviders);
const mockGetProvider = vi.mocked(getProvider);
const mockRecommend = vi.mocked(recommend);
const mockExistsSync = vi.mocked(fs.existsSync);
const mockReadFileSync = vi.mocked(fs.readFileSync);

const { askCommand } = await import('../../src/cli/commands/ask.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProvider(complete: ReturnType<typeof vi.fn>) {
  return {
    name: 'groq' as const,
    isConfigured: vi.fn().mockReturnValue(true),
    complete,
  };
}

function makeModel(id = 'llama3-8b', provider = 'groq' as const) {
  return {
    id,
    provider,
    displayName: 'Llama 3 8B',
    contextWindow: 8192,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    avgLatencyMs: 300,
    strengths: ['clarification' as const],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('askCommand', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    errSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  it('exits with error when no provider is configured', async () => {
    mockGetConfiguredProviders.mockReturnValue([]);
    await askCommand('hello', {});
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('No provider configured'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('uses recommender when no provider is specified', async () => {
    const model = makeModel();
    mockGetConfiguredProviders.mockReturnValue([makeProvider(vi.fn()) as never]);
    mockRecommend.mockReturnValue({
      recommended: model,
      alternatives: [],
      reason: 'test',
      estimatedCostUsd: 0,
    });
    const complete = vi.fn().mockResolvedValue({ content: 'pong' });
    mockGetProvider.mockReturnValue(makeProvider(complete) as never);

    await askCommand('ping', {});

    expect(mockRecommend).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'po', taskType: 'clarification' }),
    );
    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'ping' }],
        modelId: model.id,
      }),
    );
    expect(writeSpy).toHaveBeenCalledWith('pong\n');
  });

  it('uses explicit provider and model when specified', async () => {
    const complete = vi.fn().mockResolvedValue({ content: 'result' });
    mockGetConfiguredProviders.mockReturnValue([makeProvider(complete) as never]);
    mockGetProvider.mockReturnValue(makeProvider(complete) as never);

    await askCommand('test', { provider: 'groq', model: 'llama3-70b' });

    expect(mockRecommend).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ modelId: 'llama3-70b' }));
  });

  it('exits when specified provider is not configured', async () => {
    mockGetConfiguredProviders.mockReturnValue([makeProvider(vi.fn()) as never]);
    mockGetProvider.mockReturnValue({
      name: 'groq' as const,
      isConfigured: vi.fn().mockReturnValue(false),
      complete: vi.fn(),
    } as never);

    await askCommand('test', { provider: 'groq' });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('not configured'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('injects file contents before the prompt', async () => {
    const model = makeModel();
    mockGetConfiguredProviders.mockReturnValue([makeProvider(vi.fn()) as never]);
    mockRecommend.mockReturnValue({
      recommended: model,
      alternatives: [],
      reason: '',
      estimatedCostUsd: 0,
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('file content' as never);
    const complete = vi.fn().mockResolvedValue({ content: 'ok' });
    mockGetProvider.mockReturnValue(makeProvider(complete) as never);

    await askCommand('my prompt', { file: ['src/foo.ts'] });

    const call = complete.mock.calls[0]?.[0] as { messages: { content: string }[] } | undefined;
    const content = (call?.messages[0] as { content: string } | undefined)?.content ?? '';
    expect(content).toContain('file content');
    expect(content).toContain('my prompt');
    expect(content.indexOf('file content')).toBeLessThan(content.indexOf('my prompt'));
  });

  it('exits when a requested file does not exist', async () => {
    mockGetConfiguredProviders.mockReturnValue([makeProvider(vi.fn()) as never]);
    mockExistsSync.mockReturnValue(false);

    await askCommand('test', { file: ['missing.ts'] });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('File not found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
