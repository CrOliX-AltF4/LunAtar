import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import chalk from 'chalk';
import { useSystemMetrics } from '../hooks/useSystemMetrics.js';
import { BRAND_NAME, BRAND_TAGLINE, GOLD, COPPER } from '../theme.js';
import { compactPortrait, fullPortrait, eyeSymbol } from './companion-sprite.js';
import type { CompanionState } from './Companion.js';
import packageJson from '../../../package.json';

const { version } = packageJson;

type HeaderMode = 'micro' | 'compact' | 'full';

const DEFAULT_SPEECH: Record<CompanionState, string> = {
  idle: 'The forge awaits.',
  thinking: 'Weighing your arsenal...',
  forging: 'Hammering intent into form...',
  error: 'The forge has faltered. Check the output.',
  done: 'The work is complete. The forge cools.',
};

// RPG-style dialogue bubble (double border, copper)
function bubble(text: string, innerWidth: number): string[] {
  const safe = text.length > innerWidth ? text.slice(0, innerWidth - 3) + '...' : text;
  const padded = safe.padEnd(innerWidth);
  const topBot = '═'.repeat(innerWidth + 4);
  return [
    chalk.hex(COPPER)('╔' + topBot + '╗'),
    chalk.hex(COPPER)('║') +
      ' ' +
      chalk.hex(GOLD)('>') +
      ' ' +
      chalk.white(padded) +
      ' ' +
      chalk.hex(COPPER)('║'),
    chalk.hex(COPPER)('╚' + topBot + '╝'),
  ];
}

interface HeaderProps {
  companionState?: CompanionState;
  speech?: string;
  context?: string; // optional info line (full mode)
}

export function Header({ companionState, speech, context }: HeaderProps) {
  const { stdout } = useStdout();
  const [rows, setRows] = useState(stdout.rows || 40);
  const [cols, setCols] = useState(stdout.columns || 80);
  const { cpuUsagePercent, memUsedMb, memTotalMb } = useSystemMetrics();

  useEffect(() => {
    const onResize = () => {
      setRows(stdout.rows || 40);
      setCols(stdout.columns || 80);
    };
    stdout.on('resize', onResize);
    return () => {
      stdout.removeListener('resize', onResize);
    };
  }, [stdout]);

  const mode: HeaderMode = rows < 20 ? 'micro' : rows < 35 ? 'compact' : 'full';
  const memUsedGb = (memUsedMb / 1024).toFixed(1);
  const memTotalGb = (memTotalMb / 1024).toFixed(1);
  const cpuColor = cpuUsagePercent > 80 ? 'red' : cpuUsagePercent > 50 ? 'yellow' : 'green';
  const speechText =
    speech ?? (companionState !== undefined ? DEFAULT_SPEECH[companionState] : undefined);

  // ─── Micro (1 line) ───────────────────────────────────────────────────────────
  if (mode === 'micro') {
    return (
      <Box justifyContent="space-between" paddingX={1}>
        <Box gap={2}>
          {companionState !== undefined && <Text>{eyeSymbol(companionState)}</Text>}
          <Text>{chalk.hex(GOLD).bold(BRAND_NAME)}</Text>
          {speechText && (
            <Text color="gray" dimColor>
              · {speechText}
            </Text>
          )}
        </Box>
        <Box gap={2}>
          <Text color={cpuColor}>{cpuUsagePercent}%</Text>
          <Text color="gray">{memUsedGb}GB</Text>
        </Box>
      </Box>
    );
  }

  // ─── Compact (5–6 rows) ───────────────────────────────────────────────────────
  if (mode === 'compact') {
    const portrait = companionState !== undefined ? compactPortrait(companionState) : null;
    const bubbleWidth = Math.max(20, Math.min(50, cols - 32));
    const bub = speechText ? bubble(speechText, bubbleWidth) : null;

    return (
      <Box gap={2} paddingX={1} alignItems="flex-start">
        {portrait && (
          <Box flexDirection="column">
            {portrait.map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </Box>
        )}
        <Box flexDirection="column" gap={0} flexGrow={1}>
          <Box justifyContent="space-between">
            <Box gap={2}>
              <Text>{chalk.hex(GOLD).bold(BRAND_NAME)}</Text>
              <Text color="gray" dimColor>
                v{version}
              </Text>
            </Box>
            <Box gap={2}>
              <Text color={cpuColor} bold>
                {cpuUsagePercent}%
              </Text>
              <Text color="gray">{memUsedGb}GB</Text>
            </Box>
          </Box>
          {bub && (
            <Box flexDirection="column" marginTop={1}>
              {bub.map((l, i) => (
                <Text key={i}>{l}</Text>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // ─── Full (12–14 rows) ────────────────────────────────────────────────────────
  const portrait = companionState !== undefined ? fullPortrait(companionState) : null;
  const bubbleWidth = Math.max(30, Math.min(66, cols - 34));
  const bub = speechText ? bubble(speechText, bubbleWidth) : null;

  return (
    <Box gap={3} paddingX={1} alignItems="flex-start">
      {portrait && (
        <Box flexDirection="column">
          {portrait.map((l, i) => (
            <Text key={i}>{l}</Text>
          ))}
        </Box>
      )}
      <Box flexDirection="column" gap={1} flexGrow={1}>
        <Box justifyContent="space-between">
          <Box gap={2}>
            <Text>{chalk.hex(GOLD).bold(BRAND_NAME)}</Text>
            <Text color="gray" dimColor>
              {BRAND_TAGLINE}
            </Text>
            <Text color="gray" dimColor>
              v{version}
            </Text>
          </Box>
          <Box gap={2}>
            <Box gap={1}>
              <Text color="gray">CPU</Text>
              <Text color={cpuColor} bold>
                {cpuUsagePercent}%
              </Text>
            </Box>
            <Box gap={1}>
              <Text color="gray">RAM</Text>
              <Text color="white">
                {memUsedGb}
                <Text color="gray">/{memTotalGb}GB</Text>
              </Text>
            </Box>
          </Box>
        </Box>

        {context && (
          <Text color="gray" dimColor>
            {context}
          </Text>
        )}

        {bub && (
          <Box flexDirection="column">
            {bub.map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
