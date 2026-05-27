import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { listRuns } from '../../storage/index.js';
import { ORACLE_MESSAGES, GOLD } from '../theme.js';
import { Separator } from '../components/Separator.js';
import type { PipelineRun } from '../../types/index.js';

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

function verdictOf(run: PipelineRun): { label: string; color: string } {
  if (run.status === 'failed') return { label: '✗ FAIL  ', color: 'red' };
  const qa = run.steps.find((s) => s.role === 'qa' && s.status === 'completed');
  if (qa?.output) {
    try {
      const out = JSON.parse(qa.output) as { verdict: string };
      if (out.verdict === 'pass') return { label: '✓ PASS  ', color: 'green' };
      if (out.verdict === 'partial') return { label: '◈ PART. ', color: 'yellow' };
      return { label: '✗ FAIL  ', color: 'red' };
    } catch {
      // fall through
    }
  }
  return { label: '✓ DONE  ', color: 'green' };
}

export function IdleView() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [oracle] = useState<string>(
    () => ORACLE_MESSAGES[Math.floor(Math.random() * ORACLE_MESSAGES.length)] ?? ORACLE_MESSAGES[0],
  );

  useEffect(() => {
    void listRuns().then((all) => {
      setRuns([...all].reverse().slice(0, 5));
    });
  }, []);

  return (
    <Box flexDirection="column">
      <Separator />

      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        {/* Oracle */}
        <Text color={GOLD}>⚄ {oracle}</Text>

        {/* Run history */}
        {runs.length > 0 ? (
          <Box flexDirection="column" gap={0} marginTop={1}>
            {runs.map((run) => {
              const { label, color } = verdictOf(run);
              return (
                <Box key={run.id} gap={2}>
                  <Text color={color}>{label}</Text>
                  <Text color="white">{truncate(run.intent, 42)}</Text>
                  <Text color="gray" dimColor>
                    · ${run.totalCostUsd.toFixed(3)} · {formatDate(run.createdAt)}
                  </Text>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Text color="gray" dimColor>
            Aucune forge en mémoire. Lancez votre première incantation ci-dessous.
          </Text>
        )}

        {/* Keybinding hints */}
        <Box marginTop={1} gap={3}>
          <Text color="gray" dimColor>
            <Text color="gray">[h]</Text> historique
          </Text>
          <Text color="gray" dimColor>
            <Text color="gray">[,]</Text> config
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
