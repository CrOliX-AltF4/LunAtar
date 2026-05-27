import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { listRuns } from '../../storage/index.js';
import { ResultsScreen } from './ResultsScreen.js';
import { Separator } from '../components/Separator.js';
import type { PipelineRun } from '../../types/index.js';
import type { QAOutput } from '../../agents/types.js';
import type { OnCompanionChange } from '../workspace/types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseVerdict(run: PipelineRun): string {
  if (run.status === 'failed') return 'FAILED ';
  const step = run.steps.find((s) => s.role === 'qa' && s.status === 'completed');
  if (!step?.output) return 'NO QA  ';
  try {
    const qa = JSON.parse(step.output) as QAOutput;
    return qa.verdict === 'pass' ? 'PASS   ' : qa.verdict === 'partial' ? 'PARTIAL' : 'FAIL   ';
  } catch {
    return 'NO QA  ';
  }
}

function verdictColor(v: string): string {
  if (v.startsWith('PASS')) return 'green';
  if (v.startsWith('PARTIAL')) return 'yellow';
  if (v.startsWith('FAIL') || v.startsWith('FAILED')) return 'red';
  return 'gray';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-CA') +
    ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
}

function formatCost(usd: number): string {
  return usd < 0.01 ? `$${(usd * 1000).toFixed(2)}m` : `$${usd.toFixed(4)}`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface HistoryScreenProps {
  onRerun?: (intent: string) => void;
  onCompanionChange?: OnCompanionChange;
}

export function HistoryScreen({ onRerun, onCompanionChange }: HistoryScreenProps) {
  const app = useApp();
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    onCompanionChange?.({ state: 'idle' });
  }, []);

  useEffect(() => {
    listRuns()
      .then((r) => {
        setRuns(r);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  useInput((input, key) => {
    if (mode === 'detail') {
      if (input === 'q' || key.escape) setMode('list');
      return;
    }
    if (key.upArrow) setSelectedIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIndex((i) => Math.min(runs.length - 1, i + 1));
    if (key.pageUp) setSelectedIndex((i) => Math.max(0, i - 10));
    if (key.pageDown) setSelectedIndex((i) => Math.min(runs.length - 1, i + 10));
    if (key.return) setMode('detail');
    if (input === 'r') {
      const run = runs[selectedIndex];
      if (run && onRerun) onRerun(run.intent);
    }
    if (input === 'q') app.exit();
  });

  if (mode === 'detail') {
    const run = runs[selectedIndex];
    if (!run) return null;
    return <ResultsScreen run={run} readOnly />;
  }

  if (!loaded) {
    return (
      <Box flexDirection="column">
        <Separator />
        <Text color="gray">Loading history...</Text>
      </Box>
    );
  }

  if (runs.length === 0) {
    return (
      <Box flexDirection="column">
        <Separator />
        <Text>
          No pipeline runs found. Run <Text color="cyan">lunatar run</Text> to get started.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Separator />
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>
          {'  '}
          {'Date'.padEnd(17)}
          {'  '}
          {'Verdict'.padEnd(9)}
          {'  '}
          {'Intent'.padEnd(45)}
          {'  '}
          {'Cost'.padEnd(9)}
          {'  '}
          {'Tokens'}
        </Text>
        <Text color="gray">{'─'.repeat(100)}</Text>
        {runs.map((run, idx) => {
          const verdict = parseVerdict(run);
          const isSelected = idx === selectedIndex;
          return (
            <Box key={run.id}>
              <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
                {isSelected ? '▶ ' : '  '}
                {formatDate(run.createdAt).padEnd(17)}
                {'  '}
              </Text>
              <Text color={verdictColor(verdict)} bold={isSelected}>
                {verdict.padEnd(9)}
              </Text>
              <Text color={isSelected ? 'cyan' : 'white'}>
                {'  '}
                {truncate(run.intent, 45).padEnd(45)}
                {'  '}
                {formatCost(run.totalCostUsd).padEnd(9)}
                {'  '}
                {run.totalTokens.toLocaleString()}
              </Text>
            </Box>
          );
        })}
        <Text color="gray">{'─'.repeat(100)}</Text>
      </Box>
      <Text color="gray">
        {'↑↓'} navigate <Text color="white">Enter</Text> detail <Text color="white">r</Text> rerun{' '}
        <Text color="white">q</Text> quit
      </Text>
    </Box>
  );
}
