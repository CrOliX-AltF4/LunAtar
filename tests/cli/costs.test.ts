import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/storage/index.js');

const { listRuns } = await import('../../src/storage/index.js');
const mockListRuns = vi.mocked(listRuns);

const { costsCommand, getTodaySpend } = await import('../../src/cli/commands/costs.js');

function makeRun(spentUsd: number, tokens: number, provider: string, daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: Math.random().toString(36),
    createdAt: d.toISOString(),
    intent: 'test',
    steps: [
      {
        id: provider,
        role: 'po' as const,
        taskType: 'clarification' as const,
        status: 'completed' as const,
        provider: provider as 'groq',
        costUsd: spentUsd,
        tokensUsed: tokens,
      },
    ],
    totalCostUsd: spentUsd,
    totalTokens: tokens,
    totalDurationMs: 1000,
    status: 'completed' as const,
  };
}

describe('getTodaySpend', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sums only today runs', async () => {
    mockListRuns.mockResolvedValue([
      makeRun(0.01, 1000, 'groq', 0),
      makeRun(0.02, 2000, 'groq', 0),
      makeRun(0.05, 5000, 'groq', 1), // yesterday
    ]);
    const spend = await getTodaySpend();
    expect(spend).toBeCloseTo(0.03);
  });

  it('returns 0 when no runs today', async () => {
    mockListRuns.mockResolvedValue([makeRun(0.1, 1000, 'groq', 2)]);
    const spend = await getTodaySpend();
    expect(spend).toBe(0);
  });
});

describe('costsCommand --json', () => {
  beforeEach(() => vi.clearAllMocks());

  it('outputs json with today and window totals', async () => {
    mockListRuns.mockResolvedValue([
      makeRun(0.01, 1000, 'groq', 0),
      makeRun(0.02, 2000, 'openai', 0),
      makeRun(0.05, 5000, 'groq', 3),
    ]);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await costsCommand({ json: true, days: 7 });

    expect(writeSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(writeSpy.mock.calls[0]?.[0] as string) as {
      today: { spentUsd: number };
      window: { spentUsd: number; byProvider: Record<string, unknown> };
    };
    expect(output.today.spentUsd).toBeCloseTo(0.03);
    expect(output.window.spentUsd).toBeCloseTo(0.08);
    expect(output.window.byProvider).toHaveProperty('groq');
    expect(output.window.byProvider).toHaveProperty('openai');

    writeSpy.mockRestore();
  });
});
