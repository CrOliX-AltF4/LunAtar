import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineRun } from '../../src/types/index.js';
import type { QAOutput } from '../../src/agents/types.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../src/storage/index.js');
vi.mock('ink', () => ({
  render: vi.fn().mockReturnValue({ waitUntilExit: () => Promise.resolve() }),
}));

const { listRuns } = await import('../../src/storage/index.js');
const { historyCommand } = await import('../../src/cli/commands/history.js');

const mockListRuns = vi.mocked(listRuns);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const QA_PASS: QAOutput = {
  verdict: 'pass',
  score: 95,
  issues: [],
  suggestions: [],
  requirementsCoverage: {},
};

const QA_FAIL: QAOutput = {
  verdict: 'fail',
  score: 40,
  issues: [{ severity: 'critical', description: 'Missing auth', suggestion: 'Add auth' }],
  suggestions: [],
  requirementsCoverage: {},
};

function makeRun(overrides: Partial<PipelineRun> & { qa?: QAOutput }): PipelineRun {
  const { qa, ...rest } = overrides;
  return {
    id: 'run-1',
    createdAt: '2026-04-15T10:00:00.000Z',
    intent: 'Build a REST API',
    steps: qa
      ? [
          {
            id: 'qa',
            role: 'qa',
            taskType: 'analysis',
            status: 'completed',
            output: JSON.stringify(qa),
          },
        ]
      : [],
    totalCostUsd: 0.0123,
    totalTokens: 4500,
    totalDurationMs: 8000,
    status: 'completed',
    ...rest,
  };
}

let stdoutChunks: string[];

beforeEach(() => {
  vi.clearAllMocks();
  stdoutChunks = [];
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    stdoutChunks.push(String(chunk));
    return true;
  });
});

function getOutput(): string {
  return stdoutChunks.join('');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('historyCommand({ json: true })', () => {
  it('outputs an empty JSON array when no runs exist', async () => {
    mockListRuns.mockResolvedValue([]);
    await historyCommand({ json: true });
    const parsed = JSON.parse(getOutput()) as unknown[];
    expect(parsed).toEqual([]);
  });

  it('outputs a JSON array containing run objects with expected fields', async () => {
    mockListRuns.mockResolvedValue([makeRun({ qa: QA_PASS })]);
    await historyCommand({ json: true });
    const parsed = JSON.parse(getOutput()) as PipelineRun[];
    expect(parsed).toHaveLength(1);
    const [run] = parsed;
    expect(run).toHaveProperty('createdAt');
    expect(run).toHaveProperty('intent');
    expect(run).toHaveProperty('totalCostUsd');
    expect(run).toHaveProperty('totalTokens');
  });

  it('includes the run intent in JSON output for a passing QA run', async () => {
    mockListRuns.mockResolvedValue([makeRun({ qa: QA_PASS })]);
    await historyCommand({ json: true });
    expect(getOutput()).toContain('Build a REST API');
  });

  it('includes the run intent in JSON output for a failing QA run', async () => {
    mockListRuns.mockResolvedValue([makeRun({ qa: QA_FAIL })]);
    await historyCommand({ json: true });
    expect(getOutput()).toContain('Build a REST API');
  });

  it('includes a failed run in JSON output', async () => {
    mockListRuns.mockResolvedValue([makeRun({ status: 'failed', steps: [] })]);
    await historyCommand({ json: true });
    const parsed = JSON.parse(getOutput()) as PipelineRun[];
    expect(parsed[0]?.status).toBe('failed');
  });

  it('preserves the full intent in JSON output (no truncation)', async () => {
    const longIntent =
      'Build a very complex microservices architecture with event sourcing and CQRS patterns';
    mockListRuns.mockResolvedValue([makeRun({ intent: longIntent, qa: QA_PASS })]);
    await historyCommand({ json: true });
    expect(getOutput()).toContain(longIntent);
  });

  it('respects the limit parameter', async () => {
    const runs = Array.from({ length: 5 }, (_, i) =>
      makeRun({ id: `run-${String(i)}`, qa: QA_PASS }),
    );
    mockListRuns.mockResolvedValue(runs);
    await historyCommand({ json: true, limit: 2 });
    const parsed = JSON.parse(getOutput()) as unknown[];
    expect(parsed).toHaveLength(2);
  });
});

describe('historyCommand() — TUI mode', () => {
  it('renders the TUI when json option is not set', async () => {
    mockListRuns.mockResolvedValue([makeRun({ qa: QA_PASS })]);
    const { render } = await import('ink');
    await historyCommand({});
    expect(render).toHaveBeenCalled();
  });
});
