import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { compactPortrait, fullPortrait, eyeSymbol } from '../components/companion-sprite.js';
import { GOLD, COPPER, STATUS_ICONS, STATUS_COLORS, ROLE_LABELS } from '../theme.js';
import { COMP_WIDTH } from './types.js';
import type { CompanionState } from '../components/Companion.js';
import type { PipelineStep } from '../../types/index.js';

const INNER = COMP_WIDTH - 2;

const CHIPS: Record<CompanionState, string> = {
  idle: '· en attente',
  thinking: '· analyse...',
  forging: '· forge en cours',
  error: '· anomalie',
  done: '· artefact prêt',
};

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

interface CompanionColumnProps {
  state: CompanionState;
  poSpeech?: string;
  qaSpeech?: string;
  guildeSteps?: PipelineStep[];
}

export function CompanionColumn({ state, poSpeech, qaSpeech, guildeSteps }: CompanionColumnProps) {
  const { stdout } = useStdout();
  const rows = stdout.rows || 40;
  const portrait = rows >= 30 ? fullPortrait(state) : compactPortrait(state);
  const hasDialogue = Boolean(poSpeech ?? qaSpeech);
  const hasGuilde = guildeSteps !== undefined && guildeSteps.length > 0;
  const hasCombustible =
    guildeSteps !== undefined && guildeSteps.some((s) => s.tokensUsed !== undefined);

  return (
    <Box width={COMP_WIDTH} flexDirection="column" paddingX={1} gap={0}>
      {/* Portrait */}
      <Box flexDirection="column">
        {portrait.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>

      {/* Name tag */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          RUNE-7 · ÉCHO DE FORGE
        </Text>
      </Box>

      {/* Dialogue section */}
      {hasDialogue && (
        <Box flexDirection="column" marginTop={1} gap={0}>
          <Text color="gray" dimColor>
            {'─'.repeat(INNER)}
          </Text>

          {poSpeech !== undefined && (
            <Box flexDirection="column">
              <Text>
                <Text color="gray" dimColor>
                  [MG]{' '}
                </Text>
                <Text color={GOLD}>{truncate(poSpeech, INNER - 5)}</Text>
              </Text>
            </Box>
          )}

          {poSpeech !== undefined && qaSpeech !== undefined && (
            <Text color="gray" dimColor>
              {'  ↓ transmets ↓'}
            </Text>
          )}

          {qaSpeech !== undefined && (
            <Box flexDirection="column">
              <Text>
                <Text color="gray" dimColor>
                  [IN]{' '}
                </Text>
                <Text color={COPPER}>{truncate(qaSpeech, INNER - 5)}</Text>
              </Text>
            </Box>
          )}

          <Text color="gray" dimColor>
            {'─'.repeat(INNER)}
          </Text>
        </Box>
      )}

      {/* Guilde section */}
      {hasGuilde && (
        <Box flexDirection="column" marginTop={1} gap={0}>
          <Text color="gray" dimColor>
            {'─'.repeat(INNER)}
          </Text>
          <Text color="gray" dimColor>
            {'  GUILDE'}
          </Text>
          {guildeSteps.map((step) => {
            const icon = STATUS_ICONS[step.status];
            const color = STATUS_COLORS[step.status];
            const label = ROLE_LABELS[step.role];
            const dim = step.status === 'pending' || step.status === 'skipped';
            return (
              <Text key={step.id}>
                <Text color={color}>{icon} </Text>
                <Text color="gray">{label}</Text>
                <Text color={color} {...(dim ? { dimColor: true } : {})}>
                  {' '}
                  {step.status}
                </Text>
              </Text>
            );
          })}
          <Text color="gray" dimColor>
            {'─'.repeat(INNER)}
          </Text>
        </Box>
      )}

      {/* Combustible section */}
      {hasCombustible && (
        <Box flexDirection="column" marginTop={1} gap={0}>
          <Text color="gray" dimColor>
            {'─'.repeat(INNER)}
          </Text>
          <Text color="gray" dimColor>
            {'  COMBUSTIBLE'}
          </Text>
          {guildeSteps
            .filter((s) => s.tokensUsed !== undefined)
            .map((step) => {
              const label = ROLE_LABELS[step.role];
              const tokens = step.tokensUsed ?? 0;
              const cost = step.costUsd ?? 0;
              const tokStr = tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens);
              const costStr = cost < 0.01 ? `$${(cost * 1000).toFixed(2)}m` : `$${cost.toFixed(4)}`;
              return (
                <Text key={step.id}>
                  <Text color="gray" dimColor>
                    {label}{' '}
                  </Text>
                  <Text color={STATUS_COLORS[step.status]}>{tokStr.padStart(5)} </Text>
                  <Text color="gray" dimColor>
                    {costStr}
                  </Text>
                </Text>
              );
            })}
          <Text color="gray" dimColor>
            {'─'.repeat(INNER)}
          </Text>
        </Box>
      )}

      {/* State chip */}
      <Box marginTop={1}>
        <Text>
          <Text>{eyeSymbol(state)}</Text>
          <Text color="gray" dimColor>
            {' '}
            {CHIPS[state]}
          </Text>
        </Text>
      </Box>
    </Box>
  );
}
