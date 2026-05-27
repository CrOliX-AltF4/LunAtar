import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import {
  SPINNER_FRAMES,
  SPINNER_INTERVAL_MS,
  STATUS_COLORS,
  STATUS_ICONS,
  ROLE_TASK_LABELS,
} from '../theme.js';
import type { PipelineStep } from '../../types/index.js';

// ─── Summary parser ───────────────────────────────────────────────────────────

function parseSummary(step: PipelineStep): string {
  if (!step.output) return '—';
  try {
    const raw = JSON.parse(step.output) as Record<string, unknown>;
    switch (step.role) {
      case 'po': {
        const rawGoal = raw['clarifiedGoal'];
        const rawReqs = raw['requirements'];
        const goal = typeof rawGoal === 'string' ? rawGoal : '';
        const reqs = Array.isArray(rawReqs) ? rawReqs : [];
        const truncated = goal.length > 55 ? goal.slice(0, 54) + '…' : goal;
        return `${truncated} (${String(reqs.length)} req.)`;
      }
      case 'planner': {
        const rawArch = raw['architecture'];
        const rawTasks = raw['tasks'];
        const arch = typeof rawArch === 'string' ? rawArch : '';
        const tasks = Array.isArray(rawTasks) ? rawTasks : [];
        const truncated = arch.length > 50 ? arch.slice(0, 49) + '…' : arch;
        return `${truncated} · ${String(tasks.length)} tâches`;
      }
      case 'dev': {
        const rawFiles = raw['files'];
        const files = Array.isArray(rawFiles) ? rawFiles : [];
        return `${String(files.length)} fichier(s) forgé(s)`;
      }
      case 'qa': {
        const rawVerdict = raw['verdict'];
        const rawScore = raw['score'];
        const verdict = typeof rawVerdict === 'string' ? rawVerdict : '—';
        const score = typeof rawScore === 'number' ? rawScore : 0;
        return `verdict: ${verdict.toUpperCase()} · score: ${String(score)}/100`;
      }
    }
  } catch {
    return step.error ?? 'output non lisible';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ParcheminViewProps {
  steps: PipelineStep[];
}

export function ParcheminView({ steps }: ParcheminViewProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, SPINNER_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, []);

  const spinner = SPINNER_FRAMES[frame] ?? '⠋';
  const active = steps.filter((s) => s.status !== 'skipped');

  if (active.length === 0) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text color="gray" dimColor>
          Parchemin vierge — en attente de l'invocation…
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text color="gray" dimColor>
        ─── Parchemin de forge ───
      </Text>
      {active.map((step) => {
        const taskLabel = ROLE_TASK_LABELS[step.role];
        const icon = STATUS_ICONS[step.status];
        const color = STATUS_COLORS[step.status];
        const dim = step.status === 'pending';

        if (step.status === 'running') {
          return (
            <Box key={step.id} gap={1}>
              <Text color="cyan">{spinner}</Text>
              <Text color="cyan" bold>
                {taskLabel}
              </Text>
              <Text color="gray" dimColor>
                en cours…
              </Text>
            </Box>
          );
        }

        if (step.status === 'completed' || step.status === 'failed') {
          const summary =
            step.status === 'failed' ? (step.error ?? 'étape échouée') : parseSummary(step);
          return (
            <Box key={step.id} flexDirection="column" gap={0}>
              <Box gap={1}>
                <Text color={color}>{icon}</Text>
                <Text color={color} bold>
                  {taskLabel}
                </Text>
              </Box>
              <Box paddingLeft={2}>
                <Text color="gray">{summary}</Text>
              </Box>
            </Box>
          );
        }

        // pending
        return (
          <Box key={step.id} gap={1}>
            <Text color="gray" {...(dim ? { dimColor: true } : {})}>
              {icon}
            </Text>
            <Text color="gray" {...(dim ? { dimColor: true } : {})}>
              {taskLabel}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
