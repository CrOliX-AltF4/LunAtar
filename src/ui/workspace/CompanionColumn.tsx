import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { compactPortrait, fullPortrait, eyeSymbol } from '../components/companion-sprite.js';
import { GOLD, COPPER } from '../theme.js';
import { COMP_WIDTH } from './types.js';
import type { CompanionState } from '../components/Companion.js';

const INNER = COMP_WIDTH - 2; // 28 chars for content (1 padding each side)

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
}

export function CompanionColumn({ state, poSpeech, qaSpeech }: CompanionColumnProps) {
  const { stdout } = useStdout();
  const rows = stdout.rows || 40;
  const portrait = rows >= 30 ? fullPortrait(state) : compactPortrait(state);
  const hasDialogue = Boolean(poSpeech ?? qaSpeech);

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
