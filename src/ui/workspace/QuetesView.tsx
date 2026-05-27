import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { listRuns } from '../../storage/index.js';
import { Separator } from '../components/Separator.js';
import type { PipelineRun } from '../../types/index.js';
import type { QAOutput } from '../../agents/types.js';

type QuetesTab = 'completed' | 'failed' | 'running';

const TAB_LABELS: Record<QuetesTab, string> = {
  completed: 'Terminées',
  failed: 'Échouées',
  running: 'En cours',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('fr-CA') +
    ' ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function parseVerdict(run: PipelineRun): string {
  const step = run.steps.find((s) => s.role === 'qa' && s.status === 'completed');
  if (!step?.output) return '—';
  try {
    const qa = JSON.parse(step.output) as QAOutput;
    return `${qa.verdict.toUpperCase()} ${String(qa.score)}/100`;
  } catch {
    return '—';
  }
}

interface QuetesViewProps {
  onOpenRun: (run: PipelineRun) => void;
  onBack: () => void;
}

export function QuetesView({ onOpenRun, onBack }: QuetesViewProps) {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [tab, setTab] = useState<QuetesTab>('completed');
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    void listRuns().then((r) => {
      setRuns(r);
    });
  }, []);

  const filtered = runs.filter((r) => r.status === tab);

  useInput((input, key) => {
    if (input === '1') {
      setTab('completed');
      setSelected(0);
    }
    if (input === '2') {
      setTab('failed');
      setSelected(0);
    }
    if (input === '3') {
      setTab('running');
      setSelected(0);
    }
    if (key.upArrow) setSelected((i) => Math.max(0, i - 1));
    if (key.downArrow) setSelected((i) => Math.min(Math.max(0, filtered.length - 1), i + 1));
    if (key.return && filtered[selected] !== undefined) onOpenRun(filtered[selected]);
    if (key.escape || input === 'q') onBack();
  });

  const tabs: QuetesTab[] = ['completed', 'failed', 'running'];

  return (
    <Box flexDirection="column">
      <Separator />
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <Text color="gray" bold>
          Annales de la Forge
        </Text>

        <Box gap={0}>
          {tabs.map((t, i) => {
            const isActive = t === tab;
            return (
              <Box key={t} paddingX={1}>
                <Text color={isActive ? 'cyan' : 'gray'} {...(isActive ? { bold: true } : {})}>
                  [{String(i + 1)}] {TAB_LABELS[t]}
                </Text>
              </Box>
            );
          })}
        </Box>

        {filtered.length === 0 ? (
          <Text color="gray" dimColor>
            Aucune quête dans cette catégorie.
          </Text>
        ) : (
          <Box flexDirection="column" gap={0} marginTop={1}>
            {filtered.map((run, i) => {
              const isSelected = i === selected;
              const verdict =
                run.status === 'completed' ? parseVerdict(run) : run.status.toUpperCase();
              const color =
                run.status === 'failed' ? 'red' : run.status === 'completed' ? 'green' : 'cyan';
              return (
                <Box key={run.id} gap={2}>
                  <Text color={isSelected ? 'cyan' : 'gray'}>{isSelected ? '▶' : ' '}</Text>
                  <Text color={color}>{verdict.padEnd(12)}</Text>
                  <Text
                    color={isSelected ? 'white' : 'gray'}
                    {...(isSelected ? { bold: true } : {})}
                  >
                    {truncate(run.intent, 40)}
                  </Text>
                  <Text color="gray" dimColor>
                    {formatDate(run.createdAt)}
                  </Text>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Box gap={3} paddingX={1} marginTop={1}>
        <Text color="gray">
          <Text color="cyan">[↑↓]</Text> naviguer
        </Text>
        <Text color="gray">
          <Text color="cyan">[↵]</Text> ouvrir
        </Text>
        <Text color="gray">
          <Text color="cyan">[Esc]</Text> retour
        </Text>
      </Box>
    </Box>
  );
}
